import { prisma } from "./prisma";
import fs from "fs";
import path from "path";

export const SEVERITY_MAP: Record<string, string> = {
  'codei': 'CRITICAL',
  'sqli': 'HIGH',
  'ssti': 'HIGH',
  'ssrf': 'HIGH',
  'auth': 'HIGH',
  'authz': 'HIGH',
  'pathi': 'MEDIUM',
  'xss': 'MEDIUM',
};

export const processScanFindings = async (scanId: string, sourcePath: string | null | undefined) => {
  if (!sourcePath) return 0;

  try {
    const deliverablesPath = path.join(sourcePath, "deliverables");
    if (!fs.existsSync(deliverablesPath)) {
      // Return existing count if folder doesn't exist (e.g. failed before creating findings)
      return await prisma.vulnerability.count({ where: { scanId } });
    }

    const files = fs.readdirSync(deliverablesPath);
    // Be more inclusive: count any JSON file that has a 'vulnerabilities' array
    const jsonFiles = files.filter(f => f.endsWith(".json"));

    for (const file of jsonFiles) {
      // For typeKey, still try to use the prefix if it's *_exploitation_queue.json,
      // otherwise use the filename or 'general'
      const typeKey = file.includes("_exploitation_queue.json")
        ? file.replace("_exploitation_queue.json", "")
        : file.replace(".json", "");

      const mappedSeverity = SEVERITY_MAP[typeKey] || "MEDIUM";

      try {
        const content = fs.readFileSync(path.join(deliverablesPath, file), "utf8");
        const json = JSON.parse(content);

        // Support both top-level array or vulnerabilities key
        const findings = Array.isArray(json) ? json : (json.vulnerabilities || json.findings || []);

        if (Array.isArray(findings)) {
          // Save each vulnerability to DB (with deduplication)
          for (const v of findings) {
            const signature = {
              scanId,
              type: typeKey,
              title: v.title || v.type || v.vulnerability_type || `${typeKey.toUpperCase()} Found`,
              evidence: v.evidence || v.proof || v.poc || v.witness_payload || v.path || "",
            };

            const existing = await prisma.vulnerability.findFirst({
              where: signature
            });

            if (!existing) {
              await prisma.vulnerability.create({
                data: {
                  ...signature,
                  severity: v.severity || v.confidence === 'high' ? 'HIGH' : mappedSeverity,
                  description: v.description || v.details || v.notes || "",
                  details: JSON.stringify(v),
                }
              });
            }
          }
        }
      } catch (e) {
        console.error(`[Findings] Error processing result file ${file}:`, e);
      }
    }

    // Refresh memory count if this is an active scan
    const currentCount = await prisma.vulnerability.count({ where: { scanId } });
    if (global.activeScan && global.activeScan.id === scanId) {
      global.activeScan.vulnerabilities = currentCount;
    }

    return currentCount;
  } catch (e) {
    console.error("Error in processScanFindings:", e);
    return await prisma.vulnerability.count({ where: { scanId } });
  }
};

export const captureScanReports = async (scanId: string, sourcePath: string | null | undefined) => {
  if (!sourcePath) return;

  try {
    const deliverablesPath = path.join(sourcePath, "deliverables");
    if (!fs.existsSync(deliverablesPath)) return;

    const files = fs.readdirSync(deliverablesPath, { withFileTypes: true });

    for (const entry of files) {
      if (!entry.isFile()) continue;

      const filename = entry.name;
      const fullPath = path.join(deliverablesPath, filename);
      const content = fs.readFileSync(fullPath, "utf-8");
      const type = filename.split('.').pop() || "txt";

      // Save or update (though usually it's only called once at end)
      await prisma.scanReport.upsert({
        where: {
          // Since we don't have a unique constraint on filename+scanId in schema.prisma,
          // we'll just try to find it first or use a compound key if we added one.
          // For now, let's just create. In most cases, it will be fine.
          id: `${scanId}-${filename}`
        },
        update: {
          content,
          type
        },
        create: {
          id: `${scanId}-${filename}`,
          scanId,
          filename,
          content,
          type
        }
      });
    }
  } catch (e) {
    console.error("Error in captureScanReports:", e);
  }
};
