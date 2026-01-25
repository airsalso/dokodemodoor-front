/* eslint-disable @typescript-eslint/no-require-imports */
const { processScanFindings, captureScanReports } = require('./src/lib/scan-utils');
const { prisma } = require('./src/lib/prisma');
const path = require('path');

async function testSync() {
  const scanId = 'SCAN-1769248074439';
  const projectName = 'dokodemodoor-front';
  const REPOS_BASE_DIR = process.env.REPOS_DIR || '/home/ubuntu/dokodemodoor/repos';
  const projectPath = path.join(REPOS_BASE_DIR, projectName);

  console.log(`Starting sync for ${scanId} at ${projectPath}...`);

  const count = await processScanFindings(scanId, projectPath);
  console.log(`Findings count returned: ${count}`);

  await captureScanReports(scanId, projectPath);
  console.log('Reports captured.');

  const finalCount = await prisma.vulnerability.count({ where: { scanId } });
  console.log(`Final count in DB: ${finalCount}`);

  await prisma.scan.update({
    where: { id: scanId },
    data: { vulnerabilities: finalCount }
  });
}

testSync().finally(() => process.exit());
