import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");
const LOG_BASE_DIR = process.env.LOG_DIR || "/home/ubuntu/dokodemodoor/audit-logs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const relPath = searchParams.get("path");
    if (!relPath) return NextResponse.json({ error: "Missing path" }, { status: 400 });

    const fullPath = path.join(LOG_BASE_DIR, relPath);
    if (!fullPath.startsWith(LOG_BASE_DIR)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { payload } = await jwtVerify(token, SECRET);
    if (!['ADMIN', 'SECURITY'].includes(payload.role as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!fs.existsSync(fullPath) || fs.lstatSync(fullPath).isDirectory()) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    return NextResponse.json({ content });
  } catch (err) {
    console.error("Log file GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { path: relPath, content } = await req.json();
    if (!relPath) return NextResponse.json({ error: "Missing path" }, { status: 400 });

    const fullPath = path.join(LOG_BASE_DIR, relPath);
    if (!fullPath.startsWith(LOG_BASE_DIR)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { payload } = await jwtVerify(token, SECRET);
    if (!['ADMIN', 'SECURITY'].includes(payload.role as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    fs.writeFileSync(fullPath, content, "utf-8");
    return NextResponse.json({ message: "Saved successfully" });
  } catch (err) {
    console.error("Log file POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const relPath = searchParams.get("path");
    if (!relPath) return NextResponse.json({ error: "Missing path" }, { status: 400 });

    const fullPath = path.join(LOG_BASE_DIR, relPath);
    if (!fullPath.startsWith(LOG_BASE_DIR)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Role Check
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { payload } = await jwtVerify(token, SECRET);
    if (!['ADMIN', 'SECURITY'].includes(payload.role as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "Path not found" }, { status: 404 });
    }

    // Recursive delete for handles both files and directories
    fs.rmSync(fullPath, { recursive: true, force: true });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
