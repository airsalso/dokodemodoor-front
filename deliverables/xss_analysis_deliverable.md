# XSS Analysis Report

## 1. Executive Summary
The Dokodemodoor front‑end is a Next.js 13+ single‑page application that allows authenticated users to create, edit, and view report files stored on the server. The client‑side page `src/app/reports/page.tsx` renders the file content using `dangerouslySetInnerHTML` without any sanitization. This creates a **stored XSS** vector that is externally exploitable: any authenticated user can inject malicious HTML/JavaScript into a report, and the payload will execute in the victim’s browser when the report is viewed.

The vulnerability is not mitigated by CSP or other defenses because the application does not set a restrictive CSP header and relies solely on the default browser policy. The sink is a direct DOM insertion in the HTML body context, and the source is a network‑reachable API that accepts arbitrary content. No encoding or escaping is performed on the data before rendering.

## 2. Dominant Vulnerability Patterns
| Pattern | Location | Impact |
|---------|----------|--------|
| **Stored XSS via `dangerouslySetInnerHTML`** | `src/app/reports/page.tsx` (line ~278) | Arbitrary script execution in any user’s browser when a report is viewed. |
| **Potential Log XSS** | `src/app/logs/page.tsx` (line ~240) | Similar to reports, but logs are not user‑editable; risk is lower but still present if logs contain attacker‑controlled data. |

## 3. Strategic Intelligence for Exploitation
- **Authentication**: The API requires a valid JWT stored in an HTTP‑Only cookie. An attacker can obtain a token via XSS or simply use their own account to create malicious reports.
- **Role**: Any authenticated user can write to `/api/reports/file`. No ownership checks are performed; thus a normal user can create a report that will be displayed to any other user.
- **CSP**: No CSP header is set in the codebase. The default browser policy allows inline scripts, so the injected payload will execute.
- **Framework**: The application uses React. The `dangerouslySetInnerHTML` hook bypasses React’s automatic escaping, making it a direct sink.

## 4. Vectors Analyzed and Confirmed Secure
| Vector | Status |
|--------|--------|
| `POST /api/reports/file` (content) | **Vulnerable** – no sanitization. |
| `GET /api/reports/file?path=` | **Vulnerable** – content is rendered unsanitized. |
| `dangerouslySetInnerHTML` in reports page | **Vulnerable** – renders raw HTML. |
| `dangerouslySetInnerHTML` in logs page | **Vulnerable** – same as reports. |
| Other sinks (e.g., `innerHTML` in Terminal) | **Safe** – used only for internal terminal rendering, not user‑controlled. |

## 5. Analysis Constraints and Blind Spots
- The analysis is limited to the client‑side rendering of report and log files. We did not inspect the server‑side validation of the `content` field in `/api/reports/file`. If the server performs sanitization before storage, the vulnerability may be mitigated.
- The logs endpoint is not user‑editable; the risk depends on whether logs can contain attacker‑controlled data.
- No CSP header was found in the codebase; however, the hosting environment may inject headers not visible in the repository.
- We did not analyze the `withAuth` middleware implementation; it may enforce additional checks that could affect the attack surface.

---

**Conclusion**: The application contains a high‑severity stored XSS vulnerability that is externally exploitable. Immediate remediation is required: sanitize or escape all user‑controlled content before rendering, or remove the use of `dangerouslySetInnerHTML`.
