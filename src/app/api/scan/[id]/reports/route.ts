import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth Check
    const { errorResponse } = await withAuth();
    if (errorResponse) return errorResponse;

    const reports = await prisma.scanReport.findMany({
      where: { scanId: id },
      orderBy: { filename: 'asc' }
    });

    return NextResponse.json({ reports });
  } catch (err) {
    console.error("Fetch archived reports error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
