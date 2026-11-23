"""Tests for the provider fallback chain and the factory that builds it."""

import pytest

from app.core.config import get_settings
from app.llm import fallback_provider
from app.llm.base import ChatMessage, LLMProvider, LLMResponse, ToolCall, ToolDefinition
from app.llm.fake_provider import FakeLLMProvider
from app.llm.fallback_provider import (
    DEMO_MODE_NOTICE,
    AllProvidersFailedError,
    FallbackProvider,
    reset_cooldowns,
)
from app.llm.factory import get_llm_provider
from app.llm.groq_provider import GroqProvider

MESSAGES = [ChatMessage(role="user", content="hi")]


class StubProvider(LLMProvider):
    def __init__(self, response=None, error=None):
        self.response = response or LLMResponse(message="stub answer")
        self.error = error
        self.calls = 0

    def generate(self, messages: list[ChatMessage], tools: list[ToolDefinition]) -> LLMResponse:
        self.calls += 1
        if self.error:
            raise self.error
        return self.response


@pytest.fixture(autouse=True)
def _clean_state():
    reset_cooldowns()
    get_settings.cache_clear()
    yield
    reset_cooldowns()
    get_settings.cache_clear()


def test_uses_first_provider_when_it_works():
    first, second = StubProvider(LLMResponse(message="first")), StubProvider(LLMResponse(message="second"))
    response = FallbackProvider([("groq", first), ("gemini", second)]).generate(MESSAGES, [])

    assert response.message == "first"
    assert second.calls == 0


def test_falls_back_when_first_provider_fails():
    first = StubProvider(error=RuntimeError("quota exceeded"))
    second = StubProvider(LLMResponse(message="second"))
    response = FallbackProvider([("groq", first), ("gemini", second)]).generate(MESSAGES, [])

    assert response.message == "second"
    assert first.calls == 1


def test_failed_provider_is_skipped_during_cooldown():
    first = StubProvider(error=RuntimeError("quota exceeded"))
    second = StubProvider(LLMResponse(message="second"))
    chain = FallbackProvider([("groq", first), ("gemini", second)])

    chain.generate(MESSAGES, [])
    chain.generate(MESSAGES, [])

    assert first.calls == 1
    assert second.calls == 2


def test_provider_is_retried_after_cooldown(monkeypatch):
    first = StubProvider(error=RuntimeError("quota exceeded"))
    second = StubProvider(LLMResponse(message="second"))
    chain = FallbackProvider([("groq", first), ("gemini", second)])
    chain.generate(MESSAGES, [])

    monkeypatch.setattr(fallback_provider, "_cooldown_until", {"groq": 0.0})
    chain.generate(MESSAGES, [])

    assert first.calls == 2


def test_demo_provider_answer_is_labelled():
    failing = StubProvider(error=RuntimeError("down"))
    demo = StubProvider(LLMResponse(message="Here are some rings."))
    response = FallbackProvider([("groq", failing), ("fake", demo)]).generate(MESSAGES, [])

    assert response.message == DEMO_MODE_NOTICE + "Here are some rings."


def test_demo_provider_tool_calls_are_not_changed():
    call = ToolCall(id="c1", name="search_products", arguments={})
    demo = StubProvider(LLMResponse(tool_calls=[call]))
    response = FallbackProvider([("groq", StubProvider(error=RuntimeError())), ("fake", demo)]).generate(
        MESSAGES, []
    )

    assert response.tool_calls == [call]
    assert response.message is None


def test_raises_when_all_providers_fail():
    chain = FallbackProvider([("groq", StubProvider(error=RuntimeError())), ("gemini", StubProvider(error=RuntimeError()))])
    with pytest.raises(AllProvidersFailedError):
        chain.generate(MESSAGES, [])


def test_factory_builds_chain_and_skips_unconfigured_providers(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "groq,gemini,fake")
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    monkeypatch.setenv("LLM_API_KEY", "")
    get_settings.cache_clear()

    provider = get_llm_provider()

    assert isinstance(provider, FallbackProvider)
    names = [name for name, _ in provider._providers]
    assert names == ["groq", "fake"]
    assert isinstance(provider._providers[0][1], GroqProvider)
    assert isinstance(provider._providers[1][1], FakeLLMProvider)


def test_factory_single_groq_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    get_settings.cache_clear()

    assert isinstance(get_llm_provider(), GroqProvider)


def test_factory_rejects_unknown_name_in_chain(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "groq,openai")
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    get_settings.cache_clear()

    with pytest.raises(NotImplementedError, match="openai"):
        get_llm_provider()
