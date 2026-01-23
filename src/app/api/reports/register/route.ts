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

    const { projectName } = await req.json();
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

    // Create a unique scan ID for this manual registration
    // Format: manual-[projectName]-[short_random_or_timestamp]
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const scanId = `manual-${projectName}-${timestamp}`;

    // Create Scan record
    // We check if it already exists just in case
    const existingScan = await prisma.scan.findUnique({
      where: { id: scanId }
    });

    if (existingScan) {
      return NextResponse.json({ error: "Scan already registered" }, { status: 400 });
    }

    await prisma.scan.create({
      data: {
        id: scanId,
        targetUrl: projectName, // Use project name as target
        sourcePath: projectPath,
        status: "completed",
        startTime: new Date(),
        endTime: new Date(),
        userId: payload?.id,
        duration: "0s (manual)",
        logs: `Manual scan registration from filesystem deliverables for project: ${projectName}`
      }
    });

    // Process vulnerabilities and reports
    const vulnCount = await processScanFindings(scanId, projectPath);
    await captureScanReports(scanId, projectPath);

    // Update final vulnerability count
    await prisma.scan.update({
      where: { id: scanId },
      data: { vulnerabilities: vulnCount }
    });

    return NextResponse.json({
      success: true,
      scanId,
      vulnerabilities: vulnCount
    });

  } catch (err) {
    console.error("API error registering manual report:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
