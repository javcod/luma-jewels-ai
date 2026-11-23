# Luma Jewels AI

[![CI](https://github.com/javcod/luma-jewels-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/javcod/luma-jewels-ai/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

A jewellery e-commerce app with an AI shopping assistant that only recommends products it has actually retrieved from the catalog. The assistant is a tool-calling agent: the LLM decides which catalog query to run, the backend executes it, and every product in the reply comes from validated tool output, never from the model's text.

**Live demo:** [luma-jewels-ai.vercel.app](https://luma-jewels-ai.vercel.app) | **API docs:** [Swagger UI](https://lumajewel-backend.onrender.com/docs)

> The backend runs on Render's free tier. The first request after a period of inactivity can take 30-60 seconds while it wakes up.

## Screenshots

| Home | Concierge | Wishlist |
| --- | --- | --- |
| ![Home page](docs/screenshots/home.png) | ![Luma Concierge](docs/screenshots/concierge.png) | ![Wishlist panel](docs/screenshots/wishlist.png) |

## Features

- **Luma Concierge**: chat assistant for product discovery ("rings under $5,000", "help me choose a gift"), with filtering by budget, metal, gemstone and category, plus side-by-side comparison
- **Grounded answers**: recommended products are assembled server-side from tool results, so the model cannot invent a product, price or stock status
- **Live catalog**: product grid served by the FastAPI backend, with loading and error states
- **Wishlist**: add and remove items, persisted in `localStorage`
- **Style Quiz**: a four-question, rule-based quiz that suggests a matching style (runs client-side, no LLM)

## Architecture

```
React (Vercel) --> FastAPI (Render) --> Agent orchestrator --> LLM provider chain (Groq -> Gemini -> rule-based)
                                               |
                                               v
                                        Product tools --> Catalog service --> products.json
```

**Request flow for `POST /concierge/chat`:**

1. The orchestrator sends the user message and 5 tool definitions to the LLM provider.
2. If the model requests a tool call, the orchestrator validates the arguments, runs the tool against the catalog and returns the result to the model.
3. This loop repeats until the model gives a final answer, capped at 3 iterations.
4. The response contains the model's message, the products returned by tools, and a short user-safe activity trace.

**Key design decisions:**

- **Provider abstraction.** The orchestrator depends on an `LLMProvider` interface with three implementations: `GroqProvider`, `GeminiProvider` and a deterministic `FakeLLMProvider` used in tests and local development, so the full app runs without an API key.
- **Fallback chain.** In production, `LLM_PROVIDER=groq,gemini,fake` wraps the providers in a `FallbackProvider`. If one fails (for example, its free quota runs out) the next is tried, and a failed provider is skipped for 60 seconds. If only the rule-based provider is left, the reply says so. Adding this did not require changing the orchestrator.
- **Rate limiting.** The chat endpoint allows 20 requests per IP per hour to protect the free API quotas.
- **Plain Python loop instead of a framework.** With one decision point and five read-only tools, an explicit loop is easier to read and test than LangChain or LangGraph.
- **Read-only tools.** `search_products`, `filter_products`, `get_product`, `compare_products` and `check_inventory` cannot modify anything, which limits what a prompt-injection attempt could do.
- **Error handling.** Transient Gemini 5xx errors are retried (3 attempts, 1.5s backoff); 4xx and quota errors fail immediately. Clients never see raw exceptions.

## Tech Stack

| Layer    | Technology                                           |
| -------- | ---------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS v4, Motion              |
| Backend  | Python 3.13, FastAPI, Pydantic v2                    |
| AI       | Groq (OpenAI-compatible API), Google Gemini          |
| Testing  | Pytest + httpx, Vitest + React Testing Library       |
| CI/CD    | GitHub Actions, Vercel (frontend), Render (backend)  |

## Running Locally

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

It uses the fake LLM provider by default. To use a real model, copy `.env.example` to `.env`, set `LLM_PROVIDER` (for example `groq,gemini,fake`) and add `GROQ_API_KEY` and/or `LLM_API_KEY`.

**Frontend**

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173` and calls the backend at `VITE_API_BASE_URL` (default `http://localhost:8000`).

## Testing

```bash
cd backend && pytest      # 152 tests
npm test                  # 18 tests
```

The backend suite covers the API endpoints, catalog filters, all LLM providers and the fallback chain (external APIs are mocked), rate limiting, the tools, the agent loop and security checks such as making sure the API key never appears in logs or responses. Tests always run against the fake provider, so they need no network access or API key. Both suites run in GitHub Actions on every push.

## Known Limitations

- Runs on free API tiers. When both Groq and Gemini quotas are used up, the assistant falls back to rule-based answers.
- No conversation memory: each chat request is handled independently.
- Inventory status is not tracked, so `check_inventory` reports "unknown" and the assistant says so.
- The wishlist is stored per browser only; there are no accounts, cart or checkout.
- The collection tiles, "Recommended for You" section and Style Quiz use static data rather than the live catalog.

## Roadmap

- Connect the remaining static sections to the catalog API
- Add conversation memory across chat turns
- Add accounts with server-side wishlist storage

More detail on the backend, agent design and deployment is in [`backend/README.md`](backend/README.md).

## License

[MIT](LICENSE)
