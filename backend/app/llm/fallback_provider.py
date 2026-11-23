"""Tries several LLM providers in order until one succeeds.

A provider that fails is skipped for COOLDOWN_SECONDS so later requests do
not wait on a provider whose quota is already used up. If the last provider
in the chain is the rule-based one, its answers are labelled as such.
"""

import logging
import time

from app.llm.base import ChatMessage, LLMProvider, LLMResponse, ToolDefinition

logger = logging.getLogger("lumajewel.llm.fallback")

COOLDOWN_SECONDS = 60.0
DEMO_MODE_NOTICE = "Live AI is busy right now, so this answer uses rule-based matching. "

# Provider name -> time until which it is skipped. Shared across requests.
_cooldown_until: dict[str, float] = {}


class AllProvidersFailedError(Exception):
    """Raised when every provider in the chain failed."""


class FallbackProvider(LLMProvider):
    def __init__(self, providers: list[tuple[str, LLMProvider]], demo_provider_name: str = "fake"):
        if not providers:
            raise ValueError("FallbackProvider needs at least one provider")
        self._providers = providers
        self._demo_provider_name = demo_provider_name

    def generate(self, messages: list[ChatMessage], tools: list[ToolDefinition]) -> LLMResponse:
        now = time.monotonic()
        available = [(name, p) for name, p in self._providers if _cooldown_until.get(name, 0) <= now]
        # If everything is cooling down, try the whole chain again
        candidates = available or self._providers

        for name, provider in candidates:
            try:
                response = provider.generate(messages, tools)
            except Exception:
                logger.warning("Provider '%s' failed; trying the next one", name, exc_info=True)
                _cooldown_until[name] = time.monotonic() + COOLDOWN_SECONDS
                continue

            _cooldown_until.pop(name, None)
            if name == self._demo_provider_name and len(self._providers) > 1 and response.message:
                response = LLMResponse(message=DEMO_MODE_NOTICE + response.message)
            return response

        raise AllProvidersFailedError("All LLM providers failed")


def reset_cooldowns() -> None:
    _cooldown_until.clear()
