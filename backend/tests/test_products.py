"""Tests for the canonical product catalog and the /products API.

Deterministic and independent: no network calls, no LLM, no database.
Assertions are pinned to the actual canonical catalog in
`app/data/products.json` (6 products, ids 1-6) rather than to hypothetical
data, so a change to the catalog that breaks these tests is a real signal.
"""

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas.product import Product
from app.services import product_service

client = TestClient(app)

EXPECTED_PRODUCT_COUNT = 6
EXPECTED_KEYS = {
    "id",
    "name",
    "category",
    "price_value",
    "currency",
    "price_display",
    "material",
    "metal",
    "gemstone",
    "image",
    "description",
    "style_tags",
    "occasion_tags",
    "in_stock",
}


# --- GET /products -----------------------------------------------------


def test_list_products_returns_200():
    response = client.get("/products")
    assert response.status_code == 200


def test_list_products_has_expected_structure():
    response = client.get("/products")
    body = response.json()

    assert set(body.keys()) == {"count", "items"}
    assert body["count"] == EXPECTED_PRODUCT_COUNT
    assert len(body["items"]) == EXPECTED_PRODUCT_COUNT
    assert set(body["items"][0].keys()) == EXPECTED_KEYS


def test_product_ids_are_unique():
    response = client.get("/products")
    ids = [item["id"] for item in response.json()["items"]]
    assert len(ids) == len(set(ids))


# --- GET /products/{id} -------------------------------------------------


def test_get_existing_product_returns_correct_product():
    response = client.get("/products/1")
    assert response.status_code == 200

    body = response.json()
    assert body["id"] == 1
    assert body["name"] == "Astraea Diamond Ring"
    assert body["category"] == "Rings"
    assert body["price_value"] == 2450.0
    assert body["price_display"] == "$2,450"


def test_get_invalid_product_returns_404():
    response = client.get("/products/9999")
    assert response.status_code == 404
    assert "detail" in response.json()


def test_get_product_negative_id_returns_404():
    response = client.get("/products/-1")
    assert response.status_code == 404


# --- Filtering ------------------------------------------------------------


def test_filter_by_category():
    response = client.get("/products", params={"category": "Rings"})
    body = response.json()

    assert body["count"] == 2
    assert {item["name"] for item in body["items"]} == {"Astraea Diamond Ring", "Celeste Solitaire"}


def test_filter_by_category_is_case_insensitive():
    response = client.get("/products", params={"category": "rings"})
    assert response.json()["count"] == 2


def test_filter_by_metal():
    response = client.get("/products", params={"metal": "Platinum"})
    body = response.json()

    assert body["count"] == 2
    assert {item["name"] for item in body["items"]} == {"Luna Pearl Earrings", "Celeste Solitaire"}


def test_filter_by_gemstone():
    response = client.get("/products", params={"gemstone": "Diamond"})
    body = response.json()

    assert body["count"] == 3
    names = {item["name"] for item in body["items"]}
    assert names == {"Astraea Diamond Ring", "Ethereal Diamond Studs", "Celeste Solitaire"}


def test_filter_by_price_range():
    response = client.get("/products", params={"min_price": 2000, "max_price": 3000})
    body = response.json()

    assert body["count"] == 2
    names = {item["name"] for item in body["items"]}
    assert names == {"Astraea Diamond Ring", "Gaia Emerald Bracelet"}


def test_filter_combined_returns_deterministic_result():
    response_a = client.get("/products", params={"category": "Rings", "gemstone": "Diamond"})
    response_b = client.get("/products", params={"category": "Rings", "gemstone": "Diamond"})

    assert response_a.json() == response_b.json()
    assert response_a.json()["count"] == 2


def test_filter_with_no_matches_returns_empty_result():
    response = client.get("/products", params={"category": "Anklets"})
    body = response.json()

    assert response.status_code == 200
    assert body["count"] == 0
    assert body["items"] == []


# --- Schema validation ------------------------------------------------------


def test_product_schema_rejects_missing_required_field():
    with pytest.raises(ValidationError):
        Product(name="Missing ID Ring", category="Rings", price_value=100.0, price_display="$100", material="Gold", image="http://example.com/x.jpg")


def test_product_schema_allows_null_optional_fields():
    product = Product(
        id=999,
        name="Test Ring",
        category="Rings",
        price_value=100.0,
        price_display="$100",
        material="Gold",
        image="http://example.com/x.jpg",
    )
    assert product.metal is None
    assert product.gemstone is None
    assert product.description is None
    assert product.style_tags is None
    assert product.occasion_tags is None
    assert product.in_stock is None
    assert product.currency == "USD"


# --- Service-layer determinism (no HTTP involved) ---------------------------


def test_service_get_all_products_is_deterministic():
    first_call = product_service.get_all_products()
    second_call = product_service.get_all_products()
    assert first_call == second_call


def test_service_get_product_by_id_returns_none_for_missing_id():
    assert product_service.get_product_by_id(9999) is None
