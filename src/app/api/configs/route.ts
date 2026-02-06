import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { withAuth } from "@/lib/auth-server";

export async function GET(req: Request) {
  const { errorResponse } = await withAuth(['ADMIN', 'SECURITY']);
  if (errorResponse) return errorResponse;

  const configsDir = process.env.CONFIGS_DIR || "/home/ubuntu/dokodemodoor/configs";
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");

  try {
    if (!fs.existsSync(configsDir)) {
      fs.mkdirSync(configsDir, { recursive: true });
      return NextResponse.json({ configs: [] });
    }

    if (filename) {
      const fullPath = path.join(configsDir, filename);
       // Security check: Ensure the path is within the configs directory
      if (!fullPath.startsWith(configsDir) || !fs.existsSync(fullPath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      const content = fs.readFileSync(fullPath, "utf-8");
      return NextResponse.json({ content });
    }

    const files = fs.readdirSync(configsDir);
    const type = searchParams.get("type") || "yaml";

    let filteredFiles;
    if (type === "json") {
      filteredFiles = files.filter(f => f.endsWith(".json"));
    } else if (type === "txt") {
      filteredFiles = files.filter(f => f.endsWith(".txt"));
    } else {
      filteredFiles = files.filter(f => f.endsWith(".yaml") || f.endsWith(".yml"));
    }

    return NextResponse.json({ configs: filteredFiles });
  } catch (error) {
    console.error("Error reading configs:", error);
    return NextResponse.json({ configs: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { errorResponse } = await withAuth(['ADMIN', 'SECURITY']);
  if (errorResponse) return errorResponse;

  const configsDir = process.env.CONFIGS_DIR || "/home/ubuntu/dokodemodoor/configs";

  try {
    const { name, content } = (await req.json()) as { name?: string; content?: string };

    if (!name || !content) {
      return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
    }

    // Ensure directory exists
    if (!fs.existsSync(configsDir)) {
      fs.mkdirSync(configsDir, { recursive: true });
    }

    // Ensure the filename ends with correct extension
    let filename = name;
    if (content.trim().startsWith("{")) {
       filename = name.endsWith(".json") ? name : `${name}.json`;
    } else {
       filename = name.endsWith(".yaml") || name.endsWith(".yml") ? name : `${name}.yaml`;
    }
    const fullPath = path.join(configsDir, filename);

    // Security check: Ensure the path is within the configs directory
    if (!fullPath.startsWith(configsDir)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    fs.writeFileSync(fullPath, content, "utf-8");

    return NextResponse.json({ message: "Configuration saved successfully", filename });
  } catch (error: unknown) {
    console.error("Error saving config:", error);
    const message = error instanceof Error ? error.message : "Failed to save configuration";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { errorResponse } = await withAuth(['ADMIN', 'SECURITY']);
  if (errorResponse) return errorResponse;

  const configsDir = process.env.CONFIGS_DIR || "/home/ubuntu/dokodemodoor/configs";
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 });
  }

  try {
    const fullPath = path.join(configsDir, filename);

    if (!fullPath.startsWith(configsDir) || !fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    fs.unlinkSync(fullPath);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting config:", error);
    const message = error instanceof Error ? error.message : "Failed to delete";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
