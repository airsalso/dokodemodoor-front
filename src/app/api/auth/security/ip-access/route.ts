import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { withAuth } from "@/lib/auth-server";

const CONFIGS_DIR = process.env.CONFIGS_DIR || "/home/ubuntu/dokodemodoor-front/configs";
const STATE_FILE = path.join(CONFIGS_DIR, "allowed_ips.json");
const NGINX_FILE = path.join(CONFIGS_DIR, "nginx_access.conf");

export async function GET() {
  const { errorResponse } = await withAuth(['ADMIN', 'SECURITY']);
  if (errorResponse) return errorResponse;

  try {
    if (!fs.existsSync(STATE_FILE)) {
      return NextResponse.json({ ips: [] });
    }
    const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading IP whitelist:", error);
    return NextResponse.json({ ips: [] });
  }
}

export async function POST(req: Request) {
  const { errorResponse } = await withAuth(['ADMIN', 'SECURITY']);
  if (errorResponse) return errorResponse;

  try {
    const { ips } = (await req.json()) as { ips: string[] };

    if (!Array.isArray(ips)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Ensure directory exists
    if (!fs.existsSync(CONFIGS_DIR)) {
      fs.mkdirSync(CONFIGS_DIR, { recursive: true });
    }

    // Save state JSON
    fs.writeFileSync(STATE_FILE, JSON.stringify({ ips }, null, 2), "utf-8");

    // Generate Nginx config
    let nginxConfig = "";
    if (ips.length > 0) {
      ips.forEach(ip => {
        if (ip.trim()) {
          nginxConfig += `allow ${ip.trim()};\n`;
        }
      });
      nginxConfig += "deny all;\n";
    }

    fs.writeFileSync(NGINX_FILE, nginxConfig, "utf-8");

    return NextResponse.json({
      success: true,
      message: "IP whitelist updated. Please restart Nginx to apply changes.",
      nginxConfig
    });
  } catch (error: unknown) {
    console.error("Error saving IP whitelist:", error);
    const message = error instanceof Error ? error.message : "Failed to save IP whitelist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
