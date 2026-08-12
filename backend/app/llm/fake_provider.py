"""Deterministic, rule-based LLM provider.

This is NOT a real language model. It is a stand-in that implements the
same `LLMProvider` interface a real provider would, so:

- the agent orchestration code (`app.agents.orchestrator`) never needs to
  know whether it's talking to a real LLM or this fake one, and
- the entire test suite can exercise the full agent/tool-calling loop
  deterministically, with no network access, no API key, and no cost.

It remains available and is the default provider (`LLM_PROVIDER=fake`)
alongside the real `GeminiProvider` (Phase 4) — see backend/README.md.

Design note: the heuristics below (keyword/regex matching on the user's
raw text) are intentionally simple and live ONLY here, behind the
`LLMProvider` interface. This is different from the architectural rule
"the real model must decide tool calls, not regex/keyword matching in
application code" (Phase 4, Part 2) — that rule is about the REAL provider
path (`GeminiProvider`), which lets the actual model decide. A *fake
provider* standing in for the LLM is expected to approximate what an LLM
would decide, deterministically, so tests are repeatable. Nothing in
`app.agents` or `app.tools` performs this kind of matching.
"""

import json
import re
from typing import Optional

from app.llm.base import ChatMessage, LLMProvider, LLMResponse, ToolCall, ToolDefinition

# Catalog metal values that can be inferred unambiguously from user text.
# Plain "gold" is deliberately excluded: the catalog has multiple distinct
# gold variants ("18K Gold", "14K Gold", "18K Yellow Gold") and the product
# service's metal filter is an exact match — guessing wrong would silently
# return zero results. Better to under-filter than to mis-filter.
_METAL_KEYWORDS: dict[str, str] = {
    "white gold": "White Gold",
    "yellow gold": "18K Yellow Gold",
    "14k gold": "14K Gold",
    "platinum": "Platinum",
}

_GEMSTONE_KEYWORDS: dict[str, str] = {
    "diamond": "Diamond",
    "pearl": "Pearl",
    "emerald": "Emerald",
}

_CATEGORY_KEYWORDS: dict[str, str] = {
    "ring": "Rings",
    "rings": "Rings",
    "earring": "Earrings",
    "earrings": "Earrings",
    "necklace": "Necklaces",
    "necklaces": "Necklaces",
    "bracelet": "Bracelets",
    "bracelets": "Bracelets",
}

_HARD_CONSTRAINT_KEYWORDS = ("must be", "only", "exactly", "has to be")
_STOCK_KEYWORDS = ("stock", "availability", "available")
_COMPARE_KEYWORD = "compare"

_PRODUCT_ID_PATTERN = re.compile(r"product\s*(?:#|id|number)?\s*(\d+)", re.IGNORECASE)
_ALL_NUMBERS_PATTERN = re.compile(r"\d+")
_MAX_PRICE_PATTERN = re.compile(r"(?:under|below|less than)\s*\$?\s*([\d,]+)", re.IGNORECASE)
_MIN_PRICE_PATTERN = re.compile(r"(?:over|above|more than)\s*\$?\s*([\d,]+)", re.IGNORECASE)


def _last_user_message(messages: list[ChatMessage]) -> Optional[str]:
    for message in reversed(messages):
        if message.role == "user":
            return message.content
    return None


def _last_tool_message(messages: list[ChatMessage]) -> Optional[ChatMessage]:
    for message in reversed(messages):
        if message.role == "tool":
            return message
    return None


