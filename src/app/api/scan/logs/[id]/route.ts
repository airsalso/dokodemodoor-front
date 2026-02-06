import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveScan } from "@/lib/active-scan";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get project name if sourcePath exists
  const getProjectName = async (path?: string | null) => {
    if (!path) return null;
    const project = await prisma.project.findFirst({
      where: { localPath: path },
      select: { name: true }
    });
    return project?.name || null;
  };

  // Check memory for active scan
  const active = getActiveScan(id);
  if (active && active.id === id) {
    const projectName = await getProjectName(active.sourcePath);
    return NextResponse.json({
      status: active.status,
      logs: active.logs,
      target: active.target,
      vulnerabilities: active.vulnerabilities || 0,
      startTime: active.startTime,
      duration: active.duration,
      targetUrl: active.targetUrl || active.target,
      sourcePath: active.sourcePath,
      projectName,
      config: active.config,
      sessionId: active.sessionId,
      type: active.type,
    });
  }

  // Check DB for history
  const historical = await prisma.scan.findUnique({
    where: { id },
  });

  if (historical) {
    const [projectName, vulnCount] = await Promise.all([
      getProjectName(historical.sourcePath),
      prisma.vulnerability.count({ where: { scanId: id } })
    ]);

    return NextResponse.json({
      status: historical.status,
      // Split by newline and keep the newline character in each element for XTerm
      logs: historical.logs ? historical.logs.split(/(?<=\n)/) : [],
      target: historical.targetUrl,
      vulnerabilities: vulnCount, // Use actual count from Vulnerability table
      startTime: historical.startTime.getTime(),
      endTime: historical.endTime?.getTime() || null,
      duration: historical.duration,
      targetUrl: historical.targetUrl,
      sourcePath: historical.sourcePath,
      projectName,
      config: historical.config,
      sessionId: historical.sessionId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: (historical as any).type,
    });
  }

  return NextResponse.json({ error: "Scan not found" }, { status: 404 });
}
