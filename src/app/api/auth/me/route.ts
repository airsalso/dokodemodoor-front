import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { prisma } from "@/lib/prisma";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AuthTokenPayload = JWTPayload & {
  id: string;
  username: string;
  role: string;
};

const getJwtErrorCode = (err: unknown): string | undefined => {
  if (typeof err !== "object" || err === null) return undefined;
  if (!("code" in err)) return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  let payload: AuthTokenPayload | null = null;
  let needsRefresh = false;

  if (token) {
    try {
      const verified = await jwtVerify(token, SECRET);
      payload = verified.payload as AuthTokenPayload;
    } catch (error: unknown) {
      if (getJwtErrorCode(error) === "ERR_JWT_EXPIRED") {
        needsRefresh = true;
      } else {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }
    }
  } else {
    needsRefresh = true;
  }

  // If token is missing or expired, attempt refresh
  if (needsRefresh && refreshToken) {
    try {
      const dbToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });

      if (dbToken && dbToken.expiresAt > new Date()) {
        const user = await prisma.user.findUnique({
          where: { id: dbToken.userId },
          select: {
            id: true,
            username: true,
            role: true,
            status: true,
          }
        });

        if (!user) {
          return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        // Check account status
        if (user.status !== "ACTIVE") {
           return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        // Issue new access token
        const accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY || "4h";
        const newAccessToken = await new SignJWT({
          id: user.id,
          username: user.username,
          role: user.role || "USER"
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime(accessTokenExpiry)
          .sign(SECRET);

        // Update last activity
        await prisma.refreshToken.update({
          where: { id: dbToken.id },
          data: { lastActivity: new Date() }
        });

        const response = NextResponse.json({
          authenticated: true,
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });

        const isProduction = process.env.NODE_ENV === "production";
        const isSecure = isProduction && process.env.COOKIE_SECURE === "true";

        response.cookies.set("auth_token", newAccessToken, {
          httpOnly: true,
          secure: isSecure,
          sameSite: "lax",
          maxAge: 60 * 60 * 4, // 4 hours
          path: "/",
        });

        return response;
      }
    } catch (refreshErr: unknown) {
      console.error("[Auth Me] Refresh failed:", refreshErr);
    }
  }

  // If we have a valid payload (from original token)
  if (payload) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
        }
      });

      if (!user || user.status !== "ACTIVE") {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }

      return NextResponse.json({ authenticated: true, user });
    } catch (err: unknown) {
      console.error("[Auth Me] DB check failed:", err);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
