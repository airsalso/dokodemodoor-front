import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import kill from "tree-kill";
import { getActiveScan, removeActiveScan } from "@/lib/active-scan";

export async function POST(req: Request) {
  try {
    const { scanId } = (await req.json()) as { scanId?: string };
    console.log(`[STOP] Request to stop scan: ${scanId}`);

    // 1. Force-mark as stopped in DB First (for UI consistency)
    const scanInDb = await prisma.scan.findUnique({ where: { id: scanId } });
    if (scanInDb && (scanInDb.status === "running" || scanInDb.status === "translating")) {
      console.log(`[STOP] Marking scan ${scanId} as failed in DB`);
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: "failed",
          endTime: new Date(),
          logs: (scanInDb.logs || "") + "\n\n--- Scan stopped manually (Force Termination) ---\n"
        }
      });
    }

    // 2. Try to stop in-memory process tree if it exists
    const active = scanId ? getActiveScan(scanId) : null;
    if (active) {
      console.log(`[STOP] Found active scan in memory for ${scanId}`);

      const pid = active.process?.pid;
      if (pid) {
        console.log(`[STOP] Killing process tree for PID: ${pid}`);

        try {
          // Attempt group kill first if detached
          process.kill(-pid, 'SIGKILL');
          console.log(`[STOP] Sent SIGKILL to process group -${pid}`);
        } catch (e) {
          console.warn(`[STOP] Group kill failed, falling back to tree-kill:`, e);
        }

        return new Promise<NextResponse>((resolve) => {
          kill(pid, 'SIGKILL', async (err) => {
            if (err) {
              console.error(`[STOP] Tree-kill error:`, err);
            } else {
              console.log(`[STOP] Successfully executed tree-kill for ${scanId}`);
            }
            if (scanId) removeActiveScan(scanId);
            resolve(NextResponse.json({ message: "Scan termination request processed" }));
          });
        });
      } else {
        console.warn(`[STOP] Active scan in memory has no valid PID: ${scanId}`);
        if (scanId) removeActiveScan(scanId);
      }
    }

    if (scanInDb) {
      return NextResponse.json({ message: "Scan marked as stopped/failure in database" });
    }

    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  } catch (err: unknown) {
    console.error(`[STOP] Error stopping scan:`, err);
    return NextResponse.json({ error: "Failed to process stop request" }, { status: 500 });
  }
}
