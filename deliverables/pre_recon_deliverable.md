# Pre-Reconnaissance Report


## Network Scanning (nmap)
Status: skipped
nmap-mock

## Subdomain Discovery (subfinder)
Status: skipped
subfinder-mock

## Technology Detection (whatweb)
Status: skipped
```
whatweb-mock
```
## Code Analysis
# Penetration Test Scope & Boundaries

**Primary Directive:** Analysis strictly limited to the **network-accessible attack surface**. Before reporting any finding, verify it meets In‑Scope criteria.

## In‑Scope: Network‑Reachable Components
- Public pages, APIs, RPC endpoints
- Authenticated endpoints via normal login mechanisms
- Webhooks, callback endpoints, upload endpoints, GraphQL, OpenAPI‑described surfaces
- Debug/admin routes if reachable

## Out‑of‑Scope: Locally Executable Only
- CLI tools, scripts, migration tools, CI/CD pipelines, local dev servers, test harnesses
- Static files requiring manual opening (not served)

---

## 1. Executive Summary
The Dokodemodoor‑front application is a Next.js 13+ server‑side rendered (SSR) web application that exposes a REST‑style API under `/api`. The API is protected by JWT‑based authentication stored in HTTP‑Only cookies (`auth_token` and `refresh_token`). The application uses Prisma as an ORM to a relational database and relies on environment variables for secrets and configuration. The codebase follows a conventional Next.js folder structure with API routes under `src/app/api`. The primary attack surface consists of authentication endpoints, report translation, and various admin‑level routes guarded by a custom `withAuth` middleware.

Key findings:
- **Auth cookie flags** are correctly set to `httpOnly` and `sameSite=lax`. In production the `secure` flag is enabled, but in development it is not, which is acceptable for local testing.
- **Path traversal** in the report translation endpoint is mitigated by strict base‑directory checks, but the endpoint still spawns a child process which could be abused if the translation script performs external network calls.
- **CSRF risk** exists for state‑changing endpoints (e.g., `/api/auth/logout`, `/api/reports/*`) because `sameSite=lax` allows cross‑origin POSTs. No CSRF tokens are present.
- **Potential IDOR**: Several admin routes (`/api/reports/*`, `/api/scan/*`) rely on role checks but do not appear to enforce ownership checks on resources, raising the possibility of IDOR.
- **Missing coverage**: The login, register, and file upload endpoints are not present in the inspected files; their security posture remains unknown.

Overall, the application demonstrates a solid baseline of authentication and session management but exhibits typical web‑app risks such as CSRF, potential IDOR, and the need for stricter input validation on file‑based operations.

---

## 2. Architecture & Technology Stack
- **Framework & Language**: Next.js 13 (React + Node.js) with TypeScript.
- **Architectural Pattern**: Server‑Side Rendering (SSR) with API routes under `src/app/api`. The API follows a REST‑style pattern with JSON payloads.
- **Critical Security Components**:
  - **Auth**: JWT stored in HTTP‑Only cookies, refreshed via a `refresh_token` stored in the database.
  - **Authorization**: Role‑based checks via a custom `withAuth` middleware.
  - **Input Validation**: Basic checks in API routes; no global validation library observed.
  - **Database**: Prisma ORM; no evidence of raw SQL usage.
  - **Headers**: No explicit security headers (HSTS, CSP) found in the code; likely set by the hosting environment.
  - **Rate Limiting**: No evidence of rate limiting middleware.

---

## 3. Authentication & Authorization Deep Dive
### Auth Endpoints
| Method | Path | Auth Required | Notes |
|--------|------|---------------|-------|
| GET | `/api/auth/me` | No (used to check session) | Returns `authenticated` flag and user info if token valid. |
| POST | `/api/auth/logout` | Yes (requires valid cookies) | Deletes `refresh_token` from DB and clears cookies. |
| POST | `/api/auth/login` | No | **Not present in inspected files** – assumed to exist. |
| POST | `/api/auth/register` | No | **Not present** – assumed to exist. |

