/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const SEVERITY_MAP = {
  'codei': 'CRITICAL',
  'sqli': 'HIGH',
  'ssti': 'HIGH',
  'ssrf': 'HIGH',
  'auth': 'HIGH',
  'authz': 'HIGH',
  'pathi': 'MEDIUM',
  'xss': 'MEDIUM',
};

async function updateScanVulnerabilities(scanId) {
  try {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId }
    });

    if (!scan) {
      console.log(`Scan ${scanId} not found.`);
      return;
    }

    console.log(`Found scan: ${scan.id}`);
    console.log(`Status: ${scan.status}`);
    console.log(`Source path: ${scan.sourcePath}`);

    if (!scan.sourcePath) {
      console.log('No source path for this scan.');
      return;
    }

    const deliverablesPath = path.join(scan.sourcePath, 'deliverables');

    if (!fs.existsSync(deliverablesPath)) {
      console.log(`Deliverables path does not exist: ${deliverablesPath}`);
      return;
    }

    // Delete existing vulnerabilities for this scan
    const deleted = await prisma.vulnerability.deleteMany({
      where: { scanId: scan.id }
    });
    console.log(`Deleted ${deleted.count} existing vulnerabilities\n`);

    const files = fs.readdirSync(deliverablesPath);
    const queueFiles = files.filter(f => f.endsWith('exploitation_queue.json'));

    console.log(`Found ${queueFiles.length} exploitation queue files\n`);

    let totalVulns = 0;

    for (const file of queueFiles) {
      // FIXED: Use underscore instead of hyphen
      const typeKey = file.replace('_exploitation_queue.json', '');
      const mappedSeverity = SEVERITY_MAP[typeKey] || 'MEDIUM';

      console.log(`Processing: ${file}`);
      console.log(`  -> Extracted type: '${typeKey}'`);
      console.log(`  -> Mapped severity: ${mappedSeverity}`);

      try {
        const content = fs.readFileSync(path.join(deliverablesPath, file), 'utf8');
        const json = JSON.parse(content);

        if (json.vulnerabilities && Array.isArray(json.vulnerabilities)) {
          console.log(`  -> Found ${json.vulnerabilities.length} vulnerabilities`);

          for (const v of json.vulnerabilities) {
            await prisma.vulnerability.create({
              data: {
                scanId: scan.id,
                type: typeKey,
                severity: v.severity || mappedSeverity,
                title: v.title || v.type || `${typeKey.toUpperCase()} Found`,
                description: v.description || v.details || '',
                evidence: v.evidence || v.proof || v.poc || '',
                details: JSON.stringify(v),
              }
            });
            totalVulns++;
          }
        } else {
          console.log(`  -> No vulnerabilities array found`);
        }
      } catch (e) {
        console.error(`  -> Error processing ${file}:`, e.message);
      }
      console.log('');
    }

    // Update scan vulnerability count
    await prisma.scan.update({
      where: { id: scan.id },
      data: { vulnerabilities: totalVulns }
    });

    console.log(`✅ Successfully re-imported ${totalVulns} vulnerabilities for scan ${scan.id}`);
    console.log('\nBreakdown:');
    const counts = await prisma.vulnerability.groupBy({
      by: ['severity'],
      where: { scanId: scan.id },
      _count: true
    });
    counts.forEach(c => {
      console.log(`  ${c.severity}: ${c._count} vulnerabilities`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const scanId = process.argv[2];
if (!scanId) {
  console.error('Usage: node fix-scan-vulns.js <SCAN_ID>');
  process.exit(1);
}

updateScanVulnerabilities(scanId);
