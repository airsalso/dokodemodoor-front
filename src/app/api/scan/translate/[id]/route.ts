import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import { getActiveScan, setActiveScan } from "@/lib/active-scan";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");
const STORE_PATH = process.env.STORE_PATH || "/home/ubuntu/dokodemodoor/.dokodemodoor-store.json";
const ENGINE_DIR = process.env.ENGINE_DIR || "/home/ubuntu/dokodemodoor";

type StoreSession = {
  webUrl?: string;
  repoPath?: string;
  targetRepo?: string;
};

type StoreData = {
  sessions?: Record<string, StoreSession>;
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing scan ID" }, { status: 400 });

    // Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      await jwtVerify(token, SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if any scan is already running in memory
    if (getActiveScan()) {
      return NextResponse.json({ error: "Another process (scan or translation) is already running." }, { status: 400 });
    }

    // Get Scan Details
    const scan = await prisma.scan.findUnique({ where: { id } });
    if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });

    const { targetUrl, sourcePath } = scan;

    // Find Session ID / Source Dir from store
    let sourceDir = "";
    if (fs.existsSync(STORE_PATH)) {
      try {
        const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as StoreData;
        const sessions = store.sessions || {};

        for (const value of Object.values(sessions)) {
          // Normalize paths for comparison
          const storePath = path.resolve(value.targetRepo || value.repoPath || "");
          const dbPath = path.resolve(sourcePath || "");

          if (value.webUrl === targetUrl && storePath === dbPath) {
            sourceDir = value.targetRepo || value.repoPath || "";
            break;
          }
        }
      } catch (e) {
        console.error("Error parsing store file:", e);
      }
    }

    if (!sourceDir) {
      console.error(`[TRANSLATE] No matching session for URL: ${targetUrl}, Path: ${sourcePath}`);
      return NextResponse.json({ error: "Matching session not found in engine store" }, { status: 404 });
    }

    const reportPath = path.join(sourceDir, "deliverables", "comprehensive_security_assessment_report.md");

    if (!fs.existsSync(reportPath)) {
      return NextResponse.json({ error: "Report file not found. Generate the report first." }, { status: 404 });
    }

    // Preserve existing logs from DB if any
    const existingLogs = scan.logs ? [scan.logs] : [];

    // Initialize activeScan in memory for logging and status tracking
    setActiveScan({
      id: id,
      target: targetUrl,
      status: "translating",
      vulnerabilities: scan.vulnerabilities,
      startTime: Date.now(),
      logs: [
        ...existingLogs,
        `\n\n${"=".repeat(60)}\n🌐 [TRANSLATE] Starting Korean translation\n📄 Target: ${reportPath}\n${"=".repeat(60)}\n`
      ],
      sourcePath: sourcePath || undefined
    });

    // Update DB status to reflect translation is happening
    await prisma.scan.update({
      where: { id },
      data: { status: "translating" }
    });

    // Spawn the translation command
    const proc = spawn("npm", ["run", "translate-report", reportPath], {
      cwd: ENGINE_DIR,
      env: { ...process.env, FORCE_COLOR: "3" }
    });

    const active = getActiveScan();
    if (active) {
      active.process = proc;
    }

    proc.stdout.on("data", (data) => {
      const lines = data.toString();
      const active = getActiveScan();
      if (active && active.id === id) {
        active.logs.push(lines);
        const maxLogs = parseInt(process.env.MAX_LOG_LINES_IN_MEMORY || "5000");
        if (active.logs.length > maxLogs) {
          active.logs.shift();
        }
      }
    });

    proc.stderr.on("data", (data) => {
      const lines = data.toString();
      const active = getActiveScan();
      if (active && active.id === id) {
        active.logs.push(lines);
      }
    });

    proc.on("close", async (code) => {
      console.log(`[TRANSLATE] Command exited with code ${code}`);

      const active = getActiveScan();
      const logsToStore = (active && active.id === id) ? active.logs.join("") : "";

      await prisma.scan.update({
        where: { id },
        data: {
          status: "completed",
          logs: logsToStore
        }
      });

      if (getActiveScan()?.id === id) {
        setActiveScan(null);
      }
    });

    return NextResponse.json({ success: true, message: "Translation started" });

  } catch (err: unknown) {
    console.error("Translation trigger error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
