"""Create the LLM provider selected by the LLM_PROVIDER setting.

Imports are inside each branch so the Gemini SDK is only loaded when needed.
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
