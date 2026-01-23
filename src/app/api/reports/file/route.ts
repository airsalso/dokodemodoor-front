import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { withAuth } from "@/lib/auth-server";

const REPOS_BASE_DIR = process.env.REPOS_DIR || "/home/ubuntu/dokodemodoor/repos";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const relPath = searchParams.get("path");
    if (!relPath) return NextResponse.json({ error: "Missing path" }, { status: 400 });

    const fullPath = path.join(REPOS_BASE_DIR, relPath);
    if (!fullPath.startsWith(REPOS_BASE_DIR)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Auth Check
    const { errorResponse } = await withAuth(['ADMIN', 'SECURITY']);
    if (errorResponse) return errorResponse;

    if (!fs.existsSync(fullPath) || fs.lstatSync(fullPath).isDirectory()) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    return NextResponse.json({ content });
  } catch (err) {
    console.error("Report file GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { path: relPath, content } = await req.json();
    if (!relPath) return NextResponse.json({ error: "Missing path" }, { status: 400 });

    const fullPath = path.join(REPOS_BASE_DIR, relPath);
    if (!fullPath.startsWith(REPOS_BASE_DIR)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Auth Check
    const { errorResponse } = await withAuth(['ADMIN', 'SECURITY']);
    if (errorResponse) return errorResponse;

    fs.writeFileSync(fullPath, content, "utf-8");
    return NextResponse.json({ message: "Saved successfully" });
  } catch (err) {
    console.error("Report file POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const relPath = searchParams.get("path");
    if (!relPath) return NextResponse.json({ error: "Missing path" }, { status: 400 });

    const fullPath = path.join(REPOS_BASE_DIR, relPath);
    if (!fullPath.startsWith(REPOS_BASE_DIR)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Role Check
    const { errorResponse } = await withAuth(['ADMIN', 'SECURITY']);
    if (errorResponse) return errorResponse;

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 });
    }

    // Recursive delete
    fs.rmSync(fullPath, { recursive: true, force: true });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete report error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
