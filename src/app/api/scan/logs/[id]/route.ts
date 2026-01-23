import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check memory for active scan
  if (global.activeScan && global.activeScan.id === id) {
    return NextResponse.json({
      status: global.activeScan.status,
      logs: global.activeScan.logs,
      target: global.activeScan.target,
      vulnerabilities: global.activeScan.vulnerabilities || 0,
      startTime: global.activeScan.startTime,
      duration: global.activeScan.duration, // Might be undefined if still running
      // Pass through original params if available (added for restart feature)
      targetUrl: global.activeScan.targetUrl || global.activeScan.target,
      sourcePath: global.activeScan.sourcePath,
      config: global.activeScan.config,
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
      duration: historical.duration,
      targetUrl: historical.targetUrl,
      sourcePath: historical.sourcePath,
      config: historical.config,
    });
  }

  return NextResponse.json({ error: "Scan not found" }, { status: 404 });
}