### Session & Token Handling
- **Cookie Names**: `auth_token` (access JWT), `refresh_token` (opaque token).
- **Cookie Flags**: `httpOnly: true`, `sameSite: lax`, `secure` only in production, `maxAge: 4h`, `path: '/'`.
- **JWT Secret**: `process.env.JWT_SECRET` (default fallback). 
- **Access Token Expiry**: `process.env.JWT_ACCESS_TOKEN_EXPIRY` (default 4h).
- **Refresh Token Flow**: On token expiry, `/api/auth/me` attempts to issue a new access token using the refresh token stored in DB.
- **User Status Check**: Both access and refresh flows verify `user.status === 'ACTIVE'`.

### Authorization Checks
- **`withAuth` Middleware**: Imported in many API routes (`reports/*`, `configs`, `scan/*`). The middleware accepts an array of roles (e.g., `['ADMIN', 'SECURITY']`). The implementation is not inspected, but it likely verifies the JWT role claim.
- **Potential IDOR**: The routes do not show ownership checks on resources (e.g., report IDs). If `withAuth` only checks role, any authenticated user with the required role could access any resource.

### Multi‑Tenancy
- No evidence of tenant isolation; the application appears to be single‑tenant.

---

## 4. Data Security & Storage
- **Database**: Prisma ORM; no raw SQL observed. All queries appear to be parameterized via Prisma.
- **Sensitive Data**: User passwords are stored in the database (not shown in code). JWT secrets are stored in environment variables.
- **Secrets Management**: No explicit secret management library; secrets are loaded from `process.env`.
- **Logging**: Basic console logging for auth errors; no structured logging or redaction of sensitive fields.
- **File System**: Report translation writes to a child process; the resolved path is validated against `REPOS_DIR` and `/deliverables/`.

---

## 5. Attack Surface Analysis
Below is a curated list of network‑reachable entry points discovered in the codebase. For each, we provide a brief security assessment and attack hypotheses.

| Endpoint | Method | Auth Required | Primary Inputs | Trust Boundary | Attack Hypotheses |
|----------|--------|---------------|----------------|----------------|-------------------|
| `/api/auth/me` | GET | No | None | Auth cookie | *None* – only reads session. |
| `/api/auth/logout` | POST | Yes | None | Auth cookie | **CSRF** – sameSite lax allows cross‑origin POST. <br>**Mitigation**: CSRF token or sameSite strict. |
| `/api/auth/login` | POST | No | `username`, `password` | Auth cookie | **Brute‑force** (no rate limiting). <br>**Credential stuffing**. <br>**Password reuse**. |
| `/api/auth/register` | POST | No | `username`, `password`, `email` | Auth cookie | **Account takeover** via email verification bypass. <br>**Duplicate username**. |
| `/api/reports/translate` | POST | Yes | `filePath` (JSON body) | File system, child process | **Path traversal** (mitigated). <br>**Command injection** via `npm run translate-report` if script unsanitized. <br>**SSRF** if translation script fetches external resources. <br>**Denial‑of‑service** via large file or long translation. |
| `/api/reports/translate` | GET | Yes | None | File system | **Information disclosure** – lists ongoing translations. |
| `/api/reports/register` | POST | Yes | `reportData` | DB | **IDOR** if report ID not checked. <br>**SQL/NoSQL injection** unlikely due to Prisma. |
| `/api/reports/file` | GET/POST | Yes | `fileId` or upload | DB, file system | **IDOR** on file access. <br>**File upload** – potential for arbitrary file upload if not validated. |
| `/api/reports/list` | GET | Yes | None | DB | **IDOR** if pagination not scoped to user. |
| `/api/configs` | GET/POST | Yes | `configKey`, `configValue` | DB | **IDOR** on config keys. <br>**Privilege escalation** if role checks insufficient. |
| `/api/scan/start` | POST | Yes | `scanParams` | External services | **SSRF** if `scanParams` include URLs. <br>**Command injection** if parameters passed to shell. |
| `/api/scan/[id]/reports` | GET | Yes | `id` | DB | **IDOR** on scan reports. |

### Blind Spots
- **Login/Registration**: Implementation not inspected; potential for weak password policies, missing rate limiting, or insecure storage.
- **File Upload**: No code inspected; risk of arbitrary file upload or path traversal.
- **CSRF**: Only noted for logout; other state‑changing endpoints may also be vulnerable.
- **XSS**: No client‑side rendering code inspected; potential DOM XSS in report views.
- **SSRF**: Only speculative based on translation script; actual outbound calls not inspected.
- **Rate Limiting**: No evidence of global or per‑endpoint rate limiting.
- **Security Headers**: No explicit CSP, HSTS, or X‑Frame‑Options set in code.

