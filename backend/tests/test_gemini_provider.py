"""Tests for the Gemini provider adapter (app.llm.gemini_provider).

No network access and no real API key are required or used: the
`google.genai.Client` boundary is mocked in every test. Request/response
conversion is verified against the real `google.genai.types` classes
(installed as a dependency), so the tests validate real SDK shapes rather
than a hand-rolled stand-in.
"""

from unittest.mock import MagicMock, patch

import pytest
from google.genai import errors, types

from app.core.config import get_settings
from app.llm.base import ChatMessage, ToolDefinition
from app.llm.fake_provider import FakeLLMProvider
from app.llm.gemini_provider import (
    GeminiProvider,
    GeminiProviderError,
    _to_gemini_contents,
    _to_gemini_tool,
)
from app.llm.factory import get_llm_provider

SEARCH_TOOL = ToolDefinition(
    name="search_products",
    description="Search the catalog",
    parameters={"type": "object", "properties": {"category": {"type": "string"}}, "required": []},
)


def _mock_response(text: str = None, function_calls: list = None) -> MagicMock:
    response = MagicMock()
    response.text = text
    response.function_calls = function_calls or []
    return response


# --- Provider configuration -----------------------------------------------


def test_missing_api_key_raises_configuration_error():
    with pytest.raises(GeminiProviderError, match="LLM_API_KEY"):
        GeminiProvider(api_key=None, model="gemini-2.5-flash")


def test_provided_client_is_used_without_requiring_api_key():
    mock_client = MagicMock()
    provider = GeminiProvider(api_key=None, model="gemini-2.5-flash", client=mock_client)
    assert provider._client is mock_client


def test_default_model_used_when_model_is_blank():
    mock_client = MagicMock()
    provider = GeminiProvider(api_key=None, model="", client=mock_client)
    assert provider._model == "gemini-2.5-flash"


# --- Request construction --------------------------------------------------


def test_system_message_becomes_system_instruction_not_a_content_turn():
    system_instruction, contents = _to_gemini_contents(
        [ChatMessage(role="system", content="You are Luma Concierge."), ChatMessage(role="user", content="hi")]
    )
    assert system_instruction == "You are Luma Concierge."
    assert len(contents) == 1
    assert contents[0].role == "user"


def test_user_and_assistant_roles_map_to_gemini_roles():
    _, contents = _to_gemini_contents(
        [
            ChatMessage(role="user", content="show me rings"),
            ChatMessage(role="assistant", content="Sure, one moment."),
        ]
    )
    assert contents[0].role == "user"
    assert contents[0].parts[0].text == "show me rings"
    assert contents[1].role == "model"
    assert contents[1].parts[0].text == "Sure, one moment."


def test_tool_message_becomes_function_response_part():
    _, contents = _to_gemini_contents(
        [ChatMessage(role="tool", name="get_product", tool_call_id="call_1", content='{"found": true, "item": {}}')]
    )
    part = contents[0].parts[0]
    assert contents[0].role == "user"
    assert part.function_response.name == "get_product"
    assert part.function_response.response == {"found": True, "item": {}}


def test_tool_conversion_produces_real_gemini_tool_with_function_declarations():
    gemini_tool = _to_gemini_tool([SEARCH_TOOL])
    assert isinstance(gemini_tool, types.Tool)
    declaration = gemini_tool.function_declarations[0]
    assert declaration.name == "search_products"
    assert declaration.description == "Search the catalog"


# --- Response parsing -------------------------------------------------------


def test_text_response_becomes_final_message():
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = _mock_response(text="Here are some rings.")
    provider = GeminiProvider(api_key=None, model="gemini-2.5-flash", client=mock_client)

    response = provider.generate([ChatMessage(role="user", content="show me rings")], [SEARCH_TOOL])

    assert response.message == "Here are some rings."
    assert response.tool_calls == []


def test_function_call_response_becomes_tool_call():
    # NOTE: MagicMock's constructor reserves `name` for the mock's own
    # debug name, so it must be assigned as an attribute afterwards, not
    # passed as a constructor kwarg (which would silently not set
    # function_call.name at all).
    function_call = MagicMock(id="call_abc", args={"category": "Rings"})
    function_call.name = "search_products"
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = _mock_response(function_calls=[function_call])
    provider = GeminiProvider(api_key=None, model="gemini-2.5-flash", client=mock_client)

    response = provider.generate([ChatMessage(role="user", content="show me rings")], [SEARCH_TOOL])

    assert response.tool_calls[0].id == "call_abc"
    assert response.tool_calls[0].name == "search_products"
    assert response.tool_calls[0].arguments == {"category": "Rings"}


def test_function_call_without_id_gets_a_synthetic_one():
    function_call = MagicMock(id=None, args={"id": 1})
    function_call.name = "get_product"
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = _mock_response(function_calls=[function_call])
    provider = GeminiProvider(api_key=None, model="gemini-2.5-flash", client=mock_client)

    response = provider.generate([ChatMessage(role="user", content="product 1")], [SEARCH_TOOL])

    assert response.tool_calls[0].id


def test_malformed_function_call_without_name_raises_provider_error():
    function_call = MagicMock(id="call_1", args={})
    function_call.name = None
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = _mock_response(function_calls=[function_call])
    provider = GeminiProvider(api_key=None, model="gemini-2.5-flash", client=mock_client)

    with pytest.raises(GeminiProviderError, match="malformed tool call"):
        provider.generate([ChatMessage(role="user", content="x")], [SEARCH_TOOL])


