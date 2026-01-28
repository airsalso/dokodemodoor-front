import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-server";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("scanId");
  const severity = searchParams.get("severity");
  const limit = parseInt(searchParams.get("limit") || "100");

  try {
    const auth = await getAuthSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: Prisma.VulnerabilityWhereInput = {};
    if (scanId) where.scanId = scanId;
    if (severity && severity !== "ALL") {
      where.severity = {
          equals: severity.toUpperCase()
      };
    }

    const vulns = await prisma.vulnerability.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        scan: {
          select: {
            targetUrl: true,
            startTime: true,
            sourcePath: true
          }
        }
      }
    });

    const projects = await prisma.project.findMany({
      select: { localPath: true, name: true }
    });
    const projectMap = new Map(projects.map(p => [p.localPath, p.name]));

    const vulnsWithProjectName = vulns.map(v => ({
      ...v,
      scan: v.scan ? {
        ...v.scan,
        projectName: v.scan.sourcePath ? projectMap.get(v.scan.sourcePath) : null
      } : null
    }));

    // Get summary counts for the current scope (all or specific scan)
    const summaryData = await prisma.vulnerability.groupBy({
      by: ['severity'],
      where: scanId ? { scanId } : {},
      _count: {
        _all: true
      }
    });

    const summary = summaryData.reduce((acc, curr) => {
      acc[curr.severity] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      vulnerabilities: vulnsWithProjectName,
      vulns: vulnsWithProjectName, // Backward support for older builds/hooks
      summary
    });
  } catch (error) {
    console.error("Error fetching vulnerabilities:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
