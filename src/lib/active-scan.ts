import { type ChildProcess } from "child_process";

export type ActiveScan = {
  id: string;
  target: string;
  status: "running" | "completed" | "failed" | "translating";
  startTime: number;
  logs: string[];
  vulnerabilities?: number;
  sourcePath?: string;
  targetUrl?: string;
  config?: string;
  sessionId?: string;
  duration?: string;
  process?: ChildProcess | null;
};

const globalForScan = global as unknown as { activeScans: Map<string, ActiveScan> };

if (!globalForScan.activeScans) {
  globalForScan.activeScans = new Map();
}

export const getActiveScan = (id: string) => globalForScan.activeScans.get(id);
export const getAllActiveScans = () => Array.from(globalForScan.activeScans.values());
export const setActiveScan = (scan: ActiveScan) => {
  globalForScan.activeScans.set(scan.id, scan);
};
export const removeActiveScan = (id: string) => {
  globalForScan.activeScans.delete(id);
};
