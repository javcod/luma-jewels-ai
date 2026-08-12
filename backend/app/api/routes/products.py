"""Product catalog endpoints.

Deterministic, read-only HTTP access to the canonical product catalog via
`app.services.product_service`. This route module has no business logic of
its own — it validates HTTP input, delegates to the service, and shapes the
HTTP response. No agent, no LLM.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas.product import Product, ProductListResponse
from app.services import product_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
def list_products(
    category: Optional[str] = Query(None, description="Exact category match, case-insensitive (e.g. 'Rings')"),
    metal: Optional[str] = Query(None, description="Exact metal match, case-insensitive (e.g. 'Platinum')"),
    gemstone: Optional[str] = Query(None, description="Exact gemstone match, case-insensitive (e.g. 'Diamond')"),
    min_price: Optional[float] = Query(None, ge=0, description="Inclusive minimum price_value"),
    max_price: Optional[float] = Query(None, ge=0, description="Inclusive maximum price_value"),
) -> ProductListResponse:
    products = product_service.get_all_products(
        category=category,
        metal=metal,
        gemstone=gemstone,
        min_price=min_price,
        max_price=max_price,
    )
    return ProductListResponse(count=len(products), items=products)


@router.get("/{product_id}", response_model=Product)
def get_product(product_id: int) -> Product:
    product = product_service.get_product_by_id(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    return product
