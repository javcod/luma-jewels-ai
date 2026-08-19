# LumaJewel AI — Backend

Python/FastAPI backend for LumaJewel AI. This is the **foundation** phase
only: a clean, modular FastAPI application with a health endpoint and
centralized configuration.

It does **not** yet contain a database or authentication. Those are
separate, later phases.

As of Phase 2, it hosts the **canonical product catalog** — a
deterministic, read-only product API (see "Canonical Product Catalog"
below). As of Phase 3, it also hosts **Luma Concierge**, a tool-using agent
that answers jewelry shopping questions by calling the same deterministic
catalog — never by inventing an answer. As of Phase 4, Concierge has all
five V1 tools and a real LLM provider (Gemini) alongside the deterministic
fake one (see "Luma Concierge — Agent Architecture" below).

## What this is

A minimal, production-oriented FastAPI service structured so future work
(product APIs, the Concierge agent, LLM provider abstraction, tests) has an
obvious place to go without needing to restructure the project.

```
backend/
├── app/
│   ├── main.py                # FastAPI app factory: middleware, error handling, routers
│   ├── api/
│   │   ├── router.py           # aggregates all route modules
│   │   └── routes/
│   │       ├── health.py       # GET /health
│   │       ├── products.py     # GET /products, GET /products/{id}
│   │       └── concierge.py    # POST /concierge/chat
│   ├── core/
│   │   └── config.py           # centralized, env-based settings
│   ├── schemas/
│   │   ├── product.py          # canonical Product pydantic schema
│   │   └── concierge.py        # /concierge/chat request/response contract
│   ├── services/
│   │   └── product_service.py  # loads + queries the canonical catalog
│   ├── data/
│   │   └── products.json       # the canonical product catalog (source of truth)
│   ├── tools/
│   │   └── product_tools.py    # the 5 V1 tools — all delegate to product_service
│   ├── llm/
│   │   ├── base.py              # provider-agnostic LLMProvider interface
│   │   ├── fake_provider.py     # deterministic stand-in (default; used in tests)
│   │   ├── gemini_provider.py   # real Gemini implementation (google-genai SDK)
│   │   └── factory.py           # selects a provider from configuration
│   └── agents/
│       ├── state.py             # ConciergeState, TraceEvent
│       ├── system_prompt.py     # the agent's behavior rules
│       └── orchestrator.py      # the explicit agent loop
├── tests/
│   ├── test_health.py
│   ├── test_products.py
│   ├── test_llm_provider.py
│   ├── test_gemini_provider.py
│   ├── test_tools.py
│   ├── test_agent.py
│   ├── test_concierge_api.py
│   └── test_security.py
├── requirements.txt
├── .env.example
├── pytest.ini
└── .gitignore
```

## Prerequisites

- Python 3.11+ (developed and verified against Python 3.13)

## 1. Create a virtual environment

From the `backend/` directory:

```bash
python -m venv .venv
```

Activate it:

```bash
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Windows (Git Bash)
source .venv/Scripts/activate

# macOS/Linux
source .venv/bin/activate
```

## 2. Install dependencies

```bash
pip install -r requirements.txt
```

## 3. Configure environment variables

```bash
cp .env.example .env
```

The defaults in `.env.example` work out of the box for local development
against the Vite dev server (`http://localhost:5173`), using the
deterministic fake LLM provider — **no API key is required unless you
explicitly switch to `LLM_PROVIDER=gemini`.**

| Variable | Purpose | Default |
|---|---|---|
| `APP_ENV` | Environment name (`development`, etc.) | `development` |
| `BACKEND_HOST` | Host the server binds to | `0.0.0.0` |
| `BACKEND_PORT` | Port the server binds to | `8000` |
| `FRONTEND_ORIGIN` | Allowed CORS origin(s) for the frontend, comma-separated | `http://localhost:5173` |
| `LLM_PROVIDER` | `fake` or `gemini` | `fake` |
| `LLM_MODEL` | Gemini model id (only used when `LLM_PROVIDER=gemini`) | `gemini-flash-latest` |
| `LLM_API_KEY` | Real Gemini API key (only required when `LLM_PROVIDER=gemini`) | *(empty — never commit a real value)* |

