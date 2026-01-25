/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const scanId = 'SCAN-1769248074439';
  const findings = await prisma.vulnerability.findMany({
    where: { scanId },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Scan: ${scanId}`);
  findings.forEach((f, i) => {
    console.log(`${i+1}. [${f.type}] ${f.title} | Evidence: [${f.evidence}]`);
  });
}

inspect().finally(() => prisma.$disconnect());
