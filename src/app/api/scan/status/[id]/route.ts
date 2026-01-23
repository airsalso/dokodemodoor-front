import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const execPromise = promisify(exec);
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing scan ID" }, { status: 400 });

    // Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await jwtVerify(token, SECRET);

    // Get Scan Details
    const scan = await prisma.scan.findUnique({ where: { id } });
    if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });

    const { targetUrl, sourcePath } = scan;

    // Find Session ID from store
    let sessionId = "";
    if (fs.existsSync(STORE_PATH)) {
      const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as StoreData;
      const sessions = store.sessions || {};

      for (const [key, value] of Object.entries(sessions)) {
        // Normalize paths for comparison
        const storePath = path.resolve(value.targetRepo || value.repoPath || "");
        const dbPath = path.resolve(sourcePath || "");

        if (value.webUrl === targetUrl && storePath === dbPath) {
          sessionId = key.substring(0, 8);
          break;
        }
      }
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Matching session not found in engine store" }, { status: 404 });
    }

    // Execute status command
    const command = `npx zx ./dokodemodoor.mjs --status --session ${sessionId}`;
    const { stdout, stderr } = await execPromise(command, { cwd: ENGINE_DIR });

    return NextResponse.json({
      status: stdout || stderr,
      sessionId
    });

  } catch (err: unknown) {
    console.error("Status check error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
