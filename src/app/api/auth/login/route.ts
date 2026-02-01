import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");

export async function POST(req: Request) {
  try {
    const { username, password, rememberMe } = (await req.json()) as {
      username: string;
      password: string;
      rememberMe?: boolean;
    };

    console.debug(`[Login] Attempt: ${username}, Remember Me: ${rememberMe}`);
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.debug(`[Login] User not found: ${username}`);
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.debug(`[Login] Password match for ${username}: ${isMatch}`);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Check account status
    const userStatus = user.status;
    console.debug(`[Login] User status for ${username}: ${userStatus}`);

    if (userStatus === "INACTIVE") {
      return NextResponse.json({ error: "Your account is suspended. Please contact admin." }, { status: 403 });
    }
    if (userStatus === "DELETED") {
      return NextResponse.json({ error: "This account has been deleted." }, { status: 403 });
    }

    // Create access token (short-lived)
    const accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY || "24h";
    const accessToken = await new SignJWT({ id: user.id, username: user.username, role: user.role || "USER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(accessTokenExpiry)
      .sign(SECRET);

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    // For sameSite: "none", secure must be true (browser requirement)
    // In development, we use "lax" to avoid the secure requirement
    const sameSitePolicy = isProduction ? "lax" : "lax";
    const isSecure = isProduction && process.env.COOKIE_SECURE === "true";

    // --- Hybrid Auth: Create Server Session ---
    const userAgent = req.headers.get("user-agent") || null;
    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(',')[0] : "unknown";

    const sessionExpiryHours = 24;
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setHours(sessionExpiresAt.getHours() + sessionExpiryHours);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        jwt: accessToken, // Store the JWT on the server side
        userAgent,
        ipAddress,
        expiresAt: sessionExpiresAt,
      }
    });

    // Set Session Cookie (The key to the hybrid architecture)
    cookieStore.set("auth_session", session.id, {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSitePolicy,
      maxAge: 60 * 60 * sessionExpiryHours,
      path: "/",
    });

    // Keep auth_token for backward compatibility during transition
    cookieStore.set("auth_token", accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSitePolicy,
      maxAge: 60 * 60 * sessionExpiryHours,
      path: "/",
    });

    // If "Remember Me" is checked, create a refresh token (long-lived: 7 days)
    if (Boolean(rememberMe)) {
      // Clean up old refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: {
          userId: user.id,
          expiresAt: { lt: new Date() }
        }
      });

      // Generate secure refresh token
      const refreshToken = crypto.randomBytes(64).toString('hex');
      const expiryDays = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY_DAYS || "7");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays); // 7 days

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt,
          lastActivity: new Date()
        }
      });

      // Set refresh token cookie
      cookieStore.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: sameSitePolicy,
        maxAge: 60 * 60 * 24 * expiryDays,
        path: "/",
      });

      console.debug(`[Login] Refresh token created for ${username}`);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role || "USER"
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
