import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exec, spawn, type ChildProcess } from "child_process";
import { promisify } from "util";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { processScanFindings } from "@/lib/scan-utils";

const execPromise = promisify(exec);
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");
const ENGINE_DIR = process.env.ENGINE_DIR || "/home/ubuntu/dokodemodoor";

declare global {
  var activeScan: {
    id: string;
    target: string;
    status: "running" | "completed" | "failed" | "translating";
    startTime: number;
    logs: string[];
    vulnerabilities?: number;
    sourcePath?: string;
    targetUrl?: string;
    config?: string;
    sessionId?: string;
    duration?: string;
    process?: ChildProcess | null;
  } | null;
}


export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action, agent } = (await req.json()) as { action?: string; agent?: string };

    if (!id || !action || !agent) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await jwtVerify(token, SECRET);

    // Check for active scan if we are rerunning
    if (action === 'rerun' && global.activeScan) {
      return NextResponse.json({ error: "A scan is already in progress." }, { status: 400 });
    }

    // Get Scan Details
    const scan = await prisma.scan.findUnique({ where: { id } });
    if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });

    const { sessionId, sourcePath, targetUrl } = scan;

    // Check if sessionId is available
    if (!sessionId) {
      return NextResponse.json({
        error: "Session ID not found for this scan. The scan may have been created before session tracking was implemented."
      }, { status: 404 });
    }

    console.log(`[Agent Action] Using session ID from DB: ${sessionId}`);


    // Sluggify agent name (e.g., "pre recon" -> "pre-recon")
    const agentSlug = agent.trim().toLowerCase().replace(/\s+/g, '-');

    if (action === 'rerun') {
      // Handle Rerun with Spawn (Async)
      const command = `./dokodemodoor.mjs`;
      const args = ["--rerun", agentSlug, "--session", sessionId];

      const scanData: NonNullable<typeof global.activeScan> = {
        id,
        target: targetUrl,
        status: "running" as const,
        startTime: Date.now(),
        vulnerabilities: scan.vulnerabilities || 0,
        logs: [],
        process: null as ChildProcess | null
      };
      global.activeScan = scanData;

      await prisma.scan.update({
        where: { id },
        data: { status: "running" }
      });

      const proc = spawn("npx", ["zx", command, ...args], {
        cwd: ENGINE_DIR,
        env: { ...process.env, FORCE_COLOR: "3" }
      });

      global.activeScan.process = proc;

      proc.stdout.on("data", (data) => {
        const text = data.toString();
        global.activeScan?.logs.push(text);
        const maxLogs = parseInt(process.env.MAX_LOG_LINES_IN_MEMORY || "5000");
        if (global.activeScan && global.activeScan.logs.length > maxLogs) global.activeScan.logs.shift();
      });

      proc.stderr.on("data", (data) => {
        global.activeScan?.logs.push(data.toString());
      });

      proc.on("close", async (code) => {
        const status = code === 0 ? "completed" : "failed";

        // Update findings on close
        const vulnCount = await processScanFindings(id, sourcePath);

        await prisma.scan.update({
          where: { id },
          data: {
            status,
            logs: scanData.logs.join(""),
            vulnerabilities: vulnCount,
            endTime: new Date()
          }
        });
        global.activeScan = null;
      });

      return NextResponse.json({ message: `Rerun started for ${agentSlug}`, isRunning: true });

    } else {
      // Handle Rollback with simple Exec (Sync-ish)
      const command = `npx zx ./dokodemodoor.mjs --rollback-to ${agentSlug} --session ${sessionId}`;
      console.log(`Executing Agent Rollback: ${command}`);
      const { stdout, stderr } = await execPromise(command, { cwd: ENGINE_DIR });

      // After successful rollback, update findings
      const vulnCount = await processScanFindings(id, sourcePath);
      await prisma.scan.update({
        where: { id },
        data: { vulnerabilities: vulnCount }
      });

      return NextResponse.json({
        message: `Rollback completed for ${agentSlug}`,
        output: stdout || stderr,
        vulnerabilities: vulnCount
      });
    }

  } catch (err: unknown) {
    console.error("Agent action error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
