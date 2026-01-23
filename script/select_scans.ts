import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const scans = await prisma.scan.findMany({
    take: 1,
    orderBy: { startTime: 'desc' }
  });
  if (scans.length > 0) {
    const s = scans[0];
    console.log(`Scan ID: ${s.id}`);
    console.log(`Target: ${s.targetUrl}`);
    console.log(`Source: ${s.sourcePath}`);
  }
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
