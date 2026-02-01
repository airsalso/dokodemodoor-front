import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");
const LOG_BASE_DIR = process.env.LOG_DIR || "/home/ubuntu/dokodemodoor/audit-logs";

type FileNode = {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FileNode[];
  mtime?: number;
};

export async function GET() {
  try {
    // 1. Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role as string;
    if (!['ADMIN', 'SECURITY'].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Scan Directory
    if (!fs.existsSync(LOG_BASE_DIR)) {
      return NextResponse.json({ files: [] });
    }

    const getAllFiles = (dir: string): FileNode[] => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      const nodes = entries.map(entry => {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(LOG_BASE_DIR, fullPath);
        const stats = fs.statSync(fullPath);

        if (entry.isDirectory()) {
          return {
            name: entry.name,
            type: "directory" as const,
            path: relativePath,
            mtime: stats.mtime.getTime(),
            children: getAllFiles(fullPath)
          };
        }
        return {
          name: entry.name,
          type: "file" as const,
          path: relativePath,
          mtime: stats.mtime.getTime()
        };
      });

      // Sort by mtime descending (newest first)
      return nodes.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
    };

    const fileTree = getAllFiles(LOG_BASE_DIR);
    return NextResponse.json({ files: fileTree });
  } catch (err) {
    console.error("API error listing logs:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
