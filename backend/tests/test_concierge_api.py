"""Tests for POST /concierge/chat.

Uses the app's default (fake) provider for happy-path tests, and a FastAPI
dependency override with a failing provider for the failure-path test.
No real LLM, no network, no database.
"""

from fastapi.testclient import TestClient

from app.llm.base import ChatMessage, LLMProvider, LLMResponse, ToolDefinition
from app.llm.factory import get_llm_provider
from app.main import app

client = TestClient(app)


class RaisingLLMProvider(LLMProvider):
    def generate(self, messages: list[ChatMessage], tools: list[ToolDefinition]) -> LLMResponse:
        raise RuntimeError("simulated provider failure")


def test_valid_product_search_request_returns_results():
    response = client.post("/concierge/chat", json={"message": "Do you have any diamond rings?"})

    assert response.status_code == 200
    body = response.json()
    assert body["tools_used"] == ["search_products"]
    assert len(body["recommended_products"]) == 2
    assert body["applied_filters"] == {"category": "Rings", "gemstone": "Diamond"}
    assert body["iterations"] == 1
    assert body["message"]


def test_product_detail_request_returns_single_product():
    response = client.post("/concierge/chat", json={"message": "Tell me more about product 1"})

    assert response.status_code == 200
    body = response.json()
    assert body["tools_used"] == ["get_product"]
    assert len(body["recommended_products"]) == 1
    assert body["recommended_products"][0]["id"] == 1
    assert "Astraea Diamond Ring" in body["message"]


def test_no_result_request_returns_empty_recommendations():
    response = client.post("/concierge/chat", json={"message": "I want a gold ring under $500"})

    assert response.status_code == 200
    body = response.json()
    assert body["recommended_products"] == []
    assert "couldn't find" in body["message"].lower()


def test_vague_request_asks_for_clarification_without_calling_a_tool():
    response = client.post("/concierge/chat", json={"message": "hi"})

    assert response.status_code == 200
    body = response.json()
    assert body["tools_used"] == []
    assert body["recommended_products"] == []


def test_blank_message_returns_422():
    response = client.post("/concierge/chat", json={"message": "   "})
    assert response.status_code == 422


def test_missing_message_field_returns_422():
    response = client.post("/concierge/chat", json={})
    assert response.status_code == 422


def test_overlong_message_returns_422():
    response = client.post("/concierge/chat", json={"message": "a" * 2001})
    assert response.status_code == 422


def test_provider_failure_returns_200_with_graceful_message():
    app.dependency_overrides[get_llm_provider] = lambda: RaisingLLMProvider()
    try:
        response = client.post("/concierge/chat", json={"message": "I want a ring"})
    finally:
        app.dependency_overrides.pop(get_llm_provider, None)

    assert response.status_code == 200
    body = response.json()
    assert "trouble" in body["message"].lower()
    assert body["recommended_products"] == []
    assert body["tools_used"] == []


def test_response_never_exposes_internal_prompt():
    response = client.post("/concierge/chat", json={"message": "Do you have any diamond rings?"})
    raw_text = response.text

    assert "You are Luma Concierge" not in raw_text
    assert "Never invent products" not in raw_text  # a system-prompt rule, not agent output


# --- Execution trace ---------------------------------------------------------


def test_trace_is_returned_for_a_search_request():
    response = client.post("/concierge/chat", json={"message": "Do you have any diamond rings?"})
    body = response.json()

    assert "trace" in body
    assert len(body["trace"]) >= 2
    assert body["trace"][0] == {"type": "activity", "label": "Understanding your request", "tool": None}
    assert any(event["tool"] == "search_products" for event in body["trace"])


def test_trace_never_contains_internal_reasoning_or_prompt_text():
    response = client.post("/concierge/chat", json={"message": "Do you have any diamond rings?"})
    trace_text = " ".join(event["label"] for event in response.json()["trace"])

    assert "system" not in trace_text.lower()
    assert "Luma Concierge" not in trace_text
    forbidden = ("api key", "gemini", "GeminiProvider", "traceback")
    assert not any(term.lower() in trace_text.lower() for term in forbidden)


def test_trace_present_even_for_vague_request_with_no_tools():
    response = client.post("/concierge/chat", json={"message": "hi"})
    body = response.json()

    assert body["trace"] == [{"type": "activity", "label": "Understanding your request", "tool": None}]


# --- compare_products / check_inventory via the API --------------------------


def test_compare_products_request_via_api():
    response = client.post("/concierge/chat", json={"message": "Compare product 1 and product 5"})
    body = response.json()

    assert response.status_code == 200
    assert body["tools_used"] == ["compare_products"]
    assert len(body["recommended_products"]) == 2
    assert any(event["tool"] == "compare_products" for event in body["trace"])


def test_check_inventory_request_via_api_reports_unknown():
    response = client.post("/concierge/chat", json={"message": "Is product 1 in stock?"})
    body = response.json()

    assert response.status_code == 200
    assert body["tools_used"] == ["check_inventory"]
    assert body["recommended_products"] == []
    assert "not available" in body["message"].lower()
    assert "in stock" not in body["message"].lower()


# --- Provider construction failure (e.g. missing API key) --------------------


def test_provider_construction_failure_returns_clean_error_not_a_stack_trace():
    """Simulates e.g. GeminiProvider's __init__ raising because LLM_API_KEY
    is missing. Uses a client with raise_server_exceptions=False so this
    test observes exactly what a real deployed client receives (the JSON
    error body from app.main's global handler) rather than pytest's
    debug-mode re-raise of the underlying exception."""
    def _raise_configuration_error():
        raise RuntimeError("LLM_PROVIDER is 'gemini' but LLM_API_KEY is not configured.")

    app.dependency_overrides[get_llm_provider] = _raise_configuration_error
    safe_client = TestClient(app, raise_server_exceptions=False)
    try:
        response = safe_client.post("/concierge/chat", json={"message": "show me rings"})
    finally:
        app.dependency_overrides.pop(get_llm_provider, None)

    assert response.status_code == 500
    body = response.json()
    assert body == {"status": "error", "detail": "Internal server error"}
    # No raw exception message, file path, or stack trace leaked to the client.
    assert "LLM_API_KEY" not in response.text
    assert "Traceback" not in response.text
