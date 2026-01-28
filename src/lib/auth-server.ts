import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify, type JWTPayload } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");

export interface AuthTokenPayload extends JWTPayload {
  id: string;
  username: string;
  role: string;
}

export interface AuthSession {
  user: {
    id: string;
    username: string;
    role: string;
  };
  payload: AuthTokenPayload;
  sessionId: string | null;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;
  const legacyToken = cookieStore.get("auth_token")?.value;

  // 1. Try Session-based Auth (Hybrid)
  if (sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            status: true
          }
        }
      }
    });

    if (session && session.expiresAt > new Date() && session.user.status === "ACTIVE") {
      try {
        const { payload } = await jwtVerify(session.jwt, SECRET);
        const tokenPayload = payload as AuthTokenPayload;

        // Update last activity periodically (e.g., if last activity > 5 mins ago)
        const now = new Date();
        const lastActivity = new Date(session.lastActivity);
        if (now.getTime() - lastActivity.getTime() > 5 * 60 * 1000) {
          prisma.session.update({
            where: { id: session.id },
            data: { lastActivity: now }
          }).catch((error: unknown) => console.error("[Auth] Failed to update last activity", error));
        }

        return {
          user: session.user,
          payload: tokenPayload,
          sessionId: session.id
        };
      } catch (err) {
        console.error("[Auth] Session JWT invalid", err);
        // If JWT inside session is invalid, the session is corrupted
        return null;
      }
    }
  }

  // 2. Fallback to Token-only Auth (Legacy/Migration)
  if (legacyToken) {
    try {
      const { payload } = await jwtVerify(legacyToken, SECRET);
      const p = payload as AuthTokenPayload;

      const user = await prisma.user.findUnique({
        where: { id: p.id },
        select: {
          id: true,
          username: true,
          role: true,
          status: true
        }
      });

      if (user && user.status === "ACTIVE") {
        return {
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          },
          payload: p,
          sessionId: null
        };
      }
    } catch {
      // Token invalid or expired
      return null;
    }
  }

  return null;
}

/**
 * Standard API route wrapper for role-based authentication.
 * Returns { errorResponse, user, session }
 */
export async function withAuth(allowedRoles?: string[]) {
  const auth = await getAuthSession();

  if (!auth) {
    return {
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
      session: null,
      payload: null
    };
  }

  if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
    return {
      errorResponse: NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 }),
      user: auth.user,
      session: auth,
      payload: auth.payload
    };
  }

  return { errorResponse: null, user: auth.user, session: auth, payload: auth.payload };
}
