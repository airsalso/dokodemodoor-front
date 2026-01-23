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

async function backfillVulnerabilities() {
  try {
    // Get the most recent scan
    const latestScan = await prisma.scan.findFirst({
      orderBy: { startTime: 'desc' }
    });

    if (!latestScan) {
      console.log('No scans found in database.');
      return;
    }

    console.log(`Found scan: ${latestScan.id}`);
    console.log(`Status: ${latestScan.status}`);
    console.log(`Source path: ${latestScan.sourcePath}`);

    if (!latestScan.sourcePath) {
      console.log('No source path for this scan.');
      return;
    }

    const deliverablesPath = path.join(latestScan.sourcePath, 'deliverables');

    if (!fs.existsSync(deliverablesPath)) {
      console.log(`Deliverables path does not exist: ${deliverablesPath}`);
      return;
    }

    const files = fs.readdirSync(deliverablesPath);
    const queueFiles = files.filter(f => f.endsWith('exploitation_queue.json'));

    console.log(`Found ${queueFiles.length} exploitation queue files`);

    let totalVulns = 0;

    for (const file of queueFiles) {
      // Extract type: 'sqli_exploitation_queue.json' -> 'sqli'
      const typeKey = file.replace('_exploitation_queue.json', '');
      const mappedSeverity = SEVERITY_MAP[typeKey] || 'MEDIUM';

      console.log(`\nProcessing: ${file} (type: ${typeKey}, severity: ${mappedSeverity})`);

      try {
        const content = fs.readFileSync(path.join(deliverablesPath, file), 'utf8');
        const json = JSON.parse(content);

        if (json.vulnerabilities && Array.isArray(json.vulnerabilities)) {
          console.log(`  Found ${json.vulnerabilities.length} vulnerabilities`);

          for (const v of json.vulnerabilities) {
            await prisma.vulnerability.create({
              data: {
                scanId: latestScan.id,
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
        }
      } catch (e) {
        console.error(`  Error processing ${file}:`, e.message);
      }
    }

    // Update scan vulnerability count
    await prisma.scan.update({
      where: { id: latestScan.id },
      data: { vulnerabilities: totalVulns }
    });

    console.log(`\n✅ Successfully imported ${totalVulns} vulnerabilities for scan ${latestScan.id}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillVulnerabilities();
