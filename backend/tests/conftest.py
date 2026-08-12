"""Test-session safety net.

Forces the entire test suite to use the deterministic FakeLLMProvider and
never a real provider or API key — regardless of what a developer's local
`backend/.env` file happens to contain.

Why this exists: without it, a developer who left `LLM_PROVIDER=gemini`
set in their local `.env` (e.g. right after running a manual live smoke
test) would have `pytest` silently make real network calls against the
real Gemini API instead of the fake provider, which would violate the
guarantee — stated everywhere in this project's tests and README — that
the suite never needs internet, a real API key, or incurs cost/quota
usage to run. This happened once during Phase 4.1's live verification
(a leftover `.env` with `LLM_PROVIDER=gemini` caused several tests to hit
the real API and consume free-tier quota) — this file makes it structurally
impossible to happen again.

Env vars take precedence over `.env` file values in pydantic-settings'
default precedence order, so setting them here reliably overrides
whatever is on disk. This module runs once, at collection time, before any
test executes and before `get_settings()` is called anywhere.
"""

import os

from app.core.config import get_settings

os.environ["LLM_PROVIDER"] = "fake"
os.environ.pop("LLM_API_KEY", None)
os.environ.pop("LLM_MODEL", None)
get_settings.cache_clear()