class FakeLLMProvider(LLMProvider):
    """See module docstring."""

    def generate(self, messages: list[ChatMessage], tools: list[ToolDefinition]) -> LLMResponse:
        tool_message = _last_tool_message(messages)
        if tool_message is not None:
            return self._summarize_tool_result(tool_message)

        user_text = _last_user_message(messages)
        if not user_text or not user_text.strip():
            return LLMResponse(message="How can I help you find the right piece today?")

        return self._decide_next_step(user_text)

    # -- Step 1: decide whether a tool call is needed -----------------------

    def _decide_next_step(self, user_text: str) -> LLMResponse:
        lowered = user_text.lower()

        if _COMPARE_KEYWORD in lowered:
            ids = [int(n) for n in _ALL_NUMBERS_PATTERN.findall(user_text)]
            if len(ids) >= 2:
                return LLMResponse(
                    tool_calls=[ToolCall(id="call_1", name="compare_products", arguments={"ids": ids})]
                )
            return LLMResponse(
                message="I'd be glad to compare pieces for you — could you give me two or more product ids?"
            )

        if any(keyword in lowered for keyword in _STOCK_KEYWORDS):
            id_match = _PRODUCT_ID_PATTERN.search(user_text)
            if id_match:
                return LLMResponse(
                    tool_calls=[
                        ToolCall(id="call_1", name="check_inventory", arguments={"id": int(id_match.group(1))})
                    ]
                )
            return LLMResponse(
                message=(
                    "Which product would you like me to check the availability of? "
                    "Please give me a product id."
                )
            )

        id_match = _PRODUCT_ID_PATTERN.search(user_text)
        if id_match:
            return LLMResponse(
                tool_calls=[
                    ToolCall(id="call_1", name="get_product", arguments={"id": int(id_match.group(1))})
                ]
            )

        filters: dict = {}

        for keyword, category in _CATEGORY_KEYWORDS.items():
            if re.search(rf"\b{keyword}\b", lowered):
                filters["category"] = category
                break

        for keyword, metal in _METAL_KEYWORDS.items():
            if keyword in lowered:
                filters["metal"] = metal
                break

        for keyword, gemstone in _GEMSTONE_KEYWORDS.items():
            if re.search(rf"\b{keyword}\b", lowered):
                filters["gemstone"] = gemstone
                break

        max_match = _MAX_PRICE_PATTERN.search(user_text)
        if max_match:
            filters["max_price"] = float(max_match.group(1).replace(",", ""))

        min_match = _MIN_PRICE_PATTERN.search(user_text)
        if min_match:
            filters["min_price"] = float(min_match.group(1).replace(",", ""))

        if not filters:
            return LLMResponse(
                message=(
                    "Could you tell me a bit more about what you're looking for? "
                    "For example a category (rings, earrings, necklaces, bracelets), "
                    "a metal or gemstone, or a budget."
                )
            )

        # "Hard constraint" phrasing routes to filter_products; everything
        # else routes to search_products. Both call the identical
        # deterministic query — see app/tools/product_tools.py.
        tool_name = "filter_products" if any(k in lowered for k in _HARD_CONSTRAINT_KEYWORDS) else "search_products"
        return LLMResponse(tool_calls=[ToolCall(id="call_1", name=tool_name, arguments=filters)])

    # -- Step 2: turn a tool result into a final message ---------------------

    def _summarize_tool_result(self, tool_message: ChatMessage) -> LLMResponse:
        try:
            data = json.loads(tool_message.content)
        except (TypeError, ValueError):
            return LLMResponse(message="I ran into an issue reading the catalog response.")

        formatter = {
            "search_products": self._format_search_results,
            "filter_products": self._format_search_results,
            "get_product": self._format_product_detail,
            "compare_products": self._format_comparison,
            "check_inventory": self._format_inventory,
        }.get(tool_message.name)

        if formatter is None:
            # Unknown tool name (e.g. the orchestrator reported an unknown
            # tool) — data is a generic {"error": "..."} dict in that case.
            error = data.get("error", "an unexpected issue occurred.")
            return LLMResponse(message=f"I ran into an issue looking that up: {error}")

        return LLMResponse(message=formatter(data))

    def _format_search_results(self, data: dict) -> str:
        items = data.get("items", [])
        if not items:
            return (
                "I couldn't find any pieces in the current catalog matching that request. "
                "Would you like to try a different budget, metal, or category?"
            )

        lines = [self._describe_product(item) for item in items[:5]]
        intro = f"I found {len(items)} piece(s) that match:"
        return intro + "\n" + "\n".join(f"- {line}" for line in lines)

    def _format_product_detail(self, data: dict) -> str:
        if not data.get("found"):
            return f"I couldn't find that item - {data.get('error', 'it is not in the catalog.')}"

        item = data["item"]
        detail = f"{self._describe_product(item)}."

        missing = [
            field
            for field in ("description", "style_tags", "occasion_tags")
            if item.get(field) is None
        ]
        if missing:
            detail += (
                " I don't have a written description, style tags, or occasion tags on file "
                "for this piece yet - that information isn't in the catalog."
            )

        return detail

    def _format_comparison(self, data: dict) -> str:
        compared = data.get("compared", [])
        not_found = data.get("not_found", [])

        if not compared:
            return "I couldn't compare those - none of the ids you gave me match a real product in the catalog."

        lines = [self._describe_product(item) for item in compared]
        message = "Here's how those pieces compare:\n" + "\n".join(f"- {line}" for line in lines)

        if not_found:
            ids = ", ".join(str(i) for i in not_found)
            message += f"\n(I couldn't find a product for id(s): {ids}.)"

        return message

    def _format_inventory(self, data: dict) -> str:
        status = data.get("status")
        product_id = data.get("product_id")
        message = data.get("message", "")

        if status == "unknown":
            return f"For product {product_id}: {message}"
        if status == "not_found":
            return message
        if status in ("in_stock", "out_of_stock"):
            return f"Product {product_id}: {message}"
        return message or "I wasn't able to check availability for that item."

    @staticmethod
    def _describe_product(item: dict) -> str:
        return f"{item['name']} ({item['category']}, {item['price_display']}) - {item['material']}"
