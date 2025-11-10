# Contributing to CityBlocks

Thanks for helping keep the repo healthy. This guide condenses the expectations from `agents-hub/AGENTS.md`.

## Workflow
1. **Create / update a session log** under `agents-hub/<project>/sessions/` before you start coding. Reference the task IDs you are working on.
2. **Branch** from `main` with a descriptive name (`feature/gui-controls`).
3. **Code style**
   - TypeScript `strict` mode is enabled → avoid `any`.
   - Prefer the `@/react-app/...` alias over long relative imports.
   - Keep React components functional; memoize expensive calculations.
4. **Testing**
   - `pnpm run lint`
   - `pnpm run build`
   - Optional: `pnpm run dev` (manual verification) or bespoke tests.
5. **Commit / PR**
   - Reference task IDs + session IDs in the commit/PR body.
   - Attach screenshots or recordings for UI changes.
   - Open a PR against `main` using the template; CI must pass before merge.

## Environment
Copy `.env.example` → `.env.local` (or configure Vercel project env) and provide any required keys:

```bash
cp .env.example .env.local
```

## Deployment
See `DEPLOYMENT.md` for GitHub → Vercel steps. Production deploys require a green CI run and manual approval in Vercel.

Please read `agents-hub/AGENTS.md` whenever in doubt—it is the ground truth for collaboration norms.
