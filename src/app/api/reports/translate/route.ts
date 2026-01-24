import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { captureScanReports } from "@/lib/scan-utils";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");
const ENGINE_DIR = process.env.ENGINE_DIR || "/home/ubuntu/dokodemodoor";

// Use global to survive Hot Module Replacement (HMR) in Dev mode
declare global {
  var reportTranslations: Set<string> | undefined;
}

if (!global.reportTranslations) {
  global.reportTranslations = new Set();
}
const ongoingTranslations = global.reportTranslations;

export async function GET() {
  return NextResponse.json({ translatingPaths: Array.from(ongoingTranslations) });
}

export async function POST(req: Request) {
  let requestPath = "";
  try {
    const { filePath } = await req.json();
    if (!filePath) {
      return NextResponse.json({ error: "Missing filePath" }, { status: 400 });
    }
    requestPath = filePath;

    // Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      await jwtVerify(token, SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const REPOS_BASE_DIR = process.env.REPOS_DIR || "/home/ubuntu/dokodemodoor/repos";

    // Security check
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(REPOS_BASE_DIR, filePath);

    if (!resolvedPath.startsWith(REPOS_BASE_DIR) && !resolvedPath.includes("/deliverables/")) {
        return NextResponse.json({ error: "Forbidden path" }, { status: 403 });
    }

    if (!fs.existsSync(resolvedPath)) {
      console.error(`[TRANSLATE] File not found at: ${resolvedPath}`);
      return NextResponse.json({ error: `File not found at ${resolvedPath}` }, { status: 404 });
    }

    // Duplicate Prevention (using the persistent global set)
    if (ongoingTranslations.has(requestPath)) {
      return NextResponse.json({ error: "Translation for this file is already in progress." }, { status: 400 });
    }

    ongoingTranslations.add(requestPath);

    return new Promise<NextResponse>((resolve) => {
      let isDone = false;
      const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB Limit to prevent OOM
      let output = "";

      const cleanup = () => {
          if (isDone) return;
          isDone = true;
          ongoingTranslations.delete(requestPath);
      };

      const proc = spawn("npm", ["run", "translate-report", resolvedPath], {
        cwd: ENGINE_DIR,
        env: { ...process.env, FORCE_COLOR: "3" }
      });

      // 5-minute Timeout
      const timeout = setTimeout(() => {
        if (!isDone) {
          console.error(`[TRANSLATE] Timeout reached: ${resolvedPath}`);
          proc.kill("SIGKILL"); // Force kill on timeout
          cleanup();
          resolve(NextResponse.json({ error: "Translation timed out (5 minutes limit reached)", output }, { status: 504 }));
        }
      }, 5 * 60 * 1000);

      proc.stdout.on("data", (data) => {
        if (output.length < MAX_OUTPUT_SIZE) {
          output += data.toString();
        } else if (!output.endsWith("\n... (truncated)")) {
          output += "\n... (truncated)";
        }
      });

      proc.stderr.on("data", (data) => {
        if (output.length < MAX_OUTPUT_SIZE) {
          output += data.toString();
        }
      });

      proc.on("close", async (code) => {
        clearTimeout(timeout);
        if (!isDone) {
          cleanup();
          if (code === 0) {
            // Success: Trigger DB Sync if the project is registered
            try {
              // Extract project directory from resolvedPath
              // (Path structure: .../repos/[project_name]/deliverables/[file])
              const pathParts = resolvedPath.split(path.sep);
              const reposIdx = pathParts.lastIndexOf("repos");
              if (reposIdx !== -1 && pathParts.length > reposIdx + 1) {
                const projectPath = pathParts.slice(0, reposIdx + 2).join(path.sep);

                // Find the latest scan for this project
                const scan = await prisma.scan.findFirst({
                  where: { sourcePath: projectPath },
                  orderBy: { startTime: 'desc' }
                });

                if (scan) {
                  console.log(`[TRANSLATE] Syncing reports to DB for scan: ${scan.id}`);
                  await captureScanReports(scan.id, projectPath);
                }
              }
            } catch (err) {
              console.error("[TRANSLATE] DB Sync Error:", err);
            }

            resolve(NextResponse.json({ success: true, message: "Translation completed and synced to DB", output }));
          } else {
            resolve(NextResponse.json({ error: `Translation failed with exit code ${code}`, output }, { status: 500 }));
          }
        }
      });

      proc.on("error", (err) => {
        clearTimeout(timeout);
        if (!isDone) {
          cleanup();
          console.error(`[TRANSLATE] Spawn error: ${err.message}`);
          resolve(NextResponse.json({ error: `Process error: ${err.message}`, output }, { status: 500 }));
        }
      });
    });

  } catch (err: unknown) {
    if (requestPath) ongoingTranslations.delete(requestPath);
    console.error("Report translation error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
