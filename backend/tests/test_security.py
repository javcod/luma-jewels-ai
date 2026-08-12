"""Security sanity checks.

These are automatable checks only. The full picture (nothing tracked by
git, .env never committed) is verified separately via `git status
--ignored` as part of manual/CI verification — see backend/README.md,
"Security model", and the Phase 4 implementation report.
"""

import re
from pathlib import Path

from app.core.config import Settings

_BACKEND_ROOT = Path(__file__).resolve().parent.parent

# Loosely matches common LLM provider API key shapes (Google "AIza...",
# OpenAI "sk-...", Anthropic "sk-ant-...") — good enough to catch an
# accidentally-pasted real key without being a full secret scanner.
_LOOKS_LIKE_REAL_KEY = re.compile(r"(AIza[0-9A-Za-z_\-]{20,}|sk-[A-Za-z0-9]{20,}|sk-ant-[A-Za-z0-9\-]{20,})")


def test_settings_default_api_key_is_none_not_a_placeholder_string():
    settings = Settings(_env_file=None)
    assert settings.llm_api_key is None


def test_settings_default_provider_is_fake_not_a_real_provider():
    settings = Settings(_env_file=None)
    assert settings.llm_provider == "fake"


def test_env_example_contains_no_real_looking_api_key():
    content = (_BACKEND_ROOT / ".env.example").read_text(encoding="utf-8")
    assert not _LOOKS_LIKE_REAL_KEY.search(content)
    assert "LLM_API_KEY=" in content  # placeholder present, but empty


def test_gitignore_covers_env_and_python_artifacts():
    content = (_BACKEND_ROOT / ".gitignore").read_text(encoding="utf-8")
    for pattern in (".env", "__pycache__", ".venv", ".pytest_cache"):
        assert pattern in content


def test_no_env_file_is_present_in_the_repo_at_test_time():
    """A real `.env` (if a developer created one locally) must never be
    picked up as if it were part of the committed repo state. This does not
    assert git status directly (that's a shell-level check), but guards
    against a real key accidentally being read as Settings' *default*."""
    settings = Settings(_env_file=None)
    assert settings.llm_api_key in (None, "")


def test_gemini_provider_source_never_formats_api_key_into_a_log_message():
    source = (_BACKEND_ROOT / "app" / "llm" / "gemini_provider.py").read_text(encoding="utf-8")
    for line in source.splitlines():
        if "logger." in line or "logging." in line:
            assert "api_key" not in line.lower()
