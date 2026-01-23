import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");

export interface AuthPayload {
  id: string;
  username: string;
  role: string;
}

const getJwtErrorCode = (err: unknown): string | undefined => {
  if (typeof err !== "object" || err === null) return undefined;
  if (!("code" in err)) return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
};

/**
 * Verifies the auth token from cookies.
 * Returns the payload if valid, or a NextResponse (401) if invalid/expired.
 */
export async function getAuthSession(): Promise<{ payload: AuthPayload | null; errorResponse: NextResponse | null }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { payload: null, errorResponse: NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 }) };
    }

    const { payload } = await jwtVerify(token, SECRET);
    return { payload: payload as unknown as AuthPayload, errorResponse: null };
  } catch (err: unknown) {
    if (getJwtErrorCode(err) === "ERR_JWT_EXPIRED") {
      return { payload: null, errorResponse: NextResponse.json({ error: "Unauthorized: Token expired", code: "TOKEN_EXPIRED" }, { status: 401 }) };
    }
    return { payload: null, errorResponse: NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 }) };
  }
}

/**
 * Helper for API routes to enforce authentication and optionally role requirements.
 */
export async function withAuth(roles?: string[]) {
  const { payload, errorResponse } = await getAuthSession();

  if (errorResponse) return { payload: null, errorResponse };

  if (roles && payload && !roles.includes(payload.role)) {
    return {
      payload: null,
      errorResponse: NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 })
    };
  }

  return { payload, errorResponse: null };
}
