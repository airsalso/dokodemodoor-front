import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { projectPath, loginUrl, username, password, otp } = body;

        if (!projectPath || !loginUrl || !username || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Construct command with arguments
        // Command for the engine: npm run generate-project-profile -- <projectPath> <loginUrl> <username> <password> [otp]

        const enginePath = "/home/ubuntu/dokodemodoor";

        // Escape arguments to prevent shell injection (very basic level)
        const safeArgs = [
            projectPath,
            loginUrl,
            username,
            password,
            otp || ""
        ].map(arg => `'${arg.replace(/'/g, "'\\''")}'`).join(" ");

        const command = `npm run generate-project-profile -- ${safeArgs}`;

        console.log(`Executing: ${command} in ${enginePath}`);

        const { stdout, stderr } = await execPromise(command, { cwd: enginePath });

        if (stderr && !stdout) {
            console.error("Profile generation error (stderr):", stderr);
            return NextResponse.json({ error: stderr }, { status: 500 });
        }

        console.log("Profile generation output:", stdout);

        return NextResponse.json({
            success: true,
            message: "Profile generated successfully",
            output: stdout
        });

    } catch (error) {
        console.error("Profile generation unexpected error:", error);
        const message = error instanceof Error
            ? error.message
            : "An error occurred during profile generation";
        return NextResponse.json({
            error: message
        }, { status: 500 });
    }
}
