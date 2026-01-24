import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { processScanFindings, captureScanReports } from "@/lib/scan-utils";
import path from "path";
import fs from "fs";

const REPOS_BASE_DIR = process.env.REPOS_DIR || "/home/ubuntu/dokodemodoor/repos";

export async function POST(req: Request) {
  try {
    const { payload, errorResponse } = await withAuth(['ADMIN', 'SECURITY']);
    if (errorResponse) return errorResponse;

    const { projectName, scanId: providedScanId } = await req.json();
    if (!projectName) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const projectPath = path.join(REPOS_BASE_DIR, projectName);
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ error: "Project folder not found" }, { status: 404 });
    }

    const deliverablesPath = path.join(projectPath, "deliverables");
    if (!fs.existsSync(deliverablesPath)) {
      return NextResponse.json({ error: "No deliverables found for this project" }, { status: 400 });
    }

    let scanId: string;

    if (providedScanId) {
      // Synchronize existing scan
      const existingScan = await prisma.scan.findUnique({
        where: { id: providedScanId }
      });

      if (!existingScan) {
        return NextResponse.json({ error: "Scan record not found" }, { status: 404 });
      }

      scanId = providedScanId;

      // Clear existing vulnerabilities and reports for a fresh sync
      // We do this precisely to avoid duplicates
      await prisma.vulnerability.deleteMany({ where: { scanId } });
      await prisma.scanReport.deleteMany({ where: { scanId } });

      // Update scan metadata
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: "completed",
          endTime: new Date(),
          logs: (existingScan.logs || "") + `\n[${new Date().toISOString()}] Manual synchronization triggered.`
        }
      });
    } else {
      // Create a unique scan ID for this manual registration
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      scanId = `manual-${projectName}-${timestamp}`;

      // Create Scan record
      await prisma.scan.create({
        data: {
          id: scanId,
          targetUrl: projectName,
          sourcePath: projectPath,
          status: "completed",
          startTime: new Date(),
          endTime: new Date(),
          userId: payload?.id,
          duration: "0s (manual)",
          logs: `Manual scan registration from filesystem deliverables for project: ${projectName}`
        }
      });
    }

    // Process vulnerabilities and reports
    // processScanFindings returns the CURRENT count from DB after adding new ones
    const vulnCount = await processScanFindings(scanId, projectPath);
    await captureScanReports(scanId, projectPath);

    // Final safety check: sync the scan record count with the actual findings count
    const actualCount = await prisma.vulnerability.count({ where: { scanId } });
    await prisma.scan.update({
      where: { id: scanId },
      data: { vulnerabilities: actualCount }
    });

    return NextResponse.json({
      success: true,
      scanId,
      vulnerabilities: actualCount
    });

  } catch (err) {
    console.error("API error registering manual report:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
