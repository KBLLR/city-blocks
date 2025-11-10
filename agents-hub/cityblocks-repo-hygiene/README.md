# CityBlocks Repo Hygiene & Deployment

Tighten the core repo so it is production-friendly: GitHub-ready, Vercel-deployable, and resilient to flaky builds. This initiative tracks the hardening work (workflows, env scaffolding, docs, and QA conventions) before the repo is opened up.

## Project Snapshot
- Variant: `HITL`
- Intent: `Stand up CI/deployment guardrails so CityBlocks can ship from GitHub to Vercel without surprises.`

## Objectives
1. **GitHub Prep** — Add issue/PR templates, contribution guidelines, and baseline CI that runs lint/type/build on every push + PR.
2. **Vercel Deployability** — Provide `vercel.json`, env variable scaffolding, and deployment docs so the app can be promoted with a single import.
3. **Robustness** — Capture env defaults, add `.env.example`, and ensure scripts/tests cover the critical paths mentioned in AGENTS.md.

## Deliverables
- `.github/` automation (CI workflow, issue/PR templates).
- Deployment notes (README + `DEPLOYMENT.md`) describing GitHub/Vercel flows and env secrets.
- `.env.example` + `vercel.json` with the correct build/preview commands.
- Updated `tasks.yaml` & session logs documenting future hardening follow-ups.

## Success Criteria
- `pnpm run lint` + `pnpm run build` executes via GitHub Actions on PRs.
- Vercel import succeeds using the committed config, with env vars documented.
- Contributors have a clear path (docs + templates) for filing issues, opening PRs, and logging sessions per AGENTS.md.
