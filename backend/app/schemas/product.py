"""Canonical product schema.

This is the single source of truth for what a "product" looks like on the
backend. It is derived from `src/data/products.js` (the frontend's static
catalog) plus fields the existing frontend code already anticipates
(`metal`, `description` — see `src/components/ProductModal.jsx`).

Deliberately EXCLUDED: `match` / `reason`. Those are query-relative outputs
("how well does this fit *this* request") produced by whoever is doing the
recommending, not static facts about a product — see the Codebase
Intelligence Report, Architecture Decision #8, and `backend/README.md` for
the full rationale. A future agent tool computes these per-conversation;
they must never be baked into the catalog.

Fields that don't exist in the source data yet (`description`,
`style_tags`, `occasion_tags`, `in_stock`) are `None` for every product in
this phase rather than fabricated — see `backend/README.md` → Data Quality
Issues for exactly what's missing and why.
"""

from typing import Optional

from pydantic import BaseModel, Field


class Product(BaseModel):
    id: int
    name: str
    category: str = Field(..., description="e.g. 'Rings', 'Earrings', 'Necklaces', 'Bracelets'")

    # Price is numeric for deterministic filtering/sorting by future tools,
    # with the original presentation string preserved for the frontend.
    price_value: float = Field(..., description="Numeric price, e.g. 2450.0")
    currency: str = Field(
        "USD",
        description="Assumed from the '$' symbol in the source data — never explicitly stated anywhere in the repo.",
    )
    price_display: str = Field(..., description="Original presentation string, e.g. '$2,450'")

    # `material` is the original free-text description, preserved verbatim.
    # `metal` / `gemstone` are structured values manually derived from it
    # (not inferred programmatically) — see backend/README.md for the
    # per-product derivation table.
    material: str
    metal: Optional[str] = None
    gemstone: Optional[str] = None

    image: str

    # Anticipated by the existing (unused) frontend fallback in
    # ProductModal.jsx, but no product currently has real copy — null, not
    # fabricated.
    description: Optional[str] = None

    # Anticipated future filter/tag dimensions (Codebase Intelligence
    # Report §5). No current product data maps to specific style/occasion
    # values, so these are null for every product in this phase.
    style_tags: Optional[list[str]] = None
    occasion_tags: Optional[list[str]] = None

    # Unknown, not fabricated. Absence of stock data must not be read as
    # "in stock" by any future filter or agent tool.
    in_stock: Optional[bool] = None


class ProductListResponse(BaseModel):
    count: int
    items: list[Product]
