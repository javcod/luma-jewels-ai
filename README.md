# Luma Jewels AI

An AI-powered luxury jewellery shopping platform combining conversational product discovery, a tool-using AI concierge, and a premium e-commerce front end — backed by a real FastAPI service and Google Gemini, not a mock.

🔴 **Live Demo:** [luma-jewels-ai.vercel.app](https://luma-jewels-ai.vercel.app/)
🔗 **Repository:** [github.com/javcod/luma-jewels-ai](https://github.com/javcod/luma-jewels-ai)
⚙️ **Backend API:** [lumajewel-backend.onrender.com](https://lumajewel-backend.onrender.com/) ([/health](https://lumajewel-backend.onrender.com/health), [/docs](https://lumajewel-backend.onrender.com/docs))

![React](https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

> ⏳ **Note on the live demo:** the backend runs on Render's free tier, which spins down after inactivity. The first request after a period of idleness can take 30–60 seconds to wake up — this is expected, not a bug.

---

## 1. Project Overview

Luma Jewels AI is a full-stack jewellery e-commerce experience with a real, tool-using AI shopping assistant — **Luma Concierge** — sitting on top of a genuine product catalog. A visitor can browse the collection, open the Concierge, ask something like *"show me something under $5,000"*, and get back an answer that is grounded entirely in real catalog data retrieved by backend tools, never invented by the model.

The system is split cleanly into an independently-deployed React/Vite frontend and a Python/FastAPI backend that owns the product catalog, the agent orchestration loop, and the only code path that ever talks to Gemini.

## 2. Live Demo

| | |
|---|---|
| **Frontend (Vercel)** | https://luma-jewels-ai.vercel.app/ |
| **Backend (Render)** | https://lumajewel-backend.onrender.com/ |
| **API docs (Swagger)** | https://lumajewel-backend.onrender.com/docs |
| **Health check** | https://lumajewel-backend.onrender.com/health |

## 3. Why Luma Jewels AI?

Most "AI shopping" demos either fake the AI (static copy dressed up as a recommendation engine) or bolt an LLM onto nothing, letting it hallucinate products and prices. Luma Jewels AI is built the other way around:

- The catalog is a real, deterministic, testable service (`GET /products`) — the single source of truth for every product fact.
- The agent **never** answers a catalog question from memory. Every recommendation, comparison, or price the Concierge states came from a tool call against that catalog in the same turn.
- The LLM layer is fully abstracted, so the same orchestrator runs identically against a deterministic fake provider (for tests and key-less local dev) or the real Gemini model (in production) — nothing in the agent or tool code changes based on which one is active.
- Failure modes are handled deliberately: transient Gemini `5xx` errors are retried, `4xx`/quota errors are not, and no raw exception, stack trace, or provider detail is ever returned to the client.

## 4. Key Features

### AI Features (real backend integration)
- **Luma Concierge** — a tool-using AI jewellery shopping assistant, reachable from a chat panel on every page
- Natural-language jewellery discovery ("find a ring", "help me choose a gift")
- Budget-, metal-, gemstone-, and category-aware filtering, backed by real tool calls
- Product comparison across multiple catalog items
- Grounded recommendation explanations — the assistant explains *why* using only data a tool actually returned
- A transparent, user-safe activity trace per reply (e.g. *"Searched the catalog · Applied: Rings · Under $5,000 · Found 1 piece"*)
- Honest inventory handling — the assistant states plainly when live stock status isn't known rather than guessing

### Shopping Experience
- Live product grid fetched from the backend catalog (`GET /products`), with loading and error states
- Product detail modal
- Wishlist toast feedback (local UI state — see [Known Limitations](#17-known-limitations))
- Fully responsive, animated interface (Framer Motion / Motion, Lenis smooth scroll)
- Curated collection showcase, trust and testimonial sections

### Personalization
- **Style Quiz** — a four-question flow (occasion, style, metal tone, budget) that produces a "Style Aura" profile and a best-match suggestion, computed client-side by rule-based logic (see [Known Limitations](#17-known-limitations) — this flow is independent of the Gemini-backed Concierge)

## 5. AI / Agent Architecture

```
Browser
    │
    ▼
React / Vite frontend  ──deploys to──►  Vercel
    │   POST /concierge/chat · GET /products
    ▼
FastAPI backend        ──deploys to──►  Render
    │
    ▼
Agent orchestrator (app/agents) — explicit Python loop, capped at 3 tool-calling iterations
    │
    ▼
LLMProvider interface (app/llm) — FakeLLMProvider (dev/tests) or GeminiProvider (production)
    │
    ▼
Product tools (app/tools) — 5 read-only tools, delegate only
    │
    ▼
product_service → app/data/products.json — the one canonical catalog
    │
    ▼
Gemini API (backend-only — the key never reaches the browser)
```

This project intentionally uses **an explicit orchestration loop, not LangGraph or a multi-agent framework** — the current graph has one decision point and a small, fixed tool set, so a single readable Python file expresses the whole state machine with zero added dependencies. That's a documented, deliberate trade-off (see `backend/README.md`), not a limitation of the approach.

**Layer separation:**

| Layer | Responsibility | Never does |
|---|---|---|
| Frontend (`src/`) | Renders UI, calls the backend over `fetch` | Never calls Gemini directly, never sees the API key |
| API (`app/api`) | HTTP concerns only — validation, routing, response shaping | No business logic |
| Orchestrator (`app/agents`) | Runs the reasoning ↔ tool-call loop, builds the safe trace | Never talks to a specific LLM vendor |
| LLM provider (`app/llm`) | Talks to Gemini (or the fake stand-in), converts to/from provider-agnostic types | Never touches the catalog directly |
| Tools (`app/tools`) | Expose 5 read-only catalog operations to the model | No catalog logic — delegates entirely |
| Catalog service (`app/services`) | Deterministic, in-memory catalog queries | No LLM, no randomness, no network calls |

## 6. How Luma Concierge Works

1. A user types a message in the Concierge panel; the frontend calls `POST /concierge/chat` with `{ "message": "..." }`.
2. The orchestrator sends the conversation plus the 5 available tool definitions to the active `LLMProvider`.
3. If the model requests a tool call (e.g. `search_products` with `{category: "Rings", max_price: 5000}`), the orchestrator validates the call, executes it against the real catalog service, and appends the result back into the conversation.
4. This reasoning ↔ tool-call cycle repeats until the model returns a final natural-language message, or a 3-iteration cap is hit.
5. The response is assembled server-side: `recommended_products` is built **only** from validated tool output — the model's text can never cause a product to appear that a tool didn't actually return.
6. A safe, high-level `trace` (e.g. *"Understanding your request" → "Searching the LumaJewel catalog" → "Preparing your recommendation"*) is returned alongside the message — never the system prompt, raw tool JSON, or model reasoning text.

**Terminology used deliberately in this project:** *tool-using AI shopping assistant*, *AI-powered jewellery concierge*, *LLM-driven, catalog-grounded recommendation workflow*. It is not autonomous, not multi-agent, and not "AGI" — it's a single, explicit reasoning loop over a fixed, read-only tool set.

## 7. System Architecture

```
Browser
    ↓
React/Vite Frontend (Vercel)
    ↓  fetch()
FastAPI Backend (Render)
    ↓
Agent Orchestrator  →  LLM Provider (Gemini / Fake)
    ↓
Product Tools  →  Product Catalog Service  →  products.json
```

The frontend and backend deploy and scale **independently** — Vercel never talks to Gemini, and Render never serves frontend files. CORS (`FRONTEND_ORIGIN`) is the only thing binding them together at runtime.

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion / Motion, Lenis (smooth scroll) |
| Icons | lucide-react |
| Backend | Python 3.11+, FastAPI |
| Data validation | Pydantic v2, pydantic-settings |
| AI provider | Google Gemini (`google-genai` SDK), plus a deterministic fake provider for dev/tests |
| Agent layer | Custom explicit orchestrator (no LangGraph/LangChain) |
| API style | REST (JSON) |
| Testing | Pytest + httpx (backend, 119 tests); ESLint (frontend) |
| Deployment | Vercel (frontend) + Render (backend, via `render.yaml` Blueprint) |

## 9. Project Structure

```
luma-jewels-ai/
├── src/                          # React/Vite frontend
│   ├── components/
│   │   ├── Concierge/LumaConcierge.jsx   # AI chat panel — the only real-time AI surface
│   │   ├── sections/                     # Hero, CollectionGrid, AIRecommendation, StyleQuiz, ...
│   │   └── ui/                           # Button, ProductCard, GlassCard, ...
│   ├── data/products.js         # Original static catalog (superseded by the backend for the live grid)
│   ├── lib/api.js               # Minimal fetch client for the backend (GET /products, POST /concierge/chat)
│   └── App.jsx                  # Wires sections together; fetches the live catalog on mount
├── backend/
│   ├── app/
│   │   ├── agents/               # orchestrator.py (the agent loop), state.py, system_prompt.py
│   │   ├── api/routes/           # health.py, products.py, concierge.py
│   │   ├── core/config.py        # centralized, env-based settings
│   │   ├── data/products.json    # canonical product catalog (source of truth)
│   │   ├── llm/                  # base.py (interface), fake_provider.py, gemini_provider.py, factory.py
│   │   ├── schemas/               # Product, Concierge request/response contracts
│   │   ├── services/product_service.py
│   │   └── tools/product_tools.py  # the 5 V1 tools the agent can call
│   ├── tests/                    # 119 tests — health, products, both providers, tools, agent, API, security
│   ├── requirements.txt
│   └── README.md                 # Full backend/agent architecture reference
├── render.yaml                   # Render Blueprint (backend deployment)
├── vercel.json                   # Vercel build config (frontend deployment)
├── package.json
└── README.md                     # This file
```

## 10. API Overview

Full endpoint-by-endpoint reference, filtering semantics, and schema notes live in [`backend/README.md`](backend/README.md). Summary:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness/readiness check (used by Render) |
| `GET` | `/products` | Full catalog, optionally filtered by `category`, `metal`, `gemstone`, `min_price`, `max_price` |
| `GET` | `/products/{id}` | A single product, or `404` |
| `POST` | `/concierge/chat` | Send one user message to Luma Concierge |

**`POST /concierge/chat`**

Request:
```json
{ "message": "Show me something under $5,000" }
```

Response (shape — actual content depends on the catalog and the model's reasoning that turn):
```json
{
  "message": "I found a few pieces under $5,000 — here's a diamond ring that fits.",
  "recommended_products": [
    { "id": 1, "name": "Astraea Diamond Ring", "category": "Rings", "price_value": 2450.0, "...": "..." }
  ],
  "tools_used": ["search_products"],
  "applied_filters": { "max_price": 5000.0 },
  "iterations": 1,
  "trace": [
    { "type": "activity", "label": "Understanding your request", "tool": null },
    { "type": "activity", "label": "Searching the LumaJewel catalog", "tool": "search_products" },
    { "type": "activity", "label": "Preparing your recommendation", "tool": null }
  ]
}
```

No internal prompt, provider name, or raw tool-call payload is ever included in a response.

## 11. Environment Variables

**Frontend** (Vercel project settings / `.env.local` for local dev):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API. Falls back to `http://localhost:8000` if unset. |

**Backend** (Render dashboard / `backend/.env` for local dev):

| Variable | Purpose | Default |
|---|---|---|
| `APP_ENV` | Environment name | `development` |
| `BACKEND_HOST` / `BACKEND_PORT` | Bind host/port | `0.0.0.0` / `8000` |
| `FRONTEND_ORIGIN` | Allowed CORS origin(s), comma-separated | `http://localhost:5173` |
| `LLM_PROVIDER` | `fake` or `gemini` | `fake` |
| `LLM_MODEL` | Gemini model id (only used when `LLM_PROVIDER=gemini`) | `gemini-flash-latest` |
| `LLM_API_KEY` | Real Gemini API key — **backend only** | *(empty)* |

🔒 **The Gemini API key is never exposed to the frontend.** Vite only inlines `VITE_*`-prefixed variables into the client bundle, so there is no code path by which `LLM_API_KEY` could leak into the browser even by accident. No `.env` file containing a real key is committed anywhere in this repository — only `.env.example` files with placeholder values are tracked.

## 12. Local Development

**Frontend:**
```bash
npm install
npm run dev
```
Runs at `http://localhost:5173`.

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows Git Bash; use .venv\Scripts\Activate.ps1 for PowerShell, or bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
Defaults to the deterministic `FakeLLMProvider` — **no API key needed** to run the full app, including the Concierge chat, locally. To try the real Gemini model, get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and set `LLM_PROVIDER=gemini` and `LLM_API_KEY=<your key>` in `backend/.env` (never commit this file).

## 13. Production Deployment

```
Browser → Vercel (frontend) → Render (backend) → Gemini / product catalog
```

- **Frontend → Vercel.** Auto-detected Vite project (`vercel.json`). Build command `npm run build`, output `dist/`. `VITE_API_BASE_URL` points at the Render backend.
- **Backend → Render.** Deployed from `render.yaml` (a Render Blueprint) as a standard Python web service — no database, no Docker. Start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`; health check `GET /health`.
- **Gemini API key** is set only in Render's environment variables (`sync: false` in `render.yaml`, so it's never written to the file or committed).
- The two services are wired together only by `VITE_API_BASE_URL` (frontend → backend) and `FRONTEND_ORIGIN` (backend's CORS allow-list). Neither service needs to know the other exists beyond those.

Full manual deployment walkthrough (Render Blueprint setup, environment variable prompts, closing the CORS loop) is in [`backend/README.md`](backend/README.md).

## 14. Testing

```bash
cd backend
pytest
```

**119 tests pass** (verified against this repository), covering: the health endpoint, the product catalog API and its filters, both LLM providers — `FakeLLMProvider` and `GeminiProvider` (the latter fully mocked against the real installed `google.genai.types` classes, so request/response shapes are validated without a network call), the 5 product tools, the agent orchestration loop, the `/concierge/chat` endpoint (including provider-failure injection via FastAPI dependency overrides), and security sanity checks (no key leakage into logs or responses).

A `conftest.py` safety net forces `LLM_PROVIDER=fake` for the entire test session regardless of what `backend/.env` contains, so the suite can never accidentally consume real Gemini quota. No test requires internet access, a real API key, or a database.

Frontend: `npm run lint` (ESLint) and `npm run build` (production Vite build) — no dedicated frontend test suite exists in this repository today.

## 15. Reliability & Error Handling

- **Transient Gemini `5xx` errors are retried.** `GeminiProvider` retries `errors.ServerError` (e.g. a transient 503 "high demand" response) up to 3 attempts with a 1.5s backoff — confirmed against the live API that identical requests succeed on a later attempt.
- **Quota/client errors are not retried.** `errors.ClientError` (4xx, including `429` quota-exceeded) fails immediately by design — retrying a quota error wastes more of the free-tier per-minute budget for no benefit.
- **No raw exceptions ever reach the client.** A global FastAPI exception handler converts any unhandled backend error into a clean `{"status": "error", "detail": "Internal server error"}` response; the real exception is logged server-side only.
- **The agent never fabricates.** Recommended products, prices, IDs, and inventory status all come only from validated tool output — the system prompt explicitly forbids inventing catalog facts or claiming stock status the catalog reports as unknown.
- **The frontend never surfaces raw backend errors.** Both the product grid and the Concierge chat catch `ApiError` and show a short, user-friendly message instead of a status code or stack trace.

## 16. Security Considerations

- The Gemini API key (`LLM_API_KEY`) lives only in backend environment variables — never hardcoded, never logged, never returned in any API response (enforced by `backend/tests/test_security.py`).
- The frontend never calls Gemini directly and never holds the key — Vite only inlines `VITE_*`-prefixed variables into the client bundle.
- CORS (`FRONTEND_ORIGIN`) restricts which origins may call the backend.
- All 5 Concierge tools are strictly **read-only** — there is no write/purchase/cart/order tool the model could call, so there is nothing destructive a prompt-injection attempt could trigger even in principle.
- The system prompt explicitly instructs the model to treat tool output as data (not instructions) and to ignore attempts to override or reveal its own instructions.
- No `.env` file containing real secrets is committed anywhere in this repository (verified) — only `.env.example` placeholders are tracked. The one exception is `.env.production` at the repo root, which is intentionally committed: it holds only the **public** Render backend URL for `VITE_API_BASE_URL`, which Vite always inlines into the client bundle regardless, so it carries no secret value.

## 17. Known Limitations

- **The live demo depends on third-party availability.** Recommendation quality and uptime depend on Gemini API availability and the free-tier daily quota; heavy testing sessions can exhaust it.
- **Render free-tier cold start.** The backend spins down after inactivity; the first request afterward can take 30–60 seconds while the instance wakes up.
- **No live inventory tracking.** Every product's stock status is unknown in the current catalog — `check_inventory` always reports `"status": "unknown"`, and the Concierge is instructed to say so plainly rather than guess.
- **No persistent conversation memory.** Each `/concierge/chat` call is a fresh, isolated turn — there is no memory of earlier messages across requests.
- **No cart, checkout, wishlist persistence, or authentication.** The wishlist toast is local UI feedback only; nothing is saved server-side. Concierge is strictly read-only by design.
- **Three homepage sections predate the backend integration and are not yet wired to it:** the category collection tiles, the "Recommended for You" showcase, and the Style Quiz's "Aura" profile all use static or client-side rule-based logic rather than the live catalog or Gemini. Only the main product grid (`GET /products`) and the Luma Concierge chat panel (`POST /concierge/chat`) call the real backend today — see [Roadmap](#18-future-roadmap).

## 18. Future Roadmap

- Wire the remaining static sections (collection tiles, "Recommended for You," Style Quiz) to the real catalog and/or the Concierge agent
- Add real inventory data so `check_inventory` can return a genuine in-stock/out-of-stock status
- Persistent conversation memory across Concierge turns
- Cart, checkout, and wishlist persistence with a real backend
- Authentication
- Additional LLM provider options (the abstraction already supports adding one more `app/llm/` file + one `factory.py` branch)

## 19. Screenshots / Demo

No screenshots are currently checked into this repository. The fastest way to see the real thing is the live demo above — open it, browse the product grid (fetched live from Render), and open **Luma Concierge** to see the real Gemini-backed tool-calling loop in action.

## 20. Author

**Prabhuji Mishra** — [github.com/javcod](https://github.com/javcod)

---

For the complete backend architecture, agent design rationale, product schema, filtering semantics, and full deployment walkthrough, see [`backend/README.md`](backend/README.md).
