# CityBlocks Setup Project

Repo hygiene + tooling refresh for the CityBlocks experience. This initiative tracks the removal of Mocha scaffolding, dependency upgrades, and the new API key UX so future humans/agents can resume from a clean state.

## Project Snapshot
- Variant: `HITL`
- Intent: `Stabilize CityBlocks (clean deps + local API key UX) so future features start from a trustworthy baseline.`
- Owner: `@davidcaballero`

## Charter
### Objectives
1. Replace the Mocha-specific tooling with a standard Vite/Cloudflare setup.
2. Provide a local-only API key experience (OpenAI today, Gemini/Hugging Face/Ollama soon).
3. Capture audit-grade docs (tasks + sessions) for future hand-offs.

### In Scope
- Dependency sweeps, config cleanup, README updates.
- API key storage, worker header plumbing, DevTools stability.
- Documentation inside `agents-hub/cityblocks-setup`.

### Out of Scope (for now)
- Implementing Gemini/Hugging Face/Ollama inference.
- Refactoring the 3D scene or worker logic beyond stability fixes.

### Stakeholders
- Product / Eng: @davidcaballero
- Reviewers: Future CityBlocks contributors (tag in PRs).

### Success Criteria
- ✅ CityBlocks builds w/out Mocha deps (`pnpm install`, `pnpm run dev`).
- ✅ API key button visible bottom-left; headers forwarded to the worker.
- ✅ README/tasks/session docs reflect current baseline.
- 🚧 Remaining lint issues concentrated in `Home.tsx` (tracked as CBS-103).

## Artifacts
- `tasks.yaml` / `tasks.md`: backlog & ledger for CBS-1xx items.
- `sessions/`: timestamped working notes; see latest entry for 2025-11-09.

Update this README when scope or stakeholders shift so every agent knows how we got here and what “done” means.
