import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-server";
import { processScanFindings, captureScanReports } from "@/lib/scan-utils";
import fs from "fs";

import { getActiveScan, setActiveScan, removeActiveScan, getAllActiveScans, type ActiveScan } from "@/lib/active-scan";

export async function POST(req: Request) {
  const { targetUrl, sourcePath, config, scanId: existingScanId, type = "PENTEST" } = (await req.json()) as {
    targetUrl: string;
    sourcePath: string;
    config: string;
    scanId?: string;
    type?: string;
  };

  // No longer blocking concurrent scans. Removed previous process check.

  // Auth Check
  const { payload, errorResponse } = await withAuth(['ADMIN', 'SECURITY']);
  if (errorResponse) return errorResponse;

  const userId = payload?.id;

  let existingLogs = "";
  let existingStartTime = Date.now();
  let existingVulnCount = 0;

  if (existingScanId) {
    const existing = await prisma.scan.findUnique({ where: { id: existingScanId } });
    if (existing) {
      existingLogs = existing.logs || "";
      existingStartTime = existing.startTime.getTime();
      existingVulnCount = existing.vulnerabilities;
    }
  }

  const scanId = existingScanId || (type === "SCA" ? `SCA-${new Date().getTime()}` : `SCAN-${new Date().getTime()}`);
  const configPath = type === "SCA" ? config : `configs/${config}`;

  // Log preloading: Split into lines to maintain shifting logic
  let preloadedLogs: string[] = [];
  if (existingLogs) {
    const lines = existingLogs.split("\n");
    if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop(); // Remove trailing empty line
    preloadedLogs = lines.map(l => l + "\n");
    preloadedLogs.push("--- Scan Restarted ---\n");
  }

  const scanData: ActiveScan = {
    id: scanId,
    type,
    target: targetUrl,
    status: "running" as const,
    startTime: existingStartTime,
    logs: preloadedLogs,
    sourcePath: sourcePath,
    targetUrl,
    config,
    vulnerabilities: existingVulnCount,
  };

  setActiveScan(scanData);

  // Persist scan to DB (Upsert logic to avoid duplication on restarts)
  if (existingScanId) {
    console.log(`[Scan] Restarting existing scan: ${existingScanId}`);
    await prisma.scan.update({
      where: { id: existingScanId },
      data: {
        status: "running",
        endTime: null,
        duration: null,
      }
    });
    // Removed: delete findings at start. They will be refreshed at the end.
  } else {
    // Check if there's a previous completed scan with same parameters
    const previousScan = await prisma.scan.findFirst({
      where: {
        targetUrl,
        sourcePath,
        status: { in: ["completed", "failed"] }
      },
      orderBy: { startTime: "desc" }
    });

    if (previousScan) {
      console.log(`[Scan] Creating NEW scan ${scanId} (previous scan ${previousScan.id} was ${previousScan.status})`);
    } else {
      console.log(`[Scan] Creating FIRST scan ${scanId} for ${targetUrl}`);
    }

    // New scan: create with vulnerabilities = 0 to avoid showing stale data
    await prisma.scan.create({
      data: {
        id: scanId,
        type,
        targetUrl,
        sourcePath,
        config,
        status: "running",
        vulnerabilities: 0, // Initialize to 0 for new scans
        userId,
      }
    });
  }

  const engineDir = process.env.ENGINE_DIR || "/home/ubuntu/dokodemodoor";
  const STORE_PATH = process.env.STORE_PATH || `${engineDir}/.dokodemodoor-store.json`;
  const script = type === "SCA" ? "./osv-scanner.mjs" : "./dokodemodoor.mjs";
  const scriptArgs = type === "SCA"
    ? [targetUrl, sourcePath, configPath]
    : [targetUrl, sourcePath, "--config", configPath];

  const proc = spawn("npx", [
    "zx",
    script,
    ...scriptArgs
  ], {
    cwd: engineDir,
    env: { ...process.env, FORCE_COLOR: "3", DOKODEMODOOR_STORE: STORE_PATH },
    detached: true, // Allow killing the entire process group
  });

  const active = getActiveScan(scanId);
  if (active) {
    active.process = proc;
  }

  proc.stdout.on("data", (data) => {
    const lines = data.toString();
    const active = getActiveScan(scanId);
    if (active) {
      active.logs.push(lines);
      const maxLogs = parseInt(process.env.MAX_LOG_LINES_IN_MEMORY || "5000");
      if (active.logs.length > maxLogs) {
        active.logs.shift();
      }
    }
  });

  proc.stderr.on("data", (data) => {
    getActiveScan(scanId)?.logs.push(data.toString());
  });

  // Track vulnerabilities in real-time
  const findingsInterval = setInterval(() => {
    const active = getActiveScan(scanId);
    if (active && active.id === scanId) {
      processScanFindings(scanId, sourcePath).catch(console.error);
    } else {
      clearInterval(findingsInterval);
    }
  }, 5000);

  // Capture session ID from engine store after a delay
  // (Engine creates session immediately after spawn, but might take a few seconds to write to disk)
  const captureSessionId = async (retryCount = 0) => {
    try {
      const STORE_PATH = process.env.STORE_PATH || "/home/ubuntu/dokodemodoor/.dokodemodoor-store.json";
      if (!fs.existsSync(STORE_PATH)) {
        if (retryCount < 5) setTimeout(() => captureSessionId(retryCount + 1), 3000);
        return;
      }

      const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
      const sessions = store.sessions || {};

      let matchedSessionId = "";
      let latestTimestamp = 0;

      const scanStartTime = scanData.startTime; // This is the numerical timestamp

      for (const [sessionId, sessionData] of Object.entries(sessions)) {
        const session = sessionData as { webUrl?: string; repoPath?: string; createdAt?: string };
        if (session.webUrl === targetUrl && session.repoPath === sourcePath) {
          const sessionTime = session.createdAt ? new Date(session.createdAt).getTime() : 0;

          // Only pick sessions created AROUND or AFTER the scan started
          // Allowing 10 seconds buffer behind in case of clock drifts,
          // but prioritizing the absolute latest.
          if (sessionTime > latestTimestamp) {
            latestTimestamp = sessionTime;
            matchedSessionId = sessionId;
          }
        }
      }

      // Verification: If the matched session is older than the scan start time,
      // it might be an old session and the new one isn't written yet.
      // Scan start time is T. If latest matching session is T-1hour, wait for the new one.
      const isNewSession = latestTimestamp > (scanStartTime - 30000); // Created within 30s of scan start or later

      if (matchedSessionId && isNewSession) {
        console.log(`[Scan] Captured CORRECT engine session ID: ${matchedSessionId} (Session Time: ${new Date(latestTimestamp).toISOString()}, Scan Start: ${new Date(scanStartTime).toISOString()})`);

        await prisma.scan.update({
          where: { id: scanId },
          data: { sessionId: matchedSessionId }
        });

        const active = getActiveScan(scanId);
        if (active && active.id === scanId) {
          active.sessionId = matchedSessionId;
        }
      } else {
        if (retryCount < 10) {
          console.log(`[Scan] Session not found or too old. Retrying... (${retryCount + 1}/10)`);
          setTimeout(() => captureSessionId(retryCount + 1), 3000);
        } else {
          console.warn(`[Scan] Failed to capture new session ID after 10 retries.`);
        }
      }
    } catch (err) {
      console.error(`[Scan] Error capturing session ID:`, err);
    }
  };

  setTimeout(() => captureSessionId(0), 5000); // Start checking after 5s


  proc.on("close", async (code) => {
    const status = code === 0 ? "completed" : "failed";
    const endTime = Date.now();
    const duration = `${Math.round((endTime - scanData.startTime) / 1000)}s`;

    // Process and save findings before updating scan status
    const vulnCount = await processScanFindings(scanId, sourcePath);

    // Capture all deliverables into DB for permanent storage
    await captureScanReports(scanId, sourcePath);

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status,
        endTime: new Date(endTime),
        duration,
        vulnerabilities: vulnCount,
        logs: scanData.logs.join(""), // Persist logs to DB on finish
      }
    });

    removeActiveScan(scanId);
  });

  return NextResponse.json({ scanId });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const query = searchParams.get("query") || "";
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "PENTEST";

  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (query) {
    const matchingProjects = await prisma.project.findMany({
      where: { name: { contains: query } },
      select: { localPath: true }
    });
    const projectPaths = matchingProjects.map(p => p.localPath);

    where.OR = [
      { targetUrl: { contains: query } },
      { id: { contains: query } },
      { sourcePath: { in: projectPaths } }
    ];
  }
  if (status !== "all") {
    where.status = status;
  }
  where.type = type;

  let history, total, projects, stats;
  try {
    [history, total, projects, stats] = await Promise.all([
      prisma.scan.findMany({
        where: where as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        orderBy: { startTime: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          targetUrl: true,
          status: true,
          startTime: true,
          endTime: true,
          duration: true,
          vulnerabilities: true,
          sourcePath: true,
          config: true,
        }
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.scan.count({ where: where as any }),
      prisma.project.findMany({
        select: { localPath: true, name: true }
      }),
      prisma.scan.groupBy({
        by: ['status'],
        where: where as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        _count: {
          id: true
        }
      })
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Prisma query failed, likely due to schema mismatch. Retrying without 'type' filter.", err.message);
    const fallbackWhere = { ...where };
    delete fallbackWhere.type;

    [history, total, projects, stats] = await Promise.all([
      prisma.scan.findMany({
        where: fallbackWhere as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        orderBy: { startTime: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          targetUrl: true,
          status: true,
          startTime: true,
          endTime: true,
          duration: true,
          vulnerabilities: true,
          sourcePath: true,
          config: true,
        }
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.scan.count({ where: fallbackWhere as any }),
      prisma.project.findMany({
        select: { localPath: true, name: true }
      }),
      prisma.scan.groupBy({
        by: ['status'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: fallbackWhere as any,
        _count: {
          id: true
        }
      })
    ]);
  }

  const projectMap = new Map(projects.map(p => [p.localPath, p.name]));
  const historyWithProjectName = history.map(scan => ({
    ...scan,
    projectName: scan.sourcePath ? projectMap.get(scan.sourcePath) : null
  }));

  const counts = {
    total: stats.reduce((acc, curr) => acc + (curr._count?.id || 0), 0),
    running: stats.find(s => s.status === 'running')?._count?.id || 0,
    translating: stats.find(s => s.status === 'translating')?._count?.id || 0,
    completed: stats.find(s => s.status === 'completed')?._count?.id || 0,
    failed: stats.find(s => s.status === 'failed')?._count?.id || 0,
  };

  const actives = getAllActiveScans().filter(s => (s.type || "PENTEST") === type);
  return NextResponse.json({
    active: actives.length > 0 ? {
      id: actives[0].id,
      type: actives[0].type || "PENTEST",
      target: actives[0].target,
      status: actives[0].status,
      startTime: actives[0].startTime,
      vulnerabilities: actives[0].vulnerabilities || 0,
      sourcePath: actives[0].sourcePath,
      targetUrl: actives[0].targetUrl,
      config: actives[0].config,
      sessionId: actives[0].sessionId,
      duration: actives[0].duration,
      projectName: actives[0].sourcePath ? projectMap.get(actives[0].sourcePath) : null
    } : null,
    history: historyWithProjectName,
    stats: counts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
}
