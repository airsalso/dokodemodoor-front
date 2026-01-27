import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { Prisma } from "@prisma/client";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_12345");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("scanId");
  const severity = searchParams.get("severity");
  const limit = parseInt(searchParams.get("limit") || "100");

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await jwtVerify(token, SECRET);

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

    return NextResponse.json({ vulns: vulnsWithProjectName, summary });
  } catch (error) {
    console.error("Error fetching vulnerabilities:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
