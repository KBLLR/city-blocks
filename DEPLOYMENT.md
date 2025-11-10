# Deployment Guide

## 1. GitHub → CI
- Every push / PR to `main` runs `.github/workflows/ci.yml` (`pnpm run lint` + `pnpm run build`).
- CI must remain green before merging; add additional jobs (e.g., integration tests) in the same workflow when needed.

## 2. Local Verification
```bash
pnpm install
cp .env.example .env.local   # populate secrets
pnpm run lint
pnpm run build
pnpm run dev                 # optional manual QA
```

## 3. Vercel Setup
1. Import the GitHub repo into Vercel.
2. When prompted:
   - Framework: **Vite**
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install --frozen-lockfile`
3. Configure Environment Variables (Project Settings → Environment Variables):
   - `VITE_OPENAI_API_KEY`
   - `VITE_GENAI_API_KEY`
   - `VITE_HUGGINGFACE_API_KEY`
   - `VITE_OLLAMA_API_KEY`
4. Vercel picks up `vercel.json` for routing (SPA fallback). Provide environment variables directly in the project settings or via `vercel env`.

## 4. Preview & Production
- Each PR / commit to non-`main` branches creates a Vercel Preview deployment.
- Merging to `main` triggers a Production deployment.
- Smoke-test by running `pnpm run preview` locally or opening the Preview URL.

## 5. Rollbacks
- Use Vercel’s “Promote to Production” history to roll back to a previous deployment.
- Keep the repo tagged (`git tag deploy-<date>`) if you want git-level rollback anchors.

> Tip: add monitoring/status checks to the workflow when backend endpoints are introduced.
