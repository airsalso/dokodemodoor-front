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

const globalForScan = global as unknown as { activeScan: ActiveScan | null };

export const getActiveScan = () => globalForScan.activeScan;
export const setActiveScan = (scan: ActiveScan | null) => {
  globalForScan.activeScan = scan;
};

// Ensure it's attached to global in development for HMR
if (process.env.NODE_ENV !== "production") {
  globalForScan.activeScan = globalForScan.activeScan || null;
}
