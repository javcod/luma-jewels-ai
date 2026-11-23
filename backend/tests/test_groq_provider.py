"""Tests for GroqProvider using a mocked HTTP transport (no network)."""

import json
from unittest.mock import patch

import httpx
import pytest

from app.llm.base import ChatMessage, ToolDefinition
from app.llm.groq_provider import API_URL, DEFAULT_MODEL, GroqProvider, GroqProviderError

SEARCH_TOOL = ToolDefinition(
    name="search_products",
    description="Search the catalog",
    parameters={"type": "object", "properties": {"category": {"type": "string"}}},
)


def _provider(handler, model=""):
    client = httpx.Client(transport=httpx.MockTransport(handler))
    return GroqProvider(api_key="test-key", model=model, client=client)


def _ok(message: dict) -> httpx.Response:
    return httpx.Response(200, json={"choices": [{"message": message}]})


def test_missing_api_key_raises():
    with pytest.raises(GroqProviderError):
        GroqProvider(api_key=None)


def test_sends_model_messages_tools_and_auth_header():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["auth"] = request.headers["authorization"]
        captured["body"] = json.loads(request.content)
        return _ok({"content": "Hello"})

    provider = _provider(handler)
    provider.generate(
        [ChatMessage(role="system", content="sys"), ChatMessage(role="user", content="hi")],
        [SEARCH_TOOL],
    )

    assert captured["url"] == API_URL
    assert captured["auth"] == "Bearer test-key"
    body = captured["body"]
    assert body["model"] == DEFAULT_MODEL
    assert body["messages"] == [{"role": "system", "content": "sys"}, {"role": "user", "content": "hi"}]
    assert body["tools"][0]["function"]["name"] == "search_products"
    assert body["tool_choice"] == "auto"


def test_custom_model_is_used():
    captured = {}

    def handler(request):
        captured["body"] = json.loads(request.content)
        return _ok({"content": "ok"})

    _provider(handler, model="llama-3.3-70b-versatile").generate([ChatMessage(role="user", content="x")], [])
    assert captured["body"]["model"] == "llama-3.3-70b-versatile"
    assert "tools" not in captured["body"]


def test_tool_results_are_sent_as_user_messages():
    captured = {}

    def handler(request):
        captured["body"] = json.loads(request.content)
        return _ok({"content": "done"})

    _provider(handler).generate(
        [ChatMessage(role="tool", name="search_products", tool_call_id="c1", content='{"count": 1}')],
        [SEARCH_TOOL],
    )
    message = captured["body"]["messages"][0]
    assert message["role"] == "user"
    assert "search_products" in message["content"]
    assert '{"count": 1}' in message["content"]


def test_parses_final_message():
    response = _provider(lambda r: _ok({"content": "Here is a ring."})).generate(
        [ChatMessage(role="user", content="x")], [SEARCH_TOOL]
    )
    assert response.message == "Here is a ring."
    assert response.tool_calls == []


def test_parses_tool_calls():
    message = {
        "content": None,
        "tool_calls": [
            {
                "id": "call_1",
                "type": "function",
                "function": {"name": "search_products", "arguments": '{"category": "Rings"}'},
            }
        ],
    }
    response = _provider(lambda r: _ok(message)).generate([ChatMessage(role="user", content="x")], [SEARCH_TOOL])

    assert response.message is None
    assert len(response.tool_calls) == 1
    call = response.tool_calls[0]
    assert (call.id, call.name, call.arguments) == ("call_1", "search_products", {"category": "Rings"})


def test_tool_call_without_name_raises():
    message = {"tool_calls": [{"id": "c", "function": {"name": "", "arguments": "{}"}}]}
    with pytest.raises(GroqProviderError):
        _provider(lambda r: _ok(message)).generate([ChatMessage(role="user", content="x")], [SEARCH_TOOL])


def test_invalid_tool_arguments_raise():
    message = {"tool_calls": [{"id": "c", "function": {"name": "search_products", "arguments": "not json"}}]}
    with pytest.raises(GroqProviderError):
        _provider(lambda r: _ok(message)).generate([ChatMessage(role="user", content="x")], [SEARCH_TOOL])


def test_rate_limit_error_is_not_retried():
    calls = []

    def handler(request):
        calls.append(1)
        return httpx.Response(429, json={"error": {"message": "rate limit"}})

    with pytest.raises(GroqProviderError, match="429"):
        _provider(handler).generate([ChatMessage(role="user", content="x")], [])
    assert len(calls) == 1


def test_server_error_is_retried_then_succeeds():
    responses = iter([httpx.Response(503, text="busy"), _ok({"content": "ok"})])

    with patch("app.llm.groq_provider.time.sleep"):
        response = _provider(lambda r: next(responses)).generate([ChatMessage(role="user", content="x")], [])
    assert response.message == "ok"


def test_network_error_raises_provider_error():
    def handler(request):
        raise httpx.ConnectError("no network")

    with pytest.raises(GroqProviderError):
        _provider(handler).generate([ChatMessage(role="user", content="x")], [])


def test_unexpected_response_shape_raises():
    with pytest.raises(GroqProviderError):
        _provider(lambda r: httpx.Response(200, json={"choices": []})).generate(
            [ChatMessage(role="user", content="x")], []
        )
