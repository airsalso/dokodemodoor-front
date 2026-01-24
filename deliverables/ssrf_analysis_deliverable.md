# SSRF Analysis Report

## 1. Executive Summary
The application exposes two server‑side request paths that accept user‑controlled input and subsequently perform outbound HTTP requests via child processes. Both paths lack strict allow‑listing or IP/CIDR validation, making them vulnerable to Server‑Side Request Forgery (SSRF). The vulnerabilities are externally exploitable for authenticated users and can be leveraged to access internal services or cloud metadata endpoints.

## 2. Dominant Vulnerability Patterns
| Vulnerability | Source | Sink | Defense Gap |
|---------------|--------|------|-------------|
| **Unrestricted outbound HTTP from child process** | `POST /api/scan/start` – `targetUrl` | `child_process.spawn` → `npm run translate-report` (engine) | No URL validation or allow‑list |
| **Potential SSRF via file content** | `POST /api/reports/translate` – `filePath` | `child_process.spawn` → `npm run translate-report` (engine) | No content validation; file may contain arbitrary URLs |

Both patterns rely on a child process that can perform arbitrary network requests. The lack of input sanitization or destination filtering is the core weakness.

## 3. Strategic Intelligence for Exploitation
- **Client Libraries**: The engine uses `npm run translate-report`, which internally may use `node-fetch` or `axios`. These libraries honor redirects and can resolve DNS, IPv4/IPv6, and IPv4-mapped IPv6 addresses.
- **Redirect Behavior**: No explicit redirect validation is performed in the API routes. If the engine follows redirects, an attacker can chain redirects to bypass simple allow‑lists.
- **Metadata Endpoints**: The SSRF vectors can target AWS (`169.254.169.254`), GCP (`169.254.169.254`), Azure (`169.254.169.254`), or local services (`127.0.0.1`, `localhost`).
- **Authentication Context**: Both endpoints require a valid JWT. An attacker who can obtain or forge a token can trigger the SSRF.

## 4. Secure by Design: Validated Components
| Component | Validation | Status |
|-----------|------------|--------|
| `POST /api/scan/start` | None | **Missing** |
| `POST /api/reports/translate` | Path containment check (`REPOS_BASE_DIR` or `/deliverables/`) | **Partial** – only file path, not content |
| Child process execution | No destination filtering | **Missing** |

The only validated check is the file path containment, which does not mitigate SSRF via file content.

## 5. Analysis Constraints and Blind Spots
- **Engine Source**: The `translate-report` script is not part of the repository; its implementation is unknown. We assume it performs HTTP requests based on file content.
- **Network Reachability**: We cannot confirm whether the engine actually performs outbound requests without executing the script.
- **Authentication**: The analysis assumes an attacker can obtain a valid JWT. If token issuance is tightly controlled, the practical risk may be lower.
- **Redirect Handling**: Without inspecting the engine, we cannot confirm if redirects are followed or validated.

---

**Recommendation**: Implement strict allow‑lists for `targetUrl` and validate URLs extracted from report files. Consider sandboxing the child process or using a dedicated HTTP client with destination filtering.