# --- Provider failure handling -----------------------------------------------


def test_api_error_is_wrapped_as_provider_error():
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = errors.ClientError(code=401, response_json={"error": "bad key"})
    provider = GeminiProvider(api_key=None, model="gemini-2.5-flash", client=mock_client)

    with pytest.raises(GeminiProviderError, match="Gemini API error"):
        provider.generate([ChatMessage(role="user", content="x")], [SEARCH_TOOL])


def test_unexpected_exception_is_wrapped_as_provider_error():
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = RuntimeError("connection reset")
    provider = GeminiProvider(api_key=None, model="gemini-2.5-flash", client=mock_client)

    with pytest.raises(GeminiProviderError, match="Unexpected error"):
        provider.generate([ChatMessage(role="user", content="x")], [SEARCH_TOOL])


def test_client_error_is_not_retried(monkeypatch):
    # A 4xx (e.g. bad API key) is never retryable — retrying would just
    # return the same error, so it must fail on the very first attempt.
    sleep_calls = []
    monkeypatch.setattr("app.llm.gemini_provider.time.sleep", lambda s: sleep_calls.append(s))

    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = errors.ClientError(code=401, response_json={"error": "bad key"})
    provider = GeminiProvider(api_key=None, model="gemini-2.5-flash", client=mock_client)

    with pytest.raises(GeminiProviderError, match="Gemini API error"):
        provider.generate([ChatMessage(role="user", content="x")], [SEARCH_TOOL])

    assert mock_client.models.generate_content.call_count == 1
    assert sleep_calls == []


def test_server_error_is_retried_and_succeeds_on_a_later_attempt(monkeypatch):
    # Reproduces the real production/local failure: Gemini intermittently
    # returns 503 "high demand" and the exact same request succeeds moments
    # later. A transient ServerError should be retried, not surfaced to the
    # user as a failure, on the first hiccup.
    sleep_calls = []
    monkeypatch.setattr("app.llm.gemini_provider.time.sleep", lambda s: sleep_calls.append(s))

    server_error = errors.ServerError(
        503, {"error": {"code": 503, "message": "high demand", "status": "UNAVAILABLE"}}
    )
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = [server_error, _mock_response(text="Here are some rings.")]
    provider = GeminiProvider(api_key=None, model="gemini-2.5-flash", client=mock_client)

    response = provider.generate([ChatMessage(role="user", content="show me rings")], [SEARCH_TOOL])

    assert response.message == "Here are some rings."
    assert mock_client.models.generate_content.call_count == 2
    assert len(sleep_calls) == 1


def test_server_error_raises_after_exhausting_retries(monkeypatch):
    sleep_calls = []
    monkeypatch.setattr("app.llm.gemini_provider.time.sleep", lambda s: sleep_calls.append(s))

    server_error = errors.ServerError(
        503, {"error": {"code": 503, "message": "high demand", "status": "UNAVAILABLE"}}
    )
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = server_error
    provider = GeminiProvider(api_key=None, model="gemini-2.5-flash", client=mock_client)

    with pytest.raises(GeminiProviderError, match="Gemini API error"):
        provider.generate([ChatMessage(role="user", content="x")], [SEARCH_TOOL])

    assert mock_client.models.generate_content.call_count == 3
    assert len(sleep_calls) == 2


# --- Factory selection (app.llm.factory.get_llm_provider) -------------------
#
# NOTE 1: constructing a real `genai.Client(...)` was measured to take ~1s
# even with a fake key (it appears to do some I/O at construction time, not
# just at call time) — so `genai.Client` itself is patched here rather than
# letting the "gemini" branch construct a real one, keeping this fully
# network-free per the task's requirement.
#
# NOTE 2: every test here explicitly sets LLM_API_KEY to a harmless dummy
# value via monkeypatch, even the ones that don't need it. This is
# deliberate: env vars override a real backend/.env file, but simply NOT
# setting one does not — pydantic-settings would still read whatever real
# key is on disk into the Settings object. Explicitly overriding it
# guarantees the real key is never loaded into memory during this test
# file's run, regardless of what backend/.env contains at test time.


def test_factory_selects_fake_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "fake")
    monkeypatch.setenv("LLM_API_KEY", "unused-dummy-key-for-this-test")
    get_settings.cache_clear()
    try:
        provider = get_llm_provider()
        assert isinstance(provider, FakeLLMProvider)
    finally:
        get_settings.cache_clear()


def test_factory_selects_gemini_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.setenv("LLM_API_KEY", "test-key-not-real")
    monkeypatch.setenv("LLM_MODEL", "gemini-2.5-flash")
    get_settings.cache_clear()

    try:
        with patch("app.llm.gemini_provider.genai.Client") as mock_client_cls:
            mock_client_cls.return_value = MagicMock()
            provider = get_llm_provider()
    finally:
        get_settings.cache_clear()

    assert isinstance(provider, GeminiProvider)
    mock_client_cls.assert_called_once_with(api_key="test-key-not-real")


def test_factory_raises_for_unknown_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "some-unimplemented-provider")
    monkeypatch.setenv("LLM_API_KEY", "unused-dummy-key-for-this-test")
    get_settings.cache_clear()
    try:
        with pytest.raises(NotImplementedError, match="some-unimplemented-provider"):
            get_llm_provider()
    finally:
        get_settings.cache_clear()