To try the real provider locally: get a key at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey), set
`LLM_PROVIDER=gemini` and `LLM_API_KEY=<your key>` in your local `.env`
(never in `.env.example`, never committed), then restart the server.

## 4. Start the server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at **http://localhost:8000**.
Interactive docs (Swagger UI) are available at **http://localhost:8000/docs**.

## 5. Health endpoint

```
GET /health
```

Response:

```json
{
  "status": "ok",
  "service": "lumajewel-backend",
  "environment": "development"
}
```

Use this to verify the backend is running, for frontend connectivity checks,
and later as a deployment health check.

## 6. Run tests

```bash
pytest
```

This runs the full suite: health, the product catalog API, both LLM
providers (fake and Gemini — the latter fully mocked), the 5 product
tools, the agent orchestration loop, the `/concierge/chat` endpoint, and
security sanity checks. **119 tests, no internet, no real API key, no
database required.** See "Luma Concierge — Agent Architecture" → "Testing
strategy" below for how the Gemini adapter is tested without a live call.
A `conftest.py` safety net forces `LLM_PROVIDER=fake` for the whole test
session regardless of what `backend/.env` contains, so the suite can never
accidentally consume real API quota.

## Deployment (Render)

The backend deploys as a standard Python web service — no database, no
Docker, no extra infrastructure. A `render.yaml` Blueprint at the repo root
defines the service; see the repo root README for the full manual
deployment walkthrough (GitHub → Render → Vercel → environment variables).

Quick reference:

- **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT` —
  Render injects `$PORT`; nothing in the app needs to know its own port
  ahead of time.
- **Health check:** `GET /health` — already dependency-free (see above),
  used as-is for Render's health check.
- **Required environment variables:** `FRONTEND_ORIGIN` (your deployed
  Vercel URL — comma-separate with a local dev origin if you want both to
  keep working), `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`. See
  `.env.example` for the full list and current defaults.
- **The Gemini API key belongs only here** — in the backend's Render
  environment variables. It must never be set as a Vercel/frontend
  environment variable, and Vite only exposes `VITE_*`-prefixed variables
  to the browser bundle in the first place, so there is no code path by
  which it could leak into the frontend even by accident.

## Canonical Product Catalog

`app/data/products.json` is the **single source of truth** for product data
on the backend. It was migrated by hand from the frontend's
`src/data/products.js` (the frontend's static catalog remains untouched and
is still what the current UI renders from — see "Relationship to the
frontend" below).

This catalog — and the deterministic `product_service` that reads it — is
what the Concierge agent's 5 tools (`search_products`, `filter_products`,
`get_product`, `compare_products`, `check_inventory`) call into directly
(see "Luma Concierge — Agent Architecture" below). Establishing it before
any agent existed meant those tools could be built against a stable,
already-tested data contract.

### Product schema

| Field | Type | Notes |
|---|---|---|
| `id` | int | Matches the original numeric id from `products.js` |
| `name` | str | |
| `category` | str | `Rings` / `Earrings` / `Necklaces` / `Bracelets` |
| `price_value` | float | Numeric price, parsed from the original `"$2,450"` string |
| `currency` | str | Always `"USD"` — **assumed** from the `$` symbol; never explicitly stated anywhere in the source data |
| `price_display` | str | Original presentation string preserved verbatim, e.g. `"$2,450"` |
| `material` | str | Original free-text material description, preserved verbatim |
| `metal` | str \| null | Manually derived from `material` (e.g. `"Platinum"`, `"18K Gold"`) |
| `gemstone` | str \| null | Manually derived from `material` (e.g. `"Diamond"`); `null` where no gemstone is mentioned |
| `image` | str | Original image URL, preserved verbatim |
| `description` | str \| null | **Not present in the source data.** Anticipated by an existing (unused) fallback in `src/components/ProductModal.jsx`. `null` for every product — not fabricated |
| `style_tags` | list[str] \| null | **Not present in the source data.** `null` for every product |
| `occasion_tags` | list[str] \| null | **Not present in the source data.** `null` for every product |
| `in_stock` | bool \| null | **Unknown for every product.** `null`, deliberately not defaulted to `true` — no filter or future agent tool should assume unknown stock means available |

**Deliberately excluded:** `match` and `reason`, which exist as static
fields in `src/data/products.js` today. These describe how well a product
fits *a specific request*, not a fact about the product itself — they must
be computed per-conversation by the future agent, not stored on the
catalog. See the Codebase Intelligence Report (Architecture Decision #8)
and "Data Quality Issues" below for the full rationale.

### API endpoints

**`GET /products`** — returns the full catalog, optionally filtered.

```
GET /products
GET /products?category=Rings
GET /products?metal=Platinum
GET /products?gemstone=Diamond
GET /products?min_price=1000&max_price=3000
GET /products?category=Rings&gemstone=Diamond
```

Response:

```json
{
  "count": 2,
  "items": [
    { "id": 1, "name": "Astraea Diamond Ring", "category": "Rings", "price_value": 2450.0, "...": "..." },
    { "id": 5, "name": "Celeste Solitaire", "category": "Rings", "price_value": 5200.0, "...": "..." }
  ]
}
```

**`GET /products/{id}`** — returns exactly one product, or `404` if the id
doesn't exist:

```
GET /products/1        → 200, the product
GET /products/9999     → 404 {"detail": "Product 9999 not found"}
```

### Filtering behavior

- `category`, `metal`, `gemstone` — exact match, case-insensitive. Not
  fuzzy/partial matching — kept simple and predictable since this is the
  same contract a future agent tool will rely on.
- `min_price`, `max_price` — inclusive bounds on `price_value`.
- Filters combine with AND. No filters means the full catalog.
- **`in_stock` is intentionally not a filter yet** — every product's
  `in_stock` value is `null` (unknown), so filtering on it would produce
  deterministic but meaningless results. It will become a real filter once
  actual inventory data exists.
- All filtering is a pure, deterministic, in-memory computation over the
  loaded catalog — no LLM, no randomness, no network calls. The same query
  against the same catalog always returns the same result.

### How this supports agent tools

The `product_service` module (not the HTTP layer) is what agent tools call
directly — e.g. `filter_products` calls `product_service.get_all_products(...)`
in-process, never making an HTTP request to `/products` itself. The
`/products` HTTP endpoints exist independently so the API contract can be
verified and consumed by the frontend whenever that migration happens.

## Luma Concierge — Agent Architecture

### Why it exists

The Codebase Intelligence Report found that every "AI" surface in the
original frontend (match scores, the style quiz's "Aura" profile, the "AI
Curation Note") was static or shallow rule-based text — none of it called
a real reasoning system or the real catalog. Luma Concierge is the first
component that actually does what the UI has always claimed: understand a
free-text request, decide what catalog information is needed, retrieve it
for real, and answer only from what was retrieved.

### Architecture

```
User
  ▼
POST /concierge/chat  (app/api/routes/concierge.py)
        │  HTTP concerns only
        ▼