---

## 6. Infrastructure & Operational Security
- **Secrets**: Stored in environment variables (`JWT_SECRET`, `JWT_ACCESS_TOKEN_EXPIRY`, `COOKIE_SECURE`). No external secret manager observed.
- **Security Headers**: Not set in code; likely rely on hosting provider defaults.
- **Logging**: Basic console logs; no structured logging or alerting.
- **Monitoring**: No integration with external monitoring services observed.
- **Dependencies**: Uses `next`, `prisma`, `jose`, `dotenv` (implied). No audit of dependency versions.

---

## 7. Overall Codebase Indexing
```
src/
├─ app/
│  ├─ api/
│  │  ├─ auth/
│  │  │  ├─ me/route.ts
│  │  │  ├─ logout/route.ts
│  │  │  └─ ... (login, register not present)
│  │  ├─ reports/
│  │  │  ├─ translate/route.ts
│  │  │  ├─ register/route.ts
│  │  │  ├─ file/route.ts
│  │  │  └─ list/route.ts
│  │  ├─ configs/route.ts
│  │  ├─ scan/
│  │  │  ├─ start/route.ts
│  │  │  └─ [id]/reports/route.ts
│  └─ ... (client pages, components)
├─ lib/
│  ├─ prisma.ts
│  ├─ auth-server.ts (not found – likely in lib)
│  └─ scan-utils.ts
└─ ... (other directories)
```

---

## 8. Critical File Paths
| Category | File Path | Notes |
|----------|-----------|-------|
| **Auth** | `src/app/api/auth/me/route.ts` | Session validation, token refresh logic |
| | `src/app/api/auth/logout/route.ts` | Logout and refresh token cleanup |
| | `src/app/api/auth/login/route.ts` | *Not present* – assumed |
| | `src/app/api/auth/register/route.ts` | *Not present* – assumed |
| **Report Translation** | `src/app/api/reports/translate/route.ts` | File path validation, child process spawning |
| **Reports** | `src/app/api/reports/register/route.ts` | Report creation |
| | `src/app/api/reports/file/route.ts` | File access/upload |
| | `src/app/api/reports/list/route.ts` | List reports |
| **Configs** | `src/app/api/configs/route.ts` | Configuration CRUD |
| **Scan** | `src/app/api/scan/start/route.ts` | Scan initiation |
| | `src/app/api/scan/[id]/reports/route.ts` | Scan report retrieval |
| **Auth Middleware** | `src/lib/auth-server.ts` | *Not found* – likely contains `withAuth` implementation |
| **Prisma Client** | `src/lib/prisma.ts` | Database access |
| **Scan Utils** | `src/lib/scan-utils.ts` | DB sync logic |

---

## 9. XSS Sinks and Render Contexts
No explicit XSS sinks were identified in the inspected API routes. Client‑side rendering code (React components, pages) was not examined, so potential DOM XSS sinks remain **Unverified**.

---

## 10. SSRF Sinks
The only potential outbound request originates from the report translation endpoint, which spawns a child process (`npm run translate-report`). The translation script may perform external HTTP requests (e.g., to fetch external resources or APIs). Without inspecting the script, the SSRF risk is **Unverified**.

---

## Coverage & Confidence
- **Coverage**: Inspected `src/app/api` routes and key auth files. Did not inspect client‑side components, `withAuth` implementation, or translation script.
- **Confidence**: Medium – based on visible code; blind spots noted.
- **Blind Spots**: Login/registration logic, file upload handling, client‑side XSS sinks, SSRF details, rate limiting, security headers.

---

## Next Steps for Penetration Testers
1. **Verify CSRF** on all state‑changing endpoints (e.g., `/api/auth/logout`, `/api/reports/*`).
2. **Test IDOR** on report and scan endpoints by manipulating IDs.
3. **Assess login/registration** for brute‑force, password policy, and account takeover vectors.
4. **Inspect translation script** for external calls and potential SSRF.
5. **Check client‑side rendering** for XSS sinks.
6. **Validate rate limiting** and security headers.

---

**PRE-RECONNAISSANCE ANALYSIS COMPLETE**

## Authenticated Scans

### SCHEMATHESIS
Status: skipped
Skipped (skip external tools)

---
Report generated at: 2026-01-24T19:27:21.925+09:00