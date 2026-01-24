const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const scans = await prisma.scan.findMany({
    include: {
      _count: {
        select: { findings: true, reports: true }
      }
    },
    orderBy: { startTime: 'desc' }
  });

  console.log('Total Scans:', scans.length);
  for (const s of scans) {
    console.log(`Scan ID: ${s.id}, Target: ${s.targetUrl}, Vulnerabilities: ${s.vulnerabilities}, Count: ${s._count.findings}, Reports: ${s._count.reports}`);

    // Check for duplicates in findings
    const findings = await prisma.vulnerability.findMany({ where: { scanId: s.id } });
    const seen = new Set();
    const dups = [];
    for (const f of findings) {
      const sig = `${f.type}-${f.title}-${f.evidence}`;
      if (seen.has(sig)) {
        dups.push(sig);
      }
      seen.add(sig);
    }
    if (dups.length > 0) {
      console.log(`  [!] Found ${dups.length} duplicates in ${s.id}`);
    }
  }
}

check().finally(() => prisma.$disconnect());