run_concierge()  (app/agents/orchestrator.py)
        │
        │   START
        │     │
        │     ▼
        │  agent_reasoning  ── calls LLMProvider.generate(messages, tools)
        │     │                        (FakeLLMProvider or GeminiProvider —
        │     │                         the orchestrator never knows which)
        │     ▼
        │  tool_required?
        │     │no ──────────────► final_response ──► END
        │     │yes
        │     ▼
        │  validate + execute_tool  ── looks up app.tools.TOOL_EXECUTORS
        │     │                         (unknown tool / bad args / tool
        │     │                          exception → structured error,
        │     │                          never raises out of the loop)
        │     ▼
        │  record trace event + append tool result
        │     │
        │     ▼
        │  agent_reasoning  (loop, capped at MAX_TOOL_ITERATIONS = 3)
        │
        ▼
app.tools.product_tools  (5 V1 tools)
        │  delegates only — no catalog logic here
        ▼
app.services.product_service  (same deterministic service GET /products uses)
        ▼
app/data/products.json  (the one canonical catalog — never duplicated)
        ▲
        │  (safe, real Product results flow back up)
        ▼
Safe final response + execution trace  ──►  User
```

The LLM layer (`app.llm`) never touches `product_service` or
`products.json` directly — it only ever sees `ToolDefinition`s and
`ToolCall`/tool-result messages. The agent (`app.agents`) never talks to a
specific LLM vendor — it only depends on the `LLMProvider` interface, so
`FakeLLMProvider` and `GeminiProvider` are interchangeable from the
orchestrator's point of view.

**Why an explicit loop instead of LangGraph:** the graph has one decision
point and a small, fixed tool set. An explicit Python loop expresses
exactly the state machine above in one readable file with zero added
dependencies. LangGraph remains a reasonable choice once the graph grows
real branches (parallel tools, multi-agent) — flagged as a decision for
review, not adopted here just because it's the eventual target stack.

### Agent state (`app/agents/state.py`)

`ConciergeState` is scoped to a single request/response cycle — no
persistent memory, no session store:

- `user_message`, `messages` (full conversation incl. tool turns)
- `tool_calls`, `tool_results` (a full trace of what was executed)
- `applied_filters` (the exact search/filter args used, if any — transparent grounding, not a fabricated score)
- `recommended_products` — real, validated `Product` records, populated **only** from tool output, never from LLM text
- `trace` — the user-safe activity log (see "Safe execution trace" below)
- `final_response`, `iterations`

### Tools (`app/tools/product_tools.py`) — the 5 V1 tools

| Tool | Delegates to | Behavior on missing/invalid input |
|---|---|---|
| `search_products` | `product_service.get_all_products(...)` | No matches → `{"count": 0, "items": []}`, not an error |
| `filter_products` | the same `search_products` executor (hard-constraint framing only; identical query, no duplicated logic) | same as above |
| `get_product` | `product_service.get_product_by_id(...)` | Missing/invalid/unknown id → `{"found": false, "error": "..."}`, never raises |
| `compare_products` | `product_service.get_product_by_id(...)` per id | Invalid/missing ids go into a separate `not_found` list rather than failing the whole comparison; returns structured facts only (name, price, category, material, metal, gemstone) — the LLM explains the comparison afterward, the tool never generates prose |
| `check_inventory` | `product_service.get_product_by_id(...)` | Every product's `in_stock` is currently `null` → always returns `{"status": "unknown", ...}`. **Never** invents `in_stock`/`out_of_stock` from missing data — see "Inventory limitation" below |

All filter-capable tools support exactly the filters the `/products` API
already supports (`category`, `metal`, `gemstone`, `min_price`,
`max_price`) — no new filtering logic was introduced anywhere.

### LLM provider abstraction (`app/llm/`)

`LLMProvider` (`base.py`) is the whole contract: given the conversation and
available tools, return either a final message or tool call(s) to make.
Two implementations exist:

- **`FakeLLMProvider`** (`fake_provider.py`) — deterministic, rule-based
  (keyword/regex matching on the user's text), no network access or API
  key, costs nothing to run. Default provider; what the entire test suite
  runs against.
- **`GeminiProvider`** (`gemini_provider.py`) — real Gemini model via the
  official [`google-genai`](https://pypi.org/project/google-genai/) SDK.
  All SDK-specific code (`google.genai.types.*`, `google.genai.errors.*`)
  is isolated to this one file — nothing else in the codebase imports it,
  and `app/llm/factory.py` imports it lazily so running with
  `LLM_PROVIDER=fake` never even requires the package to be importable.
  Converts our `ChatMessage`/`ToolDefinition`/`ToolCall`/`LLMResponse`
  to/from Gemini's `Content`/`Tool`/`FunctionCall` shapes at the boundary.
  Any SDK/network failure (missing key, timeout, malformed response) is
  wrapped as `GeminiProviderError` — the orchestrator catches this exactly
  like any other provider failure and turns it into a graceful message,
  never a raw stack trace.

Selecting a provider is one `factory.py` branch on `settings.llm_provider`
— nothing in `app.agents` or `app.tools` changes based on which provider is
active. Adding OpenAI/Anthropic later means adding one more branch and one
more file in `app/llm/`.

### Real model tool selection (Part 2)

With `LLM_PROVIDER=gemini`, tool selection is genuinely made by the model —
`GeminiProvider` sends the 5 tool definitions to Gemini via
`GenerateContentConfig(tools=...)` and reads back whichever
`response.function_calls` the model actually decided to make. No
regex/keyword matching is used on this path. `FakeLLMProvider`'s
keyword/regex heuristics exist only as its own deterministic stand-in for
tests and key-less local development — see its module docstring for why
that's not the same thing as the orchestrator faking tool calls.

### Safe execution trace

Every `/concierge/chat` response includes `trace`: a list of high-level,
user-safe activity events (`{"type": "activity", "label": "...", "tool":
"..."}`), e.g. `"Understanding your request"` →
`"Searching the LumaJewel catalog"` → `"Preparing your recommendation"`.
The trace **never** contains the system prompt, model reasoning text, raw
tool-call JSON, or any provider-specific detail — it's built entirely by
`app.agents.orchestrator` from its own control flow, not from anything the
LLM said, so there is no path for hidden chain-of-thought to leak into it.

### API endpoint

**`POST /concierge/chat`**

Request:
```json
{ "message": "I'm looking for an elegant gold ring under $500" }
```

Response:
```json
{
  "message": "I couldn't find any pieces in the current catalog matching that request. Would you like to try a different budget, metal, or category?",
  "recommended_products": [],
  "tools_used": ["search_products"],
  "applied_filters": { "category": "Rings", "max_price": 500.0 },
  "iterations": 1,
  "trace": [
    { "type": "activity", "label": "Understanding your request", "tool": null },
    { "type": "activity", "label": "Searching the LumaJewel catalog", "tool": "search_products" },
    { "type": "activity", "label": "Preparing your recommendation", "tool": null }
  ]
}
```

`recommended_products` are always real `Product` records from the
catalog — the model can never cause a product to appear that a tool didn't
actually return, because `_update_recommendations` in the orchestrator
only ever builds this list from validated tool output, never from LLM
text. No internal prompt, provider name, or raw tool-call payload is ever
exposed in the response.

### Inventory limitation (explicit)

**Live inventory is not implemented in V1.** Every product's `in_stock` is
`null` in the canonical catalog — there is no real stock-tracking system
anywhere in this project. `check_inventory` always reports
`"status": "unknown"` today, and the system prompt explicitly forbids the
agent from claiming a product is in or out of stock under these
conditions. This is a deliberate, honest limitation, not a bug to be
silently worked around by defaulting to `true`.

### Security model

- The LLM API key (`LLM_API_KEY`) lives only in environment variables —
  never hardcoded, never logged (see `tests/test_security.py`), never
  returned in any API response.
- `.env` is gitignored and was never committed; only `.env.example` (no
  real values) is tracked.
- All 5 V1 tools are **read-only** — there is no write/purchase/cart/order
  tool for a model to call, by construction, so there's nothing destructive
  a prompt-injection attempt could trigger even in principle.
- The system prompt explicitly instructs the model to treat tool output as
  data (not instructions) and to ignore attempts to override its
  instructions or reveal them — see `app/agents/system_prompt.py`, rules
  13–15.
- Any provider/tool/network failure is caught and converted to a clean
  error (`app.main`'s global exception handler, or the orchestrator's own
  try/except) — a raw exception message or stack trace is never sent in an
  HTTP response body, only logged server-side for debugging.

### Testing strategy

`test_llm_provider.py` (FakeLLMProvider), `test_gemini_provider.py`
(GeminiProvider, entirely against a mocked `google.genai.Client` —
request/response conversion is verified against the real installed
`google.genai.types` classes, so shapes are validated for real, just
without a network call), `test_tools.py`, `test_agent.py`,
`test_concierge_api.py`, and `test_security.py`. `POST /concierge/chat`
uses FastAPI's dependency injection for the provider specifically so tests
can override it (`app.dependency_overrides[get_llm_provider]`) with a
failing/misbehaving provider. **No test requires internet, a real API key,
or a database.**

### Current limitations

- **`FakeLLMProvider` is not a substitute for real language understanding**
  — its keyword/regex matching won't parse arbitrary open-ended phrasing
  the way Gemini would. It exists for deterministic tests and key-less dev.
- **No real inventory** (see above).
- **No persistent user memory** — each `/concierge/chat` call is a fresh,
  isolated turn; there is no conversation history across requests. A
  follow-up like "do you have *this* in stock" (referring to something
  discussed in a prior message) cannot be resolved — the agent will ask
  which product, rather than guess.
- **No checkout, cart, wishlist, or authentication** — Concierge is
  strictly read-only, matching the catalog's own read-only design.
- **No numeric "match score" in responses** — a fabricated relevance
  percentage was deliberately not added; `applied_filters` and the
  natural-language `message` are the only grounding for a recommendation.
- **Gemini's free-tier daily quota is easily exhausted** by a thorough
  testing session (20 requests/day per model on the free tier) — real
  end-to-end connectivity, tool-calling, and grounding have been
  live-verified against the real API (see the Phase 6A report), but budget
  real-Gemini calls carefully; automated tests never make one (see above).

## Relationship to the frontend

This backend is intentionally independent of the React/Vite frontend — it
does not import from or write into `src/`. The backend catalog in
`app/data/products.json` is a separate, hand-migrated copy of the original
`src/data/products.js` data.

**The frontend now calls this backend directly** for two things: the main
product grid (`App.jsx` fetches `GET /products` on mount via `src/lib/api.js`)
and Luma Concierge (`POST /concierge/chat`, from
`src/components/Concierge/LumaConcierge.jsx`). `src/data/products.js` is no
longer imported anywhere in the frontend — it is unused, kept only as the
historical source the backend catalog was migrated from.

Three other homepage sections — the category collection tiles
(`CollectionGrid.jsx`), the "Recommended for You" showcase
(`AIRecommendation.jsx`), and the Style Quiz's "Aura" profile
(`StyleQuiz.jsx`) — still use static or client-side rule-based data and are
**not yet wired** to this backend. See the root `README.md`'s "Known
Limitations" section.

## Not included yet

- OpenAI/Anthropic providers — only `FakeLLMProvider` and `GeminiProvider` exist
- LangGraph — the agent loop is explicit Python (see rationale above)
- Live inventory data — `check_inventory` always reports `"unknown"`
- Database or persistence
- Authentication
- Cart/wishlist/order functionality (no write tools exist at all)
- Persistent conversation memory across requests
- Multi-agent architecture
- Wiring the collection tiles, "Recommended for You," and Style Quiz
  homepage sections to this backend (the product grid and Concierge chat
  already are — see "Relationship to the frontend" above)
