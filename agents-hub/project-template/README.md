# Project Template

Use this template project to organise work streams, capture tasks, and attach session logs before every commit. Duplicate the folder, rename it to match your initiative (e.g., `docs/projects/3d-experience/`), then keep the following artifacts up to date.

## Project Snapshot
- Variant: `HITL | SEMI | UNSUPERVISED`
- Intent: `Describe the vision in one sentence`

## Folder Structure
- `README.md` — Project overview, scope, success criteria.
- `tasks.yaml` — Source of truth for the backlog (export to `tasks.md` via `pnpm run tasks:export`).
- `tasks.md` — Generated ledger (do not edit manually).
- `sessions/` — Individual session logs (`pnpm run new:session` helps create them).

## Getting Started
1. Copy this directory:  
   `cp -R docs/projects/template docs/projects/<your-project-name>`
2. Update the new `README.md` with:
   - Project charter and objectives.
   - Stakeholders / reviewers.
   - Key dependencies.
3. Populate `tasks.yaml` with the initial backlog (Backlog → In Progress lanes) and prioritise.
4. Export the ledger: `pnpm run tasks:export`.
5. For each working session, run `pnpm run new:session "<objective>"` (see `sessions/README.md`) *before* committing changes.

## Best Practices
- Keep entries concise but descriptive; future contributors should understand context at a glance.
- Link tasks to GitHub issues, tickets, or Notion docs where applicable.
- Reference session IDs in PR descriptions so reviewers can trace decisions quickly.
- Before adding or starting any task, perform a quick web search on the topic and record the key links or notes inside `tasks.md` so the research trail is preserved.
- Use `pnpm run check` before every PR to ensure lint/tests pass.

> Tip: Commit session logs alongside the code they describe to maintain an auditable history.
