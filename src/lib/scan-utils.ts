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
  'xss',
  'api-fuzzer',
  'login-check'
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
  'api-fuzzer': 'MEDIUM',
  'login-check': 'HIGH',
};

export const processScanFindings = async (scanId: string, sourcePath: string | null | undefined) => {
  if (!sourcePath) return 0;

  try {
    const scan = await prisma.scan.findUnique({ where: { id: scanId }, select: { type: true } });
    const scanType = scan?.type || "PENTEST";

    const deliverablesPath = path.join(sourcePath, "deliverables");
    if (!fs.existsSync(deliverablesPath)) {
      // Return existing count if folder doesn't exist (e.g. failed before creating findings)
      return await prisma.vulnerability.count({ where: { scanId } });
    }

    const files = fs.readdirSync(deliverablesPath);
    let jsonFiles = files.filter(f => f.endsWith(".json"));

    // Filter findings based on scan type to avoid cross-pollution in shared folders
    if (scanType === "SCA") {
      jsonFiles = jsonFiles.filter(f => f.startsWith("osv-") || f.startsWith("osv_"));
    } else {
      // Pentest scan: only process standard pentest types
      const pentestTypes = [...VULN_TYPE_ORDER, "recon"];
      jsonFiles = jsonFiles.filter(f => {
        const name = f.replace(".json", "").replace("_exploitation_queue", "");
        return pentestTypes.some(t => name === t);
      });
    }

    console.log(`[Findings] Processing ${jsonFiles.length} files (type: ${scanType}) in ${deliverablesPath}`);

    for (const file of jsonFiles) {
      const typeKey = file.includes("_exploitation_queue.json")
        ? file.replace("_exploitation_queue.json", "")
        : file.replace(".json", "");

      const mappedSeverity = SEVERITY_MAP[typeKey] || "MEDIUM";

      try {
        const content = fs.readFileSync(path.join(deliverablesPath, file), "utf8");
        let json: unknown;
        try {
          json = JSON.parse(content);
        } catch (parseErr) {
          // Attempt to fix common LLM JSON errors: literal newlines in strings
          // This is a very basic fix: replace literal newlines with \n
          // (Only if they are not followed by a quote or something that looks like the end of a field)
          const fixedContent = content.replace(/\n(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)/g, "\\n");
          try {
            json = JSON.parse(fixedContent);
            console.log(`[Findings] Recovered from JSON parse error in ${file} using cleanup.`);
          } catch {
            console.error(`[Findings] Failed to parse JSON in ${file} even after cleanup: ${parseErr}`);
            continue;
          }
        }

        const findings = (() => {
          if (Array.isArray(json)) return json;
          if (json && typeof json === 'object') {
            const obj = json as Record<string, unknown>;
            if (Array.isArray(obj.vulnerabilities)) return obj.vulnerabilities;
            if (Array.isArray(obj.findings)) return obj.findings;
          }
          return [];
        })() as Record<string, unknown>[];

        if (findings.length > 0) {
          console.log(`[Findings] File ${file}: ${findings.length} findings found.`);
          for (const v of findings) {
            // 1. Determine a stable 'Title'
            const baseTitle = (typeof v.title === 'string' ? v.title : '') ||
                             (typeof v.type === 'string' ? v.type : '') ||
                             (typeof v.vulnerability_type === 'string' ? v.vulnerability_type : '') ||
                             `${typeKey.toUpperCase()} Found`;

            const findingId = (typeof v.ID === 'string' ? v.ID : '') ||
                             (typeof v.vulnerability_id === 'string' ? v.vulnerability_id : '') ||
                             (typeof v.id === 'string' ? v.id : '');

            const title = findingId ? `[${findingId}] ${baseTitle}` : baseTitle;

            // 2. Determine Evidence/Location
            const rawEvidence = v.evidence || v.proof || v.poc || v.vulnerable_code_location || v.source_endpoint || v.endpoint || v.source || v.path || v.witness_payload || "";
            const evidence = typeof rawEvidence === 'string' ? rawEvidence : JSON.stringify(rawEvidence, null, 2);

            const rawDescription = v.description || v.details || v.notes || "";
            const description = typeof rawDescription === 'string' ? rawDescription : JSON.stringify(rawDescription, null, 2);

            const vSeverity = typeof v.severity === 'string' ? v.severity : '';
            const vConfidence = typeof v.confidence === 'string' ? v.confidence : '';
            const severity = (vSeverity || (vConfidence === 'high' ? 'HIGH' : mappedSeverity)).toUpperCase();

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
    const active = getActiveScan(scanId);
    if (active) {
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
    const scan = await prisma.scan.findUnique({ where: { id: scanId }, select: { type: true } });
    const scanType = scan?.type || "PENTEST";

    const deliverablesPath = path.join(sourcePath, "deliverables");
    if (!fs.existsSync(deliverablesPath)) return;

    const files = fs.readdirSync(deliverablesPath, { withFileTypes: true });

    for (const entry of files) {
      if (!entry.isFile()) continue;

      const filename = entry.name;

      // Filter based on scan type
      if (scanType === "SCA") {
        if (!filename.startsWith("osv-") && !filename.startsWith("osv_")) continue;
      } else {
        if (filename.startsWith("osv-") || filename.startsWith("osv_")) continue;
        // Also skip some temp/internal files for Pentest archive if needed
        if (filename.includes("exploitation_queue")) continue;
      }

      const ext = filename.split('.').pop()?.toLowerCase();
      if (!["md", "txt", "json"].includes(ext || "")) continue;

      const fullPath = path.join(deliverablesPath, filename);
      const content = fs.readFileSync(fullPath, "utf-8");
      const type = ext || "txt";

      // Save or update (though usually it's only called once at end)
      await prisma.scanReport.upsert({
        where: {
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
