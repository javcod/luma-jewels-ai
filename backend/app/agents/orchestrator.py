"""Luma Concierge agent orchestration.

Implements the agent loop explicitly:

    START
      -> agent_reasoning   (ask the LLM provider what to do next)
      -> tool_required?
           NO  -> final_response -> END
           YES -> validate/execute_tool -> agent_reasoning (loop, bounded) -> ...

Why not LangGraph: this phase's loop has one decision point and a small,
fixed tool set — an explicit Python loop expresses the same state machine
with no added dependency, and keeps the whole flow readable in one file.
Adopting LangGraph is a reasonable future step once the graph gets more
branches (e.g. multi-agent, parallel tools) — flagged explicitly as a
decision for review in backend/README.md, not adopted here just because
it's the eventual target stack.

This module owns orchestration ONLY:
- it never reads the product catalog directly (that's `app.tools` ->
  `app.services.product_service`, except for one narrow, read-only lookup
  used to attach full product records to a comparison result — see
  `_update_recommendations`), and
- it never talks to a specific LLM vendor (that's `app.llm`, injected here
  only through the `LLMProvider` interface).
"""

import json
import logging

from app.agents.state import ConciergeState, ToolResult, TraceEvent
from app.agents.system_prompt import SYSTEM_PROMPT
from app.llm.base import ChatMessage, LLMProvider, LLMResponse, ToolCall
from app.schemas.product import Product
from app.services import product_service
from app.tools.product_tools import AVAILABLE_TOOLS, TOOL_EXECUTORS

logger = logging.getLogger("lumajewel.agent")

# A sensible bound on tool-calling rounds. The fake provider never needs
# more than one, but a real LLM provider could in principle keep requesting
# tools indefinitely — this guarantees the loop always terminates.
MAX_TOOL_ITERATIONS = 3

_FALLBACK_MESSAGE = "I'm not sure how to help with that yet."
_ITERATION_LIMIT_MESSAGE = (
    "I wasn't able to finish looking through the catalog for this request. "
    "Could you narrow down what you're looking for - a category, budget, metal, or gemstone?"
)
_PROVIDER_ERROR_MESSAGE = "I'm having trouble reaching the recommendation engine right now. Please try again shortly."

_TRACE_LABELS = {
    "search_products": "Searching the LumaJewel catalog",
    "filter_products": "Filtering products by your criteria",
    "get_product": "Retrieving product details",
    "compare_products": "Comparing selected pieces",
    "check_inventory": "Checking availability",
}


def run_concierge(user_message: str, provider: LLMProvider) -> ConciergeState:
    """Run one full agent turn for `user_message` and return the resulting
    state (final_response, any recommended_products, and a full trace of
    what tools were called)."""
    state = ConciergeState(user_message=user_message)
    state.messages.append(ChatMessage(role="system", content=SYSTEM_PROMPT))
    state.messages.append(ChatMessage(role="user", content=user_message))
    state.trace.append(TraceEvent(label="Understanding your request"))

    while True:
        response = _agent_reasoning(state, provider)

        if response is None:
            # A provider failure already set state.final_response.
            break

        if not response.tool_calls:
            state.final_response = response.message or _FALLBACK_MESSAGE
            break

        if state.iterations >= MAX_TOOL_ITERATIONS:
            state.final_response = _ITERATION_LIMIT_MESSAGE
            break

        for tool_call in response.tool_calls:
            _execute_tool(state, tool_call)

        state.iterations += 1

    if state.tool_calls:
        state.trace.append(TraceEvent(label="Preparing your recommendation"))

    return state


def _agent_reasoning(state: ConciergeState, provider: LLMProvider) -> LLMResponse | None:
    """Call the provider for the next reasoning step. Returns None (with
    state.final_response already set) if the provider itself fails — a
    provider error must never crash the request."""
    try:
        response = provider.generate(messages=state.messages, tools=AVAILABLE_TOOLS)
    except Exception:
        logger.exception("LLM provider failed during agent reasoning")
        state.final_response = _PROVIDER_ERROR_MESSAGE
        return None

    if response.message and not response.tool_calls:
        state.messages.append(ChatMessage(role="assistant", content=response.message))

    return response


def _execute_tool(state: ConciergeState, tool_call: ToolCall) -> None:
    state.tool_calls.append(tool_call)
    executor = TOOL_EXECUTORS.get(tool_call.name)

    if executor is None:
        logger.warning("Agent requested unknown tool: %s", tool_call.name)
        result: dict = {"error": f"Unknown tool '{tool_call.name}'."}
    else:
        state.trace.append(
            TraceEvent(label=_TRACE_LABELS.get(tool_call.name, f"Running {tool_call.name}"), tool=tool_call.name)
        )
        try:
            result = executor(**tool_call.arguments)
        except Exception:
            logger.exception("Tool '%s' raised an unexpected error", tool_call.name)
            result = {"error": f"The '{tool_call.name}' tool failed unexpectedly."}

    state.tool_results.append(
        ToolResult(tool_call_id=tool_call.id, tool_name=tool_call.name, output=result)
    )
    state.messages.append(
        ChatMessage(role="tool", name=tool_call.name, tool_call_id=tool_call.id, content=json.dumps(result))
    )

    _update_recommendations(state, tool_call, result)


def _update_recommendations(state: ConciergeState, tool_call: ToolCall, result: dict) -> None:
    """Populate recommended_products/applied_filters strictly from real,
    validated tool output — never from anything the LLM said."""
    if tool_call.name in ("search_products", "filter_products") and "items" in result:
        state.recommended_products = [Product(**item) for item in result["items"]]
        state.applied_filters = {k: v for k, v in tool_call.arguments.items() if v is not None}

    elif tool_call.name == "get_product" and result.get("found"):
        state.recommended_products = [Product(**result["item"])]

    elif tool_call.name == "compare_products" and result.get("compared"):
        # compare_products intentionally returns a partial field set (see
        # app/tools/product_tools.py); fetch the full, authoritative record
        # for each compared id rather than reconstructing a Product from a
        # partial dict.
        ids = [item["id"] for item in result["compared"]]
        products = [product_service.get_product_by_id(product_id) for product_id in ids]
        state.recommended_products = [p for p in products if p is not None]

    # check_inventory does not change recommended_products — it's an
    # availability check, not a source of new recommendations.
