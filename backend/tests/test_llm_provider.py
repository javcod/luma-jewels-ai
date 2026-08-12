"""Tests for the LLM abstraction layer and the FakeLLMProvider.

No network, no API key — FakeLLMProvider is pure Python logic.
"""

import json

from app.llm.base import ChatMessage
from app.llm.fake_provider import FakeLLMProvider
from app.tools.product_tools import AVAILABLE_TOOLS, GET_PRODUCT_TOOL, SEARCH_PRODUCTS_TOOL

provider = FakeLLMProvider()


def _user(text: str) -> list[ChatMessage]:
    return [ChatMessage(role="user", content=text)]


# --- Tool schema validation --------------------------------------------


def test_available_tools_are_the_five_v1_tools():
    names = {tool.name for tool in AVAILABLE_TOOLS}
    assert names == {
        "search_products",
        "filter_products",
        "get_product",
        "compare_products",
        "check_inventory",
    }


def test_get_product_tool_requires_id():
    assert GET_PRODUCT_TOOL.parameters["required"] == ["id"]
    assert "id" in GET_PRODUCT_TOOL.parameters["properties"]


def test_search_products_tool_has_no_required_fields():
    assert SEARCH_PRODUCTS_TOOL.parameters["required"] == []


# --- Deciding a tool call from user text --------------------------------


def test_detects_product_id_request():
    response = provider.generate(_user("Tell me more about product 3"), AVAILABLE_TOOLS)

    assert response.tool_calls
    assert response.tool_calls[0].name == "get_product"
    assert response.tool_calls[0].arguments == {"id": 3}


def test_detects_category_and_price_filters():
    response = provider.generate(_user("I want a gold ring under $500"), AVAILABLE_TOOLS)

    assert response.tool_calls
    call = response.tool_calls[0]
    assert call.name == "search_products"
    assert call.arguments["category"] == "Rings"
    assert call.arguments["max_price"] == 500.0
    # Plain "gold" is deliberately not mapped to a metal filter (ambiguous
    # across multiple exact catalog values) — see fake_provider.py.
    assert "metal" not in call.arguments


def test_detects_gemstone_and_metal():
    response = provider.generate(_user("Do you have platinum diamond pieces?"), AVAILABLE_TOOLS)

    call = response.tool_calls[0]
    assert call.arguments["metal"] == "Platinum"
    assert call.arguments["gemstone"] == "Diamond"


def test_vague_request_asks_for_clarification():
    response = provider.generate(_user("hi there"), AVAILABLE_TOOLS)

    assert not response.tool_calls
    assert response.message is not None
    assert "?" in response.message


def test_empty_message_asks_how_to_help():
    response = provider.generate([], AVAILABLE_TOOLS)

    assert not response.tool_calls
    assert response.message


# --- Summarizing a tool result ------------------------------------------


def test_summarizes_search_results_with_matches():
    tool_result = {
        "count": 1,
        "items": [
            {
                "id": 1,
                "name": "Astraea Diamond Ring",
                "category": "Rings",
                "price_display": "$2,450",
                "material": "18K Recycled Solid Gold, 0.5ct VVS Diamond",
            }
        ],
    }
    messages = [
        ChatMessage(role="user", content="rings"),
        ChatMessage(role="tool", name="search_products", tool_call_id="call_1", content=json.dumps(tool_result)),
    ]

    response = provider.generate(messages, AVAILABLE_TOOLS)

    assert not response.tool_calls
    assert "Astraea Diamond Ring" in response.message


def test_summarizes_empty_search_results():
    tool_result = {"count": 0, "items": []}
    messages = [
        ChatMessage(role="user", content="rings"),
        ChatMessage(role="tool", name="search_products", tool_call_id="call_1", content=json.dumps(tool_result)),
    ]

    response = provider.generate(messages, AVAILABLE_TOOLS)

    assert "couldn't find any" in response.message.lower()


def test_summarizes_missing_product():
    tool_result = {"found": False, "error": "Product 9999 not found."}
    messages = [
        ChatMessage(role="user", content="product 9999"),
        ChatMessage(role="tool", name="get_product", tool_call_id="call_1", content=json.dumps(tool_result)),
    ]

    response = provider.generate(messages, AVAILABLE_TOOLS)

    assert "9999" in response.message


def test_summarizes_found_product_discloses_missing_fields():
    tool_result = {
        "found": True,
        "item": {
            "id": 1,
            "name": "Astraea Diamond Ring",
            "category": "Rings",
            "price_display": "$2,450",
            "material": "18K Recycled Solid Gold, 0.5ct VVS Diamond",
            "description": None,
            "style_tags": None,
            "occasion_tags": None,
        },
    }
    messages = [
        ChatMessage(role="user", content="product 1"),
        ChatMessage(role="tool", name="get_product", tool_call_id="call_1", content=json.dumps(tool_result)),
    ]

    response = provider.generate(messages, AVAILABLE_TOOLS)

    assert "Astraea Diamond Ring" in response.message
    assert "isn't in the catalog" in response.message.lower()


