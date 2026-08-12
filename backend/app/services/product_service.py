"""Product repository/service.

Responsible for loading the canonical product catalog from
`app/data/products.json` and providing deterministic, read-only access to
it. No HTTP concerns here — that belongs in `app.api.routes.products`.

This module is the capability the future Luma Concierge agent tools
(`search_products`, `filter_products`, `get_product`, ...) will call into.
Keeping it free of HTTP/agent/LLM concerns now means those later phases can
depend on it directly without refactoring it.

Everything here is deterministic: the same arguments against the same
catalog file always produce the same result. No network calls, no
randomness, no LLM.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Optional

from app.schemas.product import Product

_CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "products.json"


@lru_cache
def _load_catalog() -> tuple[Product, ...]:
    """Load and validate the canonical catalog once per process.

    Returns a tuple (not a list) so the cached value is effectively
    immutable — callers get their own list copies via the public functions
    below rather than being able to mutate the shared cache.
    """
    raw = json.loads(_CATALOG_PATH.read_text(encoding="utf-8"))
    return tuple(Product(**item) for item in raw)


def get_all_products(
    category: Optional[str] = None,
    metal: Optional[str] = None,
    gemstone: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[Product]:
    """Return catalog products, optionally filtered.

    Filters are combined with AND. Matching is exact and case-insensitive
    for `category`/`metal`/`gemstone` — deliberately not fuzzy/partial, to
    keep results deterministic and easy to reason about as an agent tool
    contract. `min_price`/`max_price` are inclusive bounds on `price_value`.
    """
    products = list(_load_catalog())

    if category is not None:
        products = [p for p in products if p.category.lower() == category.lower()]
    if metal is not None:
        products = [p for p in products if (p.metal or "").lower() == metal.lower()]
    if gemstone is not None:
        products = [p for p in products if (p.gemstone or "").lower() == gemstone.lower()]
    if min_price is not None:
        products = [p for p in products if p.price_value >= min_price]
    if max_price is not None:
        products = [p for p in products if p.price_value <= max_price]

    return products


def get_product_by_id(product_id: int) -> Optional[Product]:
    """Return a single product by id, or None if it doesn't exist."""
    return next((p for p in _load_catalog() if p.id == product_id), None)
