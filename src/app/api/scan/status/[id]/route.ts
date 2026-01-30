import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { exec } from "child_process";
import { promisify } from "util";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import fs from "fs";
import path from "path";

const execPromise = promisify(exec);
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");
const ENGINE_DIR = process.env.ENGINE_DIR || "/home/ubuntu/dokodemodoor";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing scan ID" }, { status: 400 });

    // Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await jwtVerify(token, SECRET);

    // Get Scan Details including sessionId
    const scan = await prisma.scan.findUnique({ where: { id } });
    if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });

    let { sessionId } = scan;
    const STORE_PATH = process.env.STORE_PATH || path.join(ENGINE_DIR, ".dokodemodoor-store.json");

    if (!sessionId) {
      console.log(`[Status] Session ID missing for scan ${id}. Attempting fallback from ${STORE_PATH}...`);
      try {
        if (fs.existsSync(STORE_PATH)) {
          const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
          const sessions = store.sessions || {};

          let matchedSessionId = "";
          let latestTimestamp = 0;
          const scanStartTime = scan.startTime.getTime();

          for (const [sid, sessionData] of Object.entries(sessions)) {
            const session = sessionData as { webUrl?: string; repoPath?: string; createdAt?: string };
            if (session.webUrl === scan.targetUrl && (session.repoPath === scan.sourcePath || !scan.sourcePath)) {
              const sessionTime = session.createdAt ? new Date(session.createdAt).getTime() : 0;
              const timeDiff = Math.abs(sessionTime - scanStartTime);
              if (!matchedSessionId || timeDiff < Math.abs(latestTimestamp - scanStartTime)) {
                latestTimestamp = sessionTime;
                matchedSessionId = sid;
              }
            }
          }

          if (matchedSessionId) {
            console.log(`[Status] Found matching session for scan ${id}: ${matchedSessionId}`);
            sessionId = matchedSessionId;
            await prisma.scan.update({
              where: { id },
              data: { sessionId: matchedSessionId }
            });
          }
        }
      } catch (storeErr) {
        console.error(`[Status] Fallback recovery failed for scan ${id}:`, storeErr);
      }
    }

    if (!sessionId) {
      return NextResponse.json({
        error: "Session ID not found for this scan and could not be recovered from engine store."
      }, { status: 404 });
    }

    console.log(`[Status] Using session ID from DB: ${sessionId}`);

    // Execute status command with --session flag (per engine help documentation)
    // Use FULL session ID from DB
    const command = `npx zx ./dokodemodoor.mjs --status --session ${sessionId}`;
    console.log(`[Status] Executing: ${command}`);
    const { stdout, stderr } = await execPromise(command, { cwd: ENGINE_DIR });

    return NextResponse.json({
      status: stdout || stderr,
      sessionId,
      command // Return command for debugging
    });

  } catch (err: unknown) {
    console.error("Status check error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
