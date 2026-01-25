/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const findings = await prisma.vulnerability.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  findings.forEach((f, i) => {
    console.log(`${i+1}. ID: ${f.id} | ScanID: "${f.scanId}" (Length: ${f.scanId.length}) | Title: ${f.title}`);
  });
}

inspect().finally(() => prisma.$disconnect());
