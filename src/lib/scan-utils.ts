import { prisma } from "./prisma";
import fs from "fs";
import path from "path";
import { getActiveScan } from "./active-scan";

export const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export const VULN_TYPE_ORDER = [
  'codei',
  'sqli',
  'ssti',
  'ssrf',
  'auth',
  'authz',
  'pathi',
  'xss'
];

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
    const jsonFiles = files.filter(f => f.endsWith(".json"));
    console.log(`[Findings] Processing ${jsonFiles.length} files in ${deliverablesPath}`);

    for (const file of jsonFiles) {
      const typeKey = file.includes("_exploitation_queue.json")
        ? file.replace("_exploitation_queue.json", "")
        : file.replace(".json", "");

      const mappedSeverity = SEVERITY_MAP[typeKey] || "MEDIUM";

      try {
        const content = fs.readFileSync(path.join(deliverablesPath, file), "utf8");
        const json = JSON.parse(content);
        const findings = Array.isArray(json) ? json : (json.vulnerabilities || json.findings || []);

        if (Array.isArray(findings)) {
          console.log(`[Findings] File ${file}: ${findings.length} findings found.`);
          for (const v of findings) {
            // 1. Determine a stable 'Title'
            // If engine provides a specific ID (e.g. AUTH-VULN-01), use it to ensure uniqueness
            const baseTitle = v.title || v.type || v.vulnerability_type || `${typeKey.toUpperCase()} Found`;
            const findingId = v.ID || v.vulnerability_id || v.id;
            const title = findingId ? `[${findingId}] ${baseTitle}` : baseTitle;

            // 2. Determine Evidence/Location
            const evidence = v.evidence || v.proof || v.poc || v.vulnerable_code_location || v.source_endpoint || v.endpoint || v.source || v.path || v.witness_payload || "";
            const description = v.description || v.details || v.notes || "";
            const severity = (v.severity || (v.confidence === 'high' ? 'HIGH' : mappedSeverity)).toUpperCase();

            // 3. Identification & Deduplication
            // We search for an existing finding with the SAME scanId, type, and title.
            // Since the title now contains the unique ID (if available), this is very reliable.
            // If No ID is available, we also include evidence in the match to distinguish generic titles.
            const existing = await prisma.vulnerability.findFirst({
              where: {
                scanId,
                type: typeKey,
                title,
                // If title is generic (no ID), the evidence must also match exactly to be a duplicate
                ...(findingId ? {} : { evidence })
              }
            });

            if (existing) {
              // Update if the new finding has more information
              const isImproved = (description.length > (existing.description?.length || 0)) ||
                                (evidence.length > (existing.evidence?.length || 0));

              if (isImproved) {
                console.log(`[Findings] Updating finding with better info: ${title}`);
                await prisma.vulnerability.update({
                  where: { id: existing.id },
                  data: {
                    evidence: evidence || existing.evidence,
                    description: description || existing.description,
                    severity,
                    details: JSON.stringify(v)
                  }
                });
              } else {
                console.log(`[Findings] Skipping existing finding: ${title}`);
              }
            } else {
              console.log(`[Findings] Creating NEW finding: ${title}`);
              await prisma.vulnerability.create({
                data: {
                  scanId,
                  type: typeKey,
                  title,
                  evidence,
                  severity,
                  description,
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
    const active = getActiveScan();
    if (active && active.id === scanId) {
      active.vulnerabilities = currentCount;
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
