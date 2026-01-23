import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
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
    await jwtVerify(token, SECRET);

    // Get Scan Details
    const scan = await prisma.scan.findUnique({ where: { id } });
    if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });

    const { targetUrl, sourcePath } = scan;

    // Find Session ID from store (same logic as status)
    let sessionId = "";
    if (fs.existsSync(STORE_PATH)) {
      const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as StoreData;
      const sessions = store.sessions || {};

      console.log(`Searching for session matching: URL=${targetUrl}, Path=${sourcePath}`);
      for (const [key, value] of Object.entries(sessions)) {
        console.log(`Checking session ${key}: URL=${value.webUrl}, Path=${value.repoPath}`);
        if (value.webUrl === targetUrl && value.repoPath === sourcePath) {
          sessionId = key; // Use the full session ID for the deleteSession call
          console.log(`Matched! sessionId=${sessionId}`);
          break;
        }
      }
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Matching session not found in engine store" }, { status: 404 });
    }

    // Execute cleanup command
    const command = `npx zx ./dokodemodoor.mjs --cleanup --session ${sessionId}`;
    console.log(`Executing Cleanup: ${command}`);
    const { stdout, stderr } = await execPromise(command, { cwd: ENGINE_DIR });
    console.log(`Cleanup Output:`, { stdout, stderr });

    // Update DB to reflect cleanup (set vulnerabilities to 0 since files are gone)
    await prisma.scan.update({
      where: { id },
      data: { vulnerabilities: 0 }
    });

    return NextResponse.json({
      message: "Cleanup completed successfully",
      output: stdout || stderr
    });

  } catch (err: unknown) {
    console.error("Cleanup error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
