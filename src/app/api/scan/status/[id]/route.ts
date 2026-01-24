import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exec } from "child_process";
import { promisify } from "util";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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

    const { sessionId } = scan;

    // Check if sessionId is available
    if (!sessionId) {
      return NextResponse.json({
        error: "Session ID not found for this scan. The scan may have been created before session tracking was implemented."
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
