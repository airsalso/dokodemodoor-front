import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectName = searchParams.get("projectName");

  if (!projectName) {
    return NextResponse.json({ error: "Project name or session is required" }, { status: 400 });
  }

  const { errorResponse } = await withAuth(['ADMIN', 'SECURITY', 'USER']);
  if (errorResponse) return errorResponse;

  try {
    // 1. Try to find by sessionId if it looks like a log folder name
    // Format: "172-20-208-1_2d903c37-1964-4271-aefc-cc6769830a49"
    let sessionId = "";
    if (projectName.includes('_')) {
      sessionId = projectName.split('_').pop() || "";
    }

    if (sessionId) {
      const scan = await prisma.scan.findFirst({
        where: { sessionId: sessionId },
        select: { id: true, sourcePath: true }
      });
      if (scan) {
        return NextResponse.json({
          scanId: scan.id,
          projectDisplayName: scan.sourcePath?.split('/').pop() || null
        });
      }
    }

    // 2. Try to find by project name (for Reports list)
    const latestScan = await prisma.scan.findFirst({
      where: {
        OR: [
          { sourcePath: { endsWith: `/${projectName}` } },
          { sourcePath: { endsWith: `/${projectName}/` } },
          { sourcePath: projectName }
        ]
      },
      orderBy: {
        startTime: 'desc'
      },
      select: {
        id: true,
        sourcePath: true
      }
    });

    return NextResponse.json({
      scanId: latestScan?.id || null,
      projectDisplayName: latestScan?.sourcePath?.split('/').pop() || null
    });
  } catch (err) {
    console.error("Failed to find latest scan:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
