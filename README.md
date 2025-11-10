## CityBlocks

CityBlocks is a Vite + React + Three.js experience for exploring building footprints. The app now runs entirely as a client-side experience, making it easy to host on any static platform (Vercel, Netlify, etc.).

### 1. Requirements
- Node.js 20+
- pnpm 9+

### 2. Setup
```bash
pnpm install
cp .env.example .env.local  # fill in provider keys
pnpm run dev
```

### 3. Scripts
| Command | Description |
| --- | --- |
| `pnpm run dev` | Start the Vite dev server. |
| `pnpm run lint` | ESLint (flat config). |
| `pnpm run build` | Type-check then build the client bundle. |
| `pnpm run preview` | Serve the built bundle locally (matches Vercel). |
| `pnpm run check` | CI parity (tsc + Vite build). |

> Always run `pnpm run lint && pnpm run build` (or `pnpm run check`) before pushing.

### 4. Environment Variables
Configure the following in `.env.local` (or Vercel Project Settings):
- `VITE_OPENAI_API_KEY`
- `VITE_GENAI_API_KEY`
- `VITE_HUGGINGFACE_API_KEY`
- `VITE_OLLAMA_API_KEY`

The in-app API key button stores overrides in local storage for manual testing.

### 5. Deployment
- GitHub Actions (`.github/workflows/ci.yml`) runs lint + build on every push/PR.
- Vercel uses `vercel.json` → `pnpm run build` with SPA fallback routes.
- Full deployment instructions live in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

### 6. Contributing
- Follow [`CONTRIBUTING.md`](./CONTRIBUTING.md) and `agents-hub/AGENTS.md`.
- Log each working session under `agents-hub/<project>/sessions/`.
- Use the PR template and link the relevant task/session IDs.
