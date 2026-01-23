import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const getErrorCode = (err: unknown): string | undefined => {
    if (typeof err !== "object" || err === null) return undefined;
    if (!("code" in err)) return undefined;
    const code = (err as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  };

  try {
    // 1. Verify User and Role
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, SECRET);
    const userRole = payload.role as string;

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Permission Denied: Only administrators can delete scan history." },
        { status: 403 }
      );
    }

    // 2. Check if it's currently running
    if (global.activeScan && global.activeScan.id === id) {
      return NextResponse.json(
        { error: "Cannot delete a scan that is currently in progress. Please stop it first." },
        { status: 400 }
      );
    }

    // 3. Delete from DB
    await prisma.scan.delete({
      where: { id },
    });

    console.log(`[DELETE] Scan history entry deleted: ${id} by user ${payload.email}`);

    return NextResponse.json({ message: "Scan history deleted successfully" });
  } catch (err: unknown) {
    if (getErrorCode(err) === "P2025") {
      return NextResponse.json({ error: "Scan record not found" }, { status: 404 });
    }
    console.error(`[DELETE] Error deleting scan history:`, err);
    return NextResponse.json({ error: "Failed to delete scan history" }, { status: 500 });
  }
}
