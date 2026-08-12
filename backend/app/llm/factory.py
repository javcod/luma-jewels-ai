"""Selects and constructs the configured LLM provider.

This is the single place that reads `settings.llm_provider` — nothing else
in the codebase should branch on provider name. Provider-specific modules
are imported lazily (inside each branch) so that, e.g., running with
`LLM_PROVIDER=fake` never requires the `google-genai` package to even be
importable, and vice versa — the two providers are fully decoupled.
"""

from app.core.config import get_settings
from app.llm.base import LLMProvider


def get_llm_provider() -> LLMProvider:
    settings = get_settings()

    if settings.llm_provider == "fake":
        from app.llm.fake_provider import FakeLLMProvider

        return FakeLLMProvider()

    if settings.llm_provider == "gemini":
        from app.llm.gemini_provider import GeminiProvider

        return GeminiProvider(api_key=settings.llm_api_key, model=settings.llm_model)

    raise NotImplementedError(
        f"LLM provider '{settings.llm_provider}' is not implemented yet. "
        "Available providers: 'fake', 'gemini'. See backend/README.md."
    )
