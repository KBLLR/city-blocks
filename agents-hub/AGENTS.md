# CityBlocks — AGENTS Guide

Welcome to the Smart Campus / CityBlocks workspace. This guide keeps human and AI collaborators aligned on structure, workflows, and quality bars.

## 1. Repository Layout
- `src/react-app/` — React + Three.js client (components, hooks, pages, global styles). Path alias `@/` maps to `./src`.
- `src/worker/` — Cloudflare Worker entry point plus API routes (see `wrangler.json` for bindings to D1 + R2).
- `src/shared/` — Types and Zod schemas shared between the client and worker.
- `agents-hub/` — Operational docs (`AUDIT-log.md`, `tasks.md`, project templates, session templates).
- Root configs — `package.json`, `tsconfig*.json`, `vite.config.ts`, `tailwind.config.js`, `eslint.config.js`, `wrangler.json`. Keep these in sync with any tooling changes.

> Need a new initiative? Copy `agents-hub/project-template/` and follow its README before writing code.

## 2. Environment & Commands
1. Install deps once: `npm install` (pnpm/yarn work too, but keep lockfile consistent).
2. Dev server: `npm run dev` (Vite, served on `http://localhost:5173`). Worker stubs proxy via Vite.
3. Type-check + build: `npm run build` (runs `tsc -b` then `vite build`).
4. Lint: `npm run lint` (ESLint flat config, React Hooks + Refresh plugins).
5. Pre-flight / CI parity: `npm run check` (type-checks, builds, then `wrangler deploy --dry-run`). Configure `wrangler login` locally before running.
6. Cloudflare bindings live in `wrangler.json`; respect the declared `DB` (D1) and `R2_BUCKET` bindings when touching worker code.

Always run `npm run lint && npm run check` before opening a PR or handing off work. Capture failures + fixes in your session log.

## 3. Coding Standards
- **TypeScript-first**: `strict` mode is on; no implicit `any`. Use Zod schemas in `src/shared` when shaping API payloads.
- **Modules & imports**: Prefer `@/react-app/...` (alias) over relative `../../`. Keep imports ordered: std libs, third-party, aliased, relative.
- **React patterns**: Functional components only. Derive expensive values with `useMemo`, memoize callbacks passed down, prefer composition over prop drilling.
- **Styling**: Tailwind is available via `tailwind.config.js`; global overrides live in `src/react-app/index.css`. Co-locate component-specific styles next to the component when possible.
- **Three.js / rendering**: Heavy scene logic belongs in dedicated hooks/components under `src/react-app/components`. Document math helpers or geospatial transforms inline.
- **Worker code**: Keep handlers pure, schema-validate input, and gate external calls with clear timeouts/retries (see `Home.tsx` for retry style).

## 4. Workflow Expectations
- **Backlog**: Track all tasks in `agents-hub/tasks.md`. Every entry needs priority, owner, and a short research note or link trail.
- **Sessions**: Before writing code, spawn a log under `agents-hub/<project>/sessions/` (template + instructions inside `project-template/sessions/README.md`). Each session ties back to task IDs and records lint/test status.
- **Docs**: Update `SITEMAP.md`, `README.md`, or feature-specific docs when you move or add files so discovery remains accurate.
- **Audit alignment**: The current `AUDIT-log.md` defines “good state”. If you touch an item in that checklist, note it in your session log and, if needed, append to the audit file.

## 5. PR & Review Contract
1. Reference the relevant task IDs + session logs in the PR body.
2. Describe the change, tests run, known gaps, and deployment impact. Include screenshots or screen recordings for UI changes.
3. Keep diffs focused: prefer stacked PRs over mega-commits. Update tests/docs alongside code (no follow-up TODOs without owner + deadline).
4. No red CI allowed: PRs must pass `lint`, `build`, `check`. If a check is flaky, note the failure mode and mitigation in the PR.
5. Request review from an owner familiar with the touched domain. If handing off to another agent, link the latest session log.

## 6. When in Doubt
- Ask in `agents-hub/AUDIT-log.md` via a short note, or open a `questions` section in your session log for follow-up.
- If new tooling or infra is required, document the rationale + steps in `agents-hub/project-template/README.md` of the initiative you’re modifying.

Staying disciplined with these practices keeps the project in the “good state” described in the audit log and makes human ↔ AI collaboration predictable. Happy building!
