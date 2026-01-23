import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    // Delete refresh token from database if exists
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    // Delete both cookies
    cookieStore.delete("auth_token");
    cookieStore.delete("refresh_token");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    // Even if DB cleanup fails, delete cookies
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    cookieStore.delete("refresh_token");
    return NextResponse.json({ success: true });
  }
}
