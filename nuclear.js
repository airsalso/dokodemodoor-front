const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function nuclear() {
  const scanId = 'SCAN-1769248074439';
  console.log(`Nuclear cleanup for ${scanId}...`);

  // Find all findings for this scanId
  const findings = await prisma.vulnerability.findMany({
    where: { scanId: { contains: scanId } }
  });

  console.log(`Found ${findings.length} findings to delete.`);

  for (const f of findings) {
    await prisma.vulnerability.delete({ where: { id: f.id } });
  }

  console.log('Cleanup complete.');
}

nuclear().finally(() => prisma.$disconnect());
