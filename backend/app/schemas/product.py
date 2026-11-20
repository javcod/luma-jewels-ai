"""Product schema shared by the catalog API and the agent tools.

description, style_tags, occasion_tags and in_stock are not in the source
data yet, so they are None for every product.
"""

from typing import Optional

from pydantic import BaseModel, Field


class Product(BaseModel):
    id: int
    name: str
    category: str = Field(..., description="e.g. 'Rings', 'Earrings', 'Necklaces', 'Bracelets'")

    # Numeric price for filtering, plus the original display string
    price_value: float = Field(..., description="Numeric price, e.g. 2450.0")
    currency: str = Field(
        "USD",
        description="Assumed from the '$' symbol in the source data.",
    )
    price_display: str = Field(..., description="Original presentation string, e.g. '$2,450'")

    # `material` is the original text; `metal` and `gemstone` were derived from it by hand
    material: str
    metal: Optional[str] = None
    gemstone: Optional[str] = None

    image: str

    # No product has a description yet
    description: Optional[str] = None

    # Reserved for future filters
    style_tags: Optional[list[str]] = None
    occasion_tags: Optional[list[str]] = None

    # None means unknown, not "in stock"
    in_stock: Optional[bool] = None


class ProductListResponse(BaseModel):
    count: int
    items: list[Product]
