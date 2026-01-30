import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveScan } from "@/lib/active-scan";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check memory for active scan
  const active = getActiveScan();
  if (active && active.id === id) {
    return NextResponse.json({
      status: active.status,
      logs: active.logs,
      target: active.target,
      vulnerabilities: active.vulnerabilities || 0,
      startTime: active.startTime,
      duration: active.duration,
      targetUrl: active.targetUrl || active.target,
      sourcePath: active.sourcePath,
      config: active.config,
      sessionId: active.sessionId,
    });
  }

  // Check DB for history
  const historical = await prisma.scan.findUnique({
    where: { id },
  });

  if (historical) {
    return NextResponse.json({
      status: historical.status,
      logs: historical.logs ? [historical.logs] : [],
      target: historical.targetUrl,
      vulnerabilities: historical.vulnerabilities,
      startTime: historical.startTime.getTime(),
      endTime: historical.endTime?.getTime() || null,
      duration: historical.duration,
      targetUrl: historical.targetUrl,
      sourcePath: historical.sourcePath,
      config: historical.config,
      sessionId: historical.sessionId,
    });
  }

  return NextResponse.json({ error: "Scan not found" }, { status: 404 });
}
