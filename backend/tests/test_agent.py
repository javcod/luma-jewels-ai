"""Tests for the Concierge agent orchestration loop (app.agents.orchestrator).

Uses FakeLLMProvider for realistic end-to-end runs, plus small local test
doubles to exercise failure modes (provider error, runaway tool-calling)
that FakeLLMProvider itself never triggers. No network, no real LLM.
"""

from app.agents.orchestrator import MAX_TOOL_ITERATIONS, run_concierge
from app.llm.base import ChatMessage, LLMProvider, LLMResponse, ToolCall, ToolDefinition
from app.llm.fake_provider import FakeLLMProvider

fake_provider = FakeLLMProvider()


class RaisingLLMProvider(LLMProvider):
    """Simulates a provider/network failure."""

    def generate(self, messages: list[ChatMessage], tools: list[ToolDefinition]) -> LLMResponse:
        raise RuntimeError("simulated provider failure")


class AlwaysToolCallLLMProvider(LLMProvider):
    """Simulates a misbehaving provider that never stops requesting tools —
    used to prove the iteration cap actually bounds the loop."""

    def generate(self, messages: list[ChatMessage], tools: list[ToolDefinition]) -> LLMResponse:
        return LLMResponse(tool_calls=[ToolCall(id="call_x", name="get_product", arguments={"id": 1})])


# --- Happy paths, via the real (fake) provider ---------------------------


def test_search_request_returns_recommended_products():
    state = run_concierge("I'm looking for diamond rings", fake_provider)

    assert state.final_response
    assert len(state.recommended_products) == 2
    assert {p.name for p in state.recommended_products} == {"Astraea Diamond Ring", "Celeste Solitaire"}
    assert state.tool_calls[0].name == "search_products"
    assert state.applied_filters == {"category": "Rings", "gemstone": "Diamond"}


def test_product_detail_request_returns_single_product():
    state = run_concierge("Tell me more about product 1", fake_provider)

    assert len(state.recommended_products) == 1
    assert state.recommended_products[0].id == 1
    assert state.tool_calls[0].name == "get_product"


def test_no_result_request_returns_empty_recommendations():
    state = run_concierge("I want a gold ring under $500", fake_provider)

    assert state.recommended_products == []
    assert "couldn't find" in state.final_response.lower()


def test_vague_request_does_not_call_a_tool():
    state = run_concierge("hello", fake_provider)

    assert state.tool_calls == []
    assert state.recommended_products == []
    assert state.final_response


def test_invalid_product_id_handled_gracefully():
    state = run_concierge("Tell me more about product 9999", fake_provider)

    assert state.recommended_products == []
    assert "9999" in state.final_response
    assert state.tool_calls[0].name == "get_product"


def test_hard_constraint_request_uses_filter_products_tool():
    state = run_concierge("It must be a ring under $3000", fake_provider)

    assert state.tool_calls[0].name == "filter_products"
    assert len(state.recommended_products) == 1
    assert state.recommended_products[0].name == "Astraea Diamond Ring"


def test_compare_request_returns_full_product_records():
    state = run_concierge("Compare product 1 and product 5", fake_provider)

    assert state.tool_calls[0].name == "compare_products"
    assert len(state.recommended_products) == 2
    # Full, valid Product records — not the partial dict compare_products
    # itself returns (proves _update_recommendations re-fetches via the
    # service rather than reconstructing an incomplete Product).
    assert all(p.image for p in state.recommended_products)


def test_compare_request_with_one_invalid_id_still_returns_the_valid_one():
    state = run_concierge("Compare product 1 and product 9999", fake_provider)

    assert len(state.recommended_products) == 1
    assert state.recommended_products[0].id == 1
    assert "9999" in state.final_response


def test_check_inventory_request_reports_unknown_and_does_not_touch_recommendations():
    state = run_concierge("Is product 1 in stock?", fake_provider)

    assert state.tool_calls[0].name == "check_inventory"
    assert state.recommended_products == []
    assert "not available" in state.final_response.lower()
    assert "in stock" not in state.final_response.lower()


# --- State/trace shape ----------------------------------------------------


def test_state_records_full_tool_trace():
    state = run_concierge("platinum diamond ring", fake_provider)

    assert len(state.tool_calls) == 1
    assert len(state.tool_results) == 1
    assert state.tool_results[0].tool_name == "search_products"
    assert "count" in state.tool_results[0].output


def test_execution_trace_reflects_tools_used():
    state = run_concierge("Compare product 1 and product 5", fake_provider)

    labels = [event.label for event in state.trace]
    tools_in_trace = [event.tool for event in state.trace if event.tool]

    assert "Understanding your request" in labels
    assert "compare_products" in tools_in_trace
    assert all(event.type == "activity" for event in state.trace)


def test_execution_trace_for_vague_request_has_no_tool_events():
    state = run_concierge("hello", fake_provider)

    assert [event.tool for event in state.trace if event.tool] == []


def test_execution_trace_never_contains_system_prompt():
    state = run_concierge("show me rings", fake_provider)

    trace_text = " ".join(event.label for event in state.trace)
    assert "Luma Concierge" not in trace_text
    assert "jewelry shopping assistant" not in trace_text


# --- Failure handling -------------------------------------------------------


def test_provider_failure_produces_graceful_final_response():
    state = run_concierge("I want a gold ring", RaisingLLMProvider())

    assert state.final_response
    assert "trouble" in state.final_response.lower()
    assert state.recommended_products == []
    assert state.tool_calls == []


def test_max_tool_iterations_bounds_the_loop():
    state = run_concierge("product 1", AlwaysToolCallLLMProvider())

    assert state.iterations == MAX_TOOL_ITERATIONS
    assert len(state.tool_calls) == MAX_TOOL_ITERATIONS
    assert "narrow down" in state.final_response.lower()