def test_summarizes_tool_error():
    tool_result = {"error": "Unknown tool 'delete_everything'."}
    messages = [
        ChatMessage(role="user", content="x"),
        ChatMessage(role="tool", name="delete_everything", tool_call_id="call_1", content=json.dumps(tool_result)),
    ]

    response = provider.generate(messages, AVAILABLE_TOOLS)

    assert "issue" in response.message.lower()


# --- filter_products / compare_products / check_inventory routing ----------


def test_hard_constraint_phrasing_routes_to_filter_products():
    response = provider.generate(_user("It must be a ring under $3000"), AVAILABLE_TOOLS)

    assert response.tool_calls[0].name == "filter_products"
    assert response.tool_calls[0].arguments["category"] == "Rings"
    assert response.tool_calls[0].arguments["max_price"] == 3000.0


def test_open_ended_phrasing_routes_to_search_products():
    response = provider.generate(_user("Show me some rings"), AVAILABLE_TOOLS)
    assert response.tool_calls[0].name == "search_products"


def test_compare_request_detects_two_or_more_ids():
    response = provider.generate(_user("Compare product 1 and product 5"), AVAILABLE_TOOLS)

    assert response.tool_calls[0].name == "compare_products"
    assert response.tool_calls[0].arguments == {"ids": [1, 5]}


def test_compare_request_with_fewer_than_two_ids_asks_for_more():
    response = provider.generate(_user("Compare product 1"), AVAILABLE_TOOLS)

    assert not response.tool_calls
    assert response.message


def test_stock_request_with_id_routes_to_check_inventory():
    response = provider.generate(_user("Is product 1 in stock?"), AVAILABLE_TOOLS)

    assert response.tool_calls[0].name == "check_inventory"
    assert response.tool_calls[0].arguments == {"id": 1}


def test_stock_request_without_id_asks_which_product():
    response = provider.generate(_user("Do you have this in stock?"), AVAILABLE_TOOLS)

    assert not response.tool_calls
    assert "which product" in response.message.lower()


def test_summarizes_filter_products_result_same_as_search():
    tool_result = {
        "count": 1,
        "items": [
            {
                "id": 5,
                "name": "Celeste Solitaire",
                "category": "Rings",
                "price_display": "$5,200",
                "material": "Platinum, 1.2ct Ideal Cut Diamond",
            }
        ],
    }
    messages = [
        ChatMessage(role="user", content="rings"),
        ChatMessage(role="tool", name="filter_products", tool_call_id="call_1", content=json.dumps(tool_result)),
    ]

    response = provider.generate(messages, AVAILABLE_TOOLS)
    assert "Celeste Solitaire" in response.message


def test_summarizes_comparison_with_matches():
    tool_result = {
        "compared": [
            {
                "id": 1,
                "name": "Astraea Diamond Ring",
                "category": "Rings",
                "price_display": "$2,450",
                "material": "18K Recycled Solid Gold, 0.5ct VVS Diamond",
            },
            {
                "id": 5,
                "name": "Celeste Solitaire",
                "category": "Rings",
                "price_display": "$5,200",
                "material": "Platinum, 1.2ct Ideal Cut Diamond",
            },
        ],
        "not_found": [],
    }
    messages = [
        ChatMessage(role="user", content="compare 1 and 5"),
        ChatMessage(role="tool", name="compare_products", tool_call_id="call_1", content=json.dumps(tool_result)),
    ]

    response = provider.generate(messages, AVAILABLE_TOOLS)
    assert "Astraea Diamond Ring" in response.message
    assert "Celeste Solitaire" in response.message


def test_summarizes_comparison_with_no_valid_ids():
    tool_result = {"compared": [], "not_found": [9999], "error": "No product ids were provided to compare."}
    messages = [
        ChatMessage(role="user", content="compare 9999 and 9998"),
        ChatMessage(role="tool", name="compare_products", tool_call_id="call_1", content=json.dumps(tool_result)),
    ]

    response = provider.generate(messages, AVAILABLE_TOOLS)
    assert "couldn't compare" in response.message.lower()


def test_summarizes_unknown_inventory_status():
    tool_result = {
        "status": "unknown",
        "product_id": 1,
        "message": "Live inventory information is not available for this product.",
    }
    messages = [
        ChatMessage(role="user", content="is product 1 in stock"),
        ChatMessage(role="tool", name="check_inventory", tool_call_id="call_1", content=json.dumps(tool_result)),
    ]

    response = provider.generate(messages, AVAILABLE_TOOLS)
    assert "not available" in response.message.lower()
    # Must never claim in-stock/out-of-stock when status is unknown.
    assert "in stock" not in response.message.lower()
    assert "out of stock" not in response.message.lower()
