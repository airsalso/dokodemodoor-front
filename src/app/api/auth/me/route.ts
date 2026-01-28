import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const auth = await getAuthSession();

    if (!auth) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: auth.user.id,
        username: auth.user.username,
        role: auth.user.role
      }
    });
  } catch (error) {
    console.error("[Auth Me] Error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
