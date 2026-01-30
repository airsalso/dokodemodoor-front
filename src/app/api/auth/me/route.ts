import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const auth = await getAuthSession();

    if (!auth) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Capture Client IP
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwarded ? forwarded.split(',')[0] : (realIp || "127.0.0.1");

    return NextResponse.json({
      authenticated: true,
      user: {
        id: auth.user.id,
        username: auth.user.username,
        role: auth.user.role,
        ip: ip
      }
    });
  } catch (error) {
    console.error("[Auth Me] Error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
