import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");

async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
        console.warn("[Projects API] No auth_token found in cookies");
        return null;
    }
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch (err) {
    console.error("[Projects API] Auth verification failed:", err);
    return null;
  }
}

export async function GET(req: Request) {
  const auth = await verifyAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "5");
  const skip = (page - 1) * limit;

  try {
    const where = search ? {
      OR: [
        { name: { contains: search } },
        { repoUrl: { contains: search } },
      ]
    } : {};

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Projects GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await verifyAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { repoUrl, name: customName, isManual, localPath: manualPath } = (await req.json()) as {
      repoUrl?: string;
      name?: string;
      isManual?: boolean;
      localPath?: string;
    };

    if (isManual) {
        if (!manualPath) {
            return NextResponse.json({ error: "Local Path is required for manual registration" }, { status: 400 });
        }

        // Default name to the last folder of the path if not provided
        const defaultName = path.basename(manualPath.replace(/[\\/]$/, ""));
        const finalName = customName?.trim() || defaultName;

        if (!finalName) {
            return NextResponse.json({ error: "Project Name could not be determined" }, { status: 400 });
        }

        // Check if directory exists
        if (!fs.existsSync(manualPath)) {
            console.error(`[Project] Manual path does not exist: ${manualPath}`);
            return NextResponse.json({ error: `The path does not exist on the server: ${manualPath}` }, { status: 400 });
        }

        // Check if project already exists in DB
        const existing = await prisma.project.findUnique({ where: { name: finalName } });
        if (existing) {
            return NextResponse.json({ error: "Project name already exists in database" }, { status: 400 });
        }

        const newProject = await prisma.project.create({
            data: {
                name: finalName,
                repoUrl: "", // Pass empty string if Prisma Client is being strict about optional field
                localPath: manualPath,
            },
        });

        console.log(`[Project] Successfully registered manual path: ${finalName} -> ${manualPath}`);
        return NextResponse.json(newProject, { status: 201 });
    }

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    // Clone logic...
    const cleanUrl = repoUrl.trim().replace(/\/+$/, "");
    const urlParts = cleanUrl.replace(/\.git$/, "").split("/");
    const repoName = customName || urlParts[urlParts.length - 1];

    if (!repoName) {
      return NextResponse.json({ error: "Could not determine project name" }, { status: 400 });
    }

    const existing = await prisma.project.findUnique({ where: { name: repoName } });
    if (existing) {
      return NextResponse.json({ error: "Project name already exists in database" }, { status: 400 });
    }

    const reposDir = process.env.REPOS_DIR || "/home/ubuntu/dokodemodoor-front/repos";

    if (!fs.existsSync(reposDir)) {
        fs.mkdirSync(reposDir, { recursive: true });
    }

    const localPath = path.join(reposDir, repoName);

    if (fs.existsSync(localPath)) {
        return NextResponse.json({ error: `Directory already exists: ${repoName}` }, { status: 400 });
    }

    return new Promise<NextResponse>((resolve) => {
        const git = spawn("git", ["clone", repoUrl, localPath], {
            env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
            shell: true
        });

        let stderr = "";
        git.stderr.on("data", (data) => { stderr += data.toString(); });

        git.on("close", async (code) => {
            if (code !== 0) {
                return resolve(NextResponse.json({ error: "Git clone failed", details: stderr }, { status: 500 }));
            }

            try {
                const newProject = await prisma.project.create({
                    data: { name: repoName, repoUrl, localPath },
                });
                resolve(NextResponse.json(newProject, { status: 201 }));
            } catch (dbErr: unknown) {
                const message = dbErr instanceof Error ? dbErr.message : "Unknown database error";
                resolve(NextResponse.json({ error: "Cloned successfully but DB save failed", details: message }, { status: 500 }));
            }
        });

        setTimeout(() => {
            git.kill();
            resolve(NextResponse.json({ error: "Git clone timed out" }, { status: 504 }));
        }, 300000);
    });

  } catch (error) {
    console.error("Project POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
    const auth = await verifyAuth();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id, name, localPath } = (await req.json()) as { id?: string; name?: string; localPath?: string };

        if (!id) return NextResponse.json({ error: "Project ID is required" }, { status: 400 });

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        const updateData: { name?: string; localPath?: string } = {};
        if (name) updateData.name = name;

        // If it's a manual project (no repoUrl or empty repoUrl), we can update path
        if (!project.repoUrl || project.repoUrl === "") {
            if (localPath) {
                if (!fs.existsSync(localPath)) {
                    return NextResponse.json({ error: "Updated path does not exist" }, { status: 400 });
                }
                updateData.localPath = localPath;
            }
        } else {
            // It's a GitHub project
            if (localPath && localPath !== project.localPath) {
                return NextResponse.json({ error: "Cannot change local path for GitHub projects" }, { status: 400 });
            }
        }

        const updated = await prisma.project.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error: unknown) {
        console.error("Project PATCH Error:", error);
        const message = error instanceof Error ? error.message : "Update failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const auth = await verifyAuth();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id, deleteFiles } = (await req.json()) as { id?: string; deleteFiles?: boolean };
        if (!id) return NextResponse.json({ error: "Project ID is required" }, { status: 400 });

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        if (deleteFiles && project.localPath && fs.existsSync(project.localPath)) {
            fs.rmSync(project.localPath, { recursive: true, force: true });
        }

        await prisma.project.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Project DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
