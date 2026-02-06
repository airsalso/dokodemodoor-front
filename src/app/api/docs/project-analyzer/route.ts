import { NextResponse } from "next/server";
import fs from "fs";

export async function GET() {
  try {
    const filePath = "/home/ubuntu/dokodemodoor/docs/project-analyzer-manual.md";

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Failed to read document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
