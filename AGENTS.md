# Repository Guidelines

## Project Structure & Module Organization
- `src/app` holds the Next.js App Router pages, layouts, and API route handlers (`src/app/api`).
- Shared UI pieces live in `src/components`, with state and data helpers in `src/context`, `src/hooks`, `src/lib`, and `src/constants`.
- Static assets are served from `public/` (images, icons, etc.).
- Prisma database schema and migrations are in `prisma/`, with a local SQLite database at `prisma/dev.db` and a root-level `dev.db` for legacy/debug use.
- One-off maintenance scripts are in `script/` (TypeScript/JS utilities).

## Build, Test, and Development Commands
- `npm run dev`: start the local Next.js dev server at `http://localhost:3000`.
- `npm run build`: create a production build.
- `npm run start`: run the production build locally.
- `npm run lint`: run ESLint (Next.js core-web-vitals + TypeScript rules).

## Coding Style & Naming Conventions
- Language: TypeScript + React (Next.js 16). Keep components in `.tsx` and utilities in `.ts`.
- Indentation: follow existing files (2 spaces in JSON/TS/TSX); keep line breaks consistent with current patterns.
- Naming: React components use `PascalCase` (e.g., `Navbar.tsx`); hooks use `useCamelCase` (e.g., `useAuth`); route segments in `src/app` are kebab-case when needed.
- Styling: Tailwind CSS utilities are common; prefer `clsx`/`tailwind-merge` for conditional class composition.

## Testing Guidelines
- No automated test runner is configured in this checkout. If you add tests, also add the corresponding scripts and document how to run them.

## Commit & Pull Request Guidelines
- Git history is not available in this workspace (`.git` is missing), so no commit convention can be inferred.
- Use clear, imperative commit messages (e.g., “Add scan history filters”) and include scope if your team prefers it.
- PRs should include: a concise description, screenshots for UI changes, and any relevant configuration notes (e.g., `.env` keys, Prisma changes).

## Configuration & Data Notes
- Environment settings are expected in `.env`. Avoid committing secrets; document new keys in PRs.
- Prisma schema changes should be paired with migrations in `prisma/migrations`.
