import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { withAuth } from "@/lib/auth-server";

export async function POST(req: Request) {
  const { projectPath } = (await req.json()) as { projectPath: string };

  if (!projectPath) {
    return NextResponse.json({ error: "Project path is required" }, { status: 400 });
  }

  // Auth Check
  const { errorResponse } = await withAuth(['ADMIN', 'SECURITY']);
  if (errorResponse) return errorResponse;

  const engineDir = process.env.ENGINE_DIR || "/home/ubuntu/dokodemodoor";

  try {
    // Run the analyzer as a background process
    // Command: npm run project-analyzer -- [projectPath]
    console.log(`[Analyzer] Starting analysis for: ${projectPath}`);

    // Using spawn to run npm script
    const command = "npm run project-analyzer -- " + projectPath;
    console.log(`[Analyzer] Executing command: ${command}`);

    const proc = spawn("npm", ["run", "project-analyzer", "--", projectPath], {
      cwd: engineDir,
      env: { ...process.env, FORCE_COLOR: "0" },
      detached: true,
      stdio: 'ignore' // We ignore output for now as results go to configs/
    });

    proc.unref(); // Allow the parent process to exit independently

    return NextResponse.json({ message: "Analysis initiated successfully" });
  } catch (err: unknown) {
    console.error(`[Analyzer] Error starting analyzer:`, err);
    return NextResponse.json({ error: "Failed to start analyzer" }, { status: 500 });
  }
}
