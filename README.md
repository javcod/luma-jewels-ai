# LumaJewel AI

A luxury jewelry storefront (React + Vite) with **Luma Concierge** — a
tool-using AI shopping assistant (Python/FastAPI backend, real Gemini or a
deterministic fake provider) that answers jewelry questions by actually
searching the product catalog, never by inventing an answer.

```
Browser
  ↓
React/Vite frontend  ──deploys to──►  Vercel
  ↓  POST /concierge/chat, GET /products
FastAPI backend      ──deploys to──►  Render
  ↓
Agent orchestrator → product tools → canonical catalog
  ↓
Gemini API (backend-only — never exposed to the browser)
```

Full backend architecture, agent design, and API reference: [backend/README.md](backend/README.md).

## Local development

**Frontend:**
```bash
npm install
npm run dev
```
Runs at `http://localhost:5173`. Optionally copy `.env.example` to
`.env.local` to point at a non-default backend URL.

**Backend:** see [backend/README.md](backend/README.md) for the full setup
(virtualenv, dependencies, `.env`). Quick version:
```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate  # or bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
Defaults to the deterministic `FakeLLMProvider` — no API key needed to run
the full app locally.

## Deployment

The frontend and backend deploy independently — Vercel never talks to
Gemini, and Render never serves frontend files.

### 1. Push to GitHub
Commit and push this repository to a GitHub repo (not performed as part of
any automated phase — this is a manual step you run yourself).

### 2. Backend → Render
1. In Render, create a new **Blueprint** from your GitHub repo — it will
   pick up `render.yaml` at the repo root automatically and configure the
   `lumajewel-backend` web service (root directory `backend/`, Python
   runtime, `pip install -r requirements.txt`, `uvicorn` start command,
   `/health` health check).
2. When prompted, set the environment variables marked `sync: false` in
   `render.yaml`:
   - `FRONTEND_ORIGIN` — leave a placeholder for now (e.g.
     `http://localhost:5173`); you'll update it after step 3 once you know
     your real Vercel URL.
   - `LLM_API_KEY` — your real Gemini API key. **Only set this here, in
     Render — never in Vercel or any frontend file.**
3. Deploy. Confirm `https://<your-service>.onrender.com/health` returns
   `{"status": "ok", ...}`.

### 3. Frontend → Vercel
1. Import the same GitHub repo into Vercel. It auto-detects the Vite
   project — no `vercel.json` needed (this app is a single page with no
   client-side routing to configure rewrites for).
2. Set one project environment variable:
   - `VITE_API_BASE_URL` = your Render backend URL from step 2
     (e.g. `https://lumajewel-backend.onrender.com`).
3. Deploy.

### 4. Close the loop
Go back to Render and update `FRONTEND_ORIGIN` to your real Vercel URL
(comma-separate it with `http://localhost:5173` if you still want local
dev to keep working against the deployed backend), then redeploy the
backend so the new CORS origin takes effect.

### 5. Final live smoke test
Open the deployed Vercel URL, confirm the product grid loads (proves
Vercel → Render → `/products` works), open Luma Concierge and send a
message (proves the full agent loop works against the deployed backend).

## Environment variables

| Var | Where it's set | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Vercel (frontend) | Backend base URL. See `.env.example`. |
| `FRONTEND_ORIGIN` | Render (backend) | Allowed CORS origin(s), comma-separated. |
| `LLM_PROVIDER` | Render (backend) | `fake` or `gemini`. |
| `LLM_MODEL` | Render (backend) | Gemini model id. |
| `LLM_API_KEY` | Render (backend) **only** | Real Gemini API key — never in frontend/Vercel. |

Full details, defaults, and rationale: [backend/.env.example](backend/.env.example) and [backend/README.md](backend/README.md).
