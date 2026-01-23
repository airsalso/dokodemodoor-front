import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    // Find refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    if (!storedToken) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });
      cookieStore.delete("refresh_token");
      return NextResponse.json({ error: "Refresh token expired" }, { status: 401 });
    }

    // Check activity timeout
    const inactivityHours = parseInt(process.env.NEXT_PUBLIC_SESSION_INACTIVITY_TIMEOUT_HOURS || "4");
    const inactivityLimit = new Date(Date.now() - inactivityHours * 60 * 60 * 1000);
    if (storedToken.lastActivity < inactivityLimit) {
      // Session timed out due to inactivity
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });
      cookieStore.delete("refresh_token");
      cookieStore.delete("auth_token");
      return NextResponse.json({ error: "Session expired due to inactivity" }, { status: 401 });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
      select: {
        id: true,
        username: true,
        role: true,
        status: true
      }
    });

    if (!user || user.status !== "ACTIVE") {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });
      return NextResponse.json({ error: "User not found or inactive" }, { status: 401 });
    }

    // Update last activity
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { lastActivity: new Date() }
    });

    // Generate new access token
    const accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY || "4h";
    const newAccessToken = await new SignJWT({
      id: user.id,
      username: user.username,
      role: user.role
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(accessTokenExpiry)
      .sign(SECRET);

    const isProduction = process.env.NODE_ENV === "production";
    const sameSitePolicy = isProduction ? "lax" : "lax";
    const isSecure = isProduction && process.env.COOKIE_SECURE === "true";

    // Set new access token cookie
    cookieStore.set("auth_token", newAccessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSitePolicy,
      maxAge: 60 * 60 * 4, // 4 hours
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
