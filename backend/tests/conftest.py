"""Force the test suite to use the fake LLM provider.

Environment variables override values from a local .env file, so tests
never call the real Gemini API even if a developer's .env enables it.
"""

import os

from app.core.config import get_settings

os.environ["LLM_PROVIDER"] = "fake"
os.environ.pop("LLM_API_KEY", None)
os.environ.pop("LLM_MODEL", None)
get_settings.cache_clear()
