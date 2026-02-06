import { NextResponse } from "next/server";
import fs from "fs";

export async function GET() {
  try {
    // Exact path as requested by user or derived from environment/relative
    // Based on the 'ls' command, we know it's at /home/ubuntu/dokodemodoor/docs/profile-generator.md
    const filePath = "/home/ubuntu/dokodemodoor/docs/profile-generator.md";

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
