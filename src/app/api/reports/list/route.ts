import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { withAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const REPOS_BASE_DIR = process.env.REPOS_DIR || "/home/ubuntu/dokodemodoor/repos";

type FileNode = {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FileNode[];
  isRegistered?: boolean;
  scanId?: string;
};

export async function GET() {
  try {
    // 1. Auth Check
    const { errorResponse } = await withAuth(['ADMIN', 'SECURITY']);
    if (errorResponse) return errorResponse;

    if (!fs.existsSync(REPOS_BASE_DIR)) {
      return NextResponse.json({ files: [] });
    }

    // Get all registered scans to mark projects as registered
    // We order by startTime desc to ensure the latest scan is picked during matching
    const registeredScans = await prisma.scan.findMany({
      select: {
        id: true,
        sourcePath: true,
        startTime: true,
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    const getFilesRecursively = (dir: string, base: string): FileNode[] => {
      if (!fs.existsSync(dir)) return [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      return entries.map(entry => {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(base, fullPath);

        if (entry.isDirectory()) {
          return {
            name: entry.name,
            type: "directory",
            path: relativePath,
            children: getFilesRecursively(fullPath, base)
          };
        }
        return {
          name: entry.name,
          type: "file",
          path: relativePath
        };
      });
    };

    // We only want projects that have a 'deliverables' folder
    const projects = fs.readdirSync(REPOS_BASE_DIR, { withFileTypes: true })
      .filter(entry => entry.isDirectory());

    const fileTree = projects.map(project => {
      const projectPath = path.join(REPOS_BASE_DIR, project.name);
      const deliverablesPath = path.join(projectPath, "deliverables");

      // Check if this project is already registered as a scan
      // We look for a scan whose sourcePath matches or contains this project's name
      const registeredScan = registeredScans.find(s =>
        s.sourcePath && (s.sourcePath === projectPath || s.sourcePath.endsWith(project.name))
      );

      return {
        name: project.name,
        type: "directory",
        path: project.name,
        isRegistered: !!registeredScan,
        scanId: registeredScan?.id,
        children: getFilesRecursively(deliverablesPath, REPOS_BASE_DIR)
      };
    }).filter(p => p.children.length > 0);

    return NextResponse.json({ files: fileTree });
  } catch (err) {
    console.error("API error listing reports:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
