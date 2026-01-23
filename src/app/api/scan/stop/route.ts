import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import kill from "tree-kill";

export async function POST(req: Request) {
  try {
    const { scanId } = (await req.json()) as { scanId?: string };
    console.log(`[STOP] Request to stop scan: ${scanId}`);

    // 1. Try to stop in-memory process tree if it exists
    if (global.activeScan && global.activeScan.id === scanId) {
      console.log(`[STOP] Found active scan in memory for ${scanId}`);

      const pid = global.activeScan.process?.pid;
      if (pid) {
        console.log(`[STOP] Killing process tree for PID: ${pid}`);

        return new Promise<NextResponse>((resolve) => {
          kill(pid, 'SIGKILL', async (err) => {
            if (err) {
              console.error(`[STOP] Tree-kill error:`, err);
              // Even if kill fails, we should try to mark it in DB
              resolve(NextResponse.json({ error: "Failed to kill process tree" }, { status: 500 }));
            } else {
              console.log(`[STOP] Successfully killed process tree for ${scanId}`);
              resolve(NextResponse.json({ message: "Scan process tree terminated" }));
            }
          });
        });
      } else {
        console.warn(`[STOP] Active scan in memory has no valid PID: ${scanId}`);
      }
    }

    // 2. Fallback: If not in memory but marked as running in DB
    const scanInDb = await prisma.scan.findUnique({ where: { id: scanId } });

    if (scanInDb && (scanInDb.status === "running" || scanInDb.status === "translating")) {
      console.log(`[STOP] Scan ${scanId} is stuck in 'running' in DB. Force-marking as stopped.`);

      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: "failed",
          endTime: new Date(),
          logs: (scanInDb.logs || "") + "\n\n--- Scan stopped manually (process tree cleaned) ---\n"
        }
      });

      return NextResponse.json({ message: "Scan marked as stopped in database" });
    }

    return NextResponse.json({ error: "Scan not found or not currently running" }, { status: 404 });
  } catch (err: unknown) {
    console.error(`[STOP] Error stopping scan:`, err);
    return NextResponse.json({ error: "Failed to process stop request" }, { status: 500 });
  }
}
