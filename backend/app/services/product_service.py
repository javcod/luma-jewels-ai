"""Read-only access to the product catalog in app/data/products.json."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Optional

from app.schemas.product import Product

_CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "products.json"


@lru_cache
def _load_catalog() -> tuple[Product, ...]:
    """Load and validate the catalog once. A tuple keeps the cached value immutable."""
    raw = json.loads(_CATALOG_PATH.read_text(encoding="utf-8"))
    return tuple(Product(**item) for item in raw)


def get_all_products(
    category: Optional[str] = None,
    metal: Optional[str] = None,
    gemstone: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> list[Product]:
    """Return products matching all given filters.

    category, metal and gemstone are exact, case-insensitive matches.
    min_price and max_price are inclusive.
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
