"""Product tools available to the Concierge agent.

The five V1 read-only tools: search_products, filter_products, get_product,
compare_products, check_inventory. Every one of them delegates to
`app.services.product_service` — the same deterministic catalog service the
`/products` HTTP API uses. No catalog retrieval or filtering logic is
duplicated anywhere in this module.

`filter_products` intentionally reuses `search_products`'s own executor
rather than calling `product_service` a second, separate way — they exist
as two distinct tool *names* so the agent can express "hard constraint"
intent separately from "open browse" intent, but the underlying query is
identical.

Tool executors never raise for "expected" failure cases (missing/invalid
id, no matches, unknown inventory) — they return a structured result the
agent can reason about. Unexpected exceptions are still handled, but by the
orchestrator, not here.
"""

from typing import Any, Optional

from app.services import product_service
from app.llm.base import ToolDefinition

_PRODUCT_FILTER_PARAMETERS = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "description": "e.g. 'Rings', 'Earrings', 'Necklaces', 'Bracelets'"},
        "metal": {"type": "string", "description": "Exact catalog metal value, e.g. 'Platinum'"},
        "gemstone": {"type": "string", "description": "Exact catalog gemstone value, e.g. 'Diamond'"},
        "min_price": {"type": "number", "description": "Inclusive minimum price"},
        "max_price": {"type": "number", "description": "Inclusive maximum price"},
    },
    "required": [],
}

SEARCH_PRODUCTS_TOOL = ToolDefinition(
    name="search_products",
    description=(
        "Browse/search the LumaJewel product catalog with optional filters. "
        "Use this for open-ended requests (e.g. 'show me some rings'). "
        "Returns only real products that exist in the catalog."
    ),
    parameters=_PRODUCT_FILTER_PARAMETERS,
)

FILTER_PRODUCTS_TOOL = ToolDefinition(
    name="filter_products",
    description=(
        "Filter the LumaJewel catalog by hard constraints the user explicitly "
        "requires (e.g. 'must be under $2000 and platinum'). Same filters as "
        "search_products — use this one when the request is a firm constraint "
        "rather than an open browse."
    ),
    parameters=_PRODUCT_FILTER_PARAMETERS,
)

GET_PRODUCT_TOOL = ToolDefinition(
    name="get_product",
    description="Retrieve a single product from the catalog by its id.",
    parameters={
        "type": "object",
        "properties": {"id": {"type": "integer", "description": "The product's catalog id"}},
        "required": ["id"],
    },
)

COMPARE_PRODUCTS_TOOL = ToolDefinition(
    name="compare_products",
    description=(
        "Compare two or more catalog products side by side using only real "
        "catalog fields (name, price, category, material, metal, gemstone). "
        "Returns structured data only — explain the comparison yourself "
        "after receiving the result."
    ),
    parameters={
        "type": "object",
        "properties": {
            "ids": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "Two or more catalog product ids to compare",
            }
        },
        "required": ["ids"],
    },
)

CHECK_INVENTORY_TOOL = ToolDefinition(
    name="check_inventory",
    description=(
        "Check whether a specific product is in stock. The catalog does not "
        "currently track live inventory, so this reports status 'unknown' "
        "rather than guessing — never claim a product is in stock based on "
        "anything other than this tool's result."
    ),
    parameters={
        "type": "object",
        "properties": {"id": {"type": "integer", "description": "The product's catalog id"}},
        "required": ["id"],
    },
)

AVAILABLE_TOOLS: list[ToolDefinition] = [
    SEARCH_PRODUCTS_TOOL,
    FILTER_PRODUCTS_TOOL,
    GET_PRODUCT_TOOL,
    COMPARE_PRODUCTS_TOOL,
    CHECK_INVENTORY_TOOL,
]


def search_products(
    category: Optional[str] = None,
    metal: Optional[str] = None,
    gemstone: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    **_ignored: Any,
) -> dict[str, Any]:
    """Search the catalog. Extra/unexpected kwargs are ignored rather than
    raising, since a real LLM may occasionally include a stray argument."""
    products = product_service.get_all_products(
        category=category,
        metal=metal,
        gemstone=gemstone,
        min_price=min_price,
        max_price=max_price,
    )
    return {"count": len(products), "items": [p.model_dump() for p in products]}


def filter_products(**kwargs: Any) -> dict[str, Any]:
    """Same deterministic query as search_products — see module docstring
    for why this is a thin alias rather than a second implementation."""
    return search_products(**kwargs)


def get_product(id: Any = None, **_ignored: Any) -> dict[str, Any]:  # noqa: A002 - matches tool schema field name
    """Retrieve one product by id. Returns a structured 'not found'/'invalid'
    result rather than raising, so the agent can respond gracefully."""
    if id is None:
        return {"found": False, "error": "Missing required argument 'id'."}

    try:
        product_id = int(id)
    except (TypeError, ValueError):
        return {"found": False, "error": f"Invalid product id: {id!r}."}

    product = product_service.get_product_by_id(product_id)
    if product is None:
        return {"found": False, "error": f"Product {product_id} not found."}

    return {"found": True, "item": product.model_dump()}


def compare_products(ids: Any = None, **_ignored: Any) -> dict[str, Any]:
    """Return structured facts for each valid id; invalid/missing ids are
    reported separately rather than failing the whole comparison."""
    if not ids:
        return {"compared": [], "not_found": [], "error": "No product ids were provided to compare."}

    compared: list[dict[str, Any]] = []
    not_found: list[Any] = []

    for raw_id in ids:
        try:
            product_id = int(raw_id)
        except (TypeError, ValueError):
            not_found.append(raw_id)
            continue

        product = product_service.get_product_by_id(product_id)
        if product is None:
            not_found.append(product_id)
            continue

        compared.append(
            {
                "id": product.id,
                "name": product.name,
                "category": product.category,
                "price_value": product.price_value,
                "price_display": product.price_display,
                "material": product.material,
                "metal": product.metal,
                "gemstone": product.gemstone,
            }
        )

    return {"compared": compared, "not_found": not_found}


def check_inventory(id: Any = None, **_ignored: Any) -> dict[str, Any]:  # noqa: A002
    """Report inventory status. Every product's `in_stock` is currently
    `null` in the catalog, so this always reports 'unknown' today — it is
    written to also handle a real True/False value correctly if/when
    inventory data is ever added, without needing to change the contract."""
    if id is None:
        return {"status": "error", "product_id": None, "message": "Missing required argument 'id'."}

    try:
        product_id = int(id)
    except (TypeError, ValueError):
        return {"status": "error", "product_id": None, "message": f"Invalid product id: {id!r}."}

    product = product_service.get_product_by_id(product_id)
    if product is None:
        return {
            "status": "not_found",
            "product_id": product_id,
            "message": f"Product {product_id} not found in the catalog.",
        }

    if product.in_stock is None:
        return {
            "status": "unknown",
            "product_id": product_id,
            "message": "Live inventory information is not available for this product.",
        }

    return {
        "status": "in_stock" if product.in_stock else "out_of_stock",
        "product_id": product_id,
        "message": "This product is in stock." if product.in_stock else "This product is out of stock.",
    }


TOOL_EXECUTORS = {
    "search_products": search_products,
    "filter_products": filter_products,
    "get_product": get_product,
    "compare_products": compare_products,
    "check_inventory": check_inventory,
}
