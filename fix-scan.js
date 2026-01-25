/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const scanId = 'SCAN-1769248074439';
  console.log(`Cleaning up scan ${scanId}...`);

  const delV = await prisma.vulnerability.deleteMany({ where: { scanId } });
  const delR = await prisma.scanReport.deleteMany({ where: { scanId } });

  console.log(`Deleted ${delV.count} vulnerabilities and ${delR.count} reports.`);

  await prisma.scan.update({
    where: { id: scanId },
    data: { vulnerabilities: 0 }
  });
}

fix().finally(() => prisma.$disconnect());
