import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding mock data...");

  const mockScans = [
    {
      id: "SCAN-2026-001",
      targetUrl: "http://172.20.208.1:3002",
      status: "completed",
      startTime: new Date("2026-01-15T14:30:00Z"),
      endTime: new Date("2026-01-15T14:44:20Z"),
      duration: "14m 20s",
      vulnerabilities: 12,
      logs: "\x1b[32m[INFO]\x1b[0m Starting full security assessment...\n\x1b[33m[WARN]\x1b[0m SQL Injection vulnerability found in /api/products\n\x1b[31m[CRIT]\x1b[0m Remote Code Execution possible on /upload endpoint\n\x1b[32m[SUCCESS]\x1b[0m Scan completed. 12 vulnerabilities identified.",
    },
    {
      id: "SCAN-2026-002",
      targetUrl: "https://example.com",
      status: "failed",
      startTime: new Date("2026-01-14T09:12:00Z"),
      endTime: new Date("2026-01-14T09:14:05Z"),
      duration: "2m 05s",
      vulnerabilities: 0,
      logs: "\x1b[32m[INFO]\x1b[0m Initializing scan engine...\n\x1b[31m[ERROR]\x1b[0m Connection timeout while reaching target URL.\n\x1b[31m[ERROR]\x1b[0m Scan aborted.",
    },
    {
      id: "SCAN-2026-003",
      targetUrl: "http://localhost:4000",
      status: "completed",
      startTime: new Date("2026-01-15T18:00:00Z"),
      endTime: new Date("2026-01-15T18:05:00Z"),
      duration: "5m 00s",
      vulnerabilities: 4,
      logs: "\x1b[32m[INFO]\x1b[0m Reconnaissance phase started.\n\x1b[32m[INFO]\x1b[0m Port 80, 443 detected.\n\x1b[33m[WARN]\x1b[0m Outdated version of Express.js detected.\n\x1b[32m[SUCCESS]\x1b[0m Scan finished with minor alerts.",
    },
  ];

  for (const scan of mockScans) {
    await prisma.scan.upsert({
      where: { id: scan.id },
      update: {},
      create: scan,
    });
  }

  console.log("Mock data recovery complete.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
