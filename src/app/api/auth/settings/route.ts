import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getUserId() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload.id as string;
  } catch (e: unknown) {
    console.error("[Settings/getUserId] Auth error:", e);
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      console.log("[Settings] Initializing default settings for user:", userId);
      settings = await prisma.userSettings.create({
        data: { userId },
      });
    }

    return NextResponse.json(settings);
  } catch (error: unknown) {
    console.error("[Settings/GET] Global error:", error);
    const message = error instanceof Error ? error.message : "Internal Database Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = (await req.json()) as Record<string, unknown>;
    const allowedFields = [
      'exclusions', 'requestDelay', 'timeout',
      'llmModel', 'analysisStrictness', 'apiKey',
      'webhookUrl', 'emailReports',
      'autoCleanupDays',
      'terminalTheme', 'accentColor', 'language', 'terminalFont', 'themeFont'
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const updated = await prisma.userSettings.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("[Settings/PATCH] Global error:", error);
    const message = error instanceof Error ? error.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
