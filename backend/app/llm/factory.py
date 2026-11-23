"""Create the LLM provider selected by the LLM_PROVIDER setting.

LLM_PROVIDER can be one name ("fake", "gemini", "groq") or a comma-separated
fallback chain such as "groq,gemini,fake". Imports are inside each branch so
an SDK is only loaded when its provider is used.
"""

import logging

from app.core.config import Settings, get_settings
from app.llm.base import LLMProvider

logger = logging.getLogger("lumajewel.llm.factory")

_KNOWN_PROVIDERS = ("fake", "gemini", "groq")


def get_llm_provider() -> LLMProvider:
    settings = get_settings()
    names = [name.strip().lower() for name in settings.llm_provider.split(",") if name.strip()]

    for name in names:
        if name not in _KNOWN_PROVIDERS:
            raise NotImplementedError(
                f"LLM provider '{name}' is not implemented. Available providers: {', '.join(_KNOWN_PROVIDERS)}."
            )

    if len(names) == 1:
        return _build(names[0], settings)

    providers = []
    for name in names:
        try:
            providers.append((name, _build(name, settings)))
        except Exception:
            # A provider without its API key is skipped instead of breaking the chain
            logger.warning("Skipping LLM provider '%s' (not configured)", name, exc_info=True)

    from app.llm.fallback_provider import FallbackProvider

    return FallbackProvider(providers)


def _build(name: str, settings: Settings) -> LLMProvider:
    if name == "fake":
        from app.llm.fake_provider import FakeLLMProvider

        return FakeLLMProvider()

    if name == "gemini":
        from app.llm.gemini_provider import GeminiProvider

        return GeminiProvider(api_key=settings.llm_api_key, model=settings.llm_model)

    from app.llm.groq_provider import GroqProvider

    return GroqProvider(api_key=settings.groq_api_key, model=settings.groq_model)
