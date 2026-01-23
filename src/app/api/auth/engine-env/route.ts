import { NextResponse } from "next/server";
import fs from "fs";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");
const ENGINE_ENV_PATH = process.env.NEXT_PUBLIC_ENGINE_ENV_PATH || "/home/ubuntu/dokodemodoor/.env";

async function checkAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return false;
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!fs.existsSync(ENGINE_ENV_PATH)) {
      console.warn("[EngineEnv] File not found at:", ENGINE_ENV_PATH);
      return NextResponse.json({ error: ".env file not found" }, { status: 404 });
    }

    const content = fs.readFileSync(ENGINE_ENV_PATH, "utf-8");
    const lines = content.split("\n");
    const env: Record<string, string> = {};

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valueParts] = trimmed.split("=");
        env[key.trim()] = valueParts.join("=").trim();
      }
    });

    return NextResponse.json(env);
  } catch (err: unknown) {
    console.error("[EngineEnv/GET] Global error:", err);
    const message = err instanceof Error ? err.message : "Failed to read engine config";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuth = await checkAuth();
    if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!fs.existsSync(ENGINE_ENV_PATH)) {
      return NextResponse.json({ error: ".env file not found" }, { status: 404 });
    }

    const updates = (await req.json()) as Record<string, string>;
    const content = fs.readFileSync(ENGINE_ENV_PATH, "utf-8");
    const lines = content.split("\n");

    const updatedKeys = new Set();
    const newLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key] = trimmed.split("=");
        const cleanKey = key.trim();
        if (updates[cleanKey] !== undefined) {
          updatedKeys.add(cleanKey);
          return `${cleanKey}=${updates[cleanKey]}`;
        }
      }
      return line;
    });

    Object.keys(updates).forEach(key => {
      if (!updatedKeys.has(key)) {
        newLines.push(`${key}=${updates[key]}`);
      }
    });

    fs.writeFileSync(ENGINE_ENV_PATH, newLines.join("\n"));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[EngineEnv/POST] Global error:", err);
    const message = err instanceof Error ? err.message : "Failed to update engine config";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
