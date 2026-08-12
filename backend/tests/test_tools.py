"""Tests for the product agent tools.

Verifies the tools delegate correctly to product_service and handle
missing/invalid input gracefully (never raise for expected failure cases).
"""

from app.tools.product_tools import (
    check_inventory,
    compare_products,
    filter_products,
    get_product,
    search_products,
)


def test_search_products_returns_all_by_default():
    result = search_products()
    assert result["count"] == 6
    assert len(result["items"]) == 6


def test_search_products_filters_by_category():
    result = search_products(category="Rings")
    assert result["count"] == 2
    assert {item["name"] for item in result["items"]} == {"Astraea Diamond Ring", "Celeste Solitaire"}


def test_search_products_combined_filters():
    result = search_products(category="Rings", gemstone="Diamond")
    assert result["count"] == 2


def test_search_products_no_matches_returns_empty_list_not_error():
    result = search_products(category="Anklets")
    assert result == {"count": 0, "items": []}


def test_search_products_ignores_unexpected_kwargs():
    result = search_products(category="Rings", bogus_argument="ignored")
    assert result["count"] == 2


def test_get_product_returns_existing_product():
    result = get_product(id=1)
    assert result["found"] is True
    assert result["item"]["name"] == "Astraea Diamond Ring"


def test_get_product_missing_id_returns_error_not_exception():
    result = get_product()
    assert result == {"found": False, "error": "Missing required argument 'id'."}


def test_get_product_invalid_id_type_returns_error_not_exception():
    result = get_product(id="not-a-number")
    assert result["found"] is False
    assert "Invalid product id" in result["error"]


def test_get_product_nonexistent_id_returns_error_not_exception():
    result = get_product(id=9999)
    assert result == {"found": False, "error": "Product 9999 not found."}


# --- filter_products (same deterministic query as search_products) --------


def test_filter_products_delegates_to_the_same_service_call():
    filtered = filter_products(category="Rings", gemstone="Diamond")
    searched = search_products(category="Rings", gemstone="Diamond")
    assert filtered == searched
    assert filtered["count"] == 2


def test_filter_products_empty_result():
    result = filter_products(category="Rings", max_price=100)
    assert result == {"count": 0, "items": []}


# --- compare_products ------------------------------------------------------


def test_compare_products_returns_structured_fields_for_valid_ids():
    result = compare_products(ids=[1, 5])

    assert result["not_found"] == []
    assert len(result["compared"]) == 2
    names = {item["name"] for item in result["compared"]}
    assert names == {"Astraea Diamond Ring", "Celeste Solitaire"}

    first = result["compared"][0]
    assert set(first.keys()) == {
        "id",
        "name",
        "category",
        "price_value",
        "price_display",
        "material",
        "metal",
        "gemstone",
    }


def test_compare_products_reports_invalid_ids_without_failing_the_whole_call():
    result = compare_products(ids=[1, 9999])

    assert len(result["compared"]) == 1
    assert result["compared"][0]["id"] == 1
    assert result["not_found"] == [9999]


def test_compare_products_with_non_integer_id_reports_not_found():
    result = compare_products(ids=[1, "not-a-number"])
    assert result["not_found"] == ["not-a-number"]


def test_compare_products_with_no_ids_returns_empty_with_error():
    result = compare_products(ids=[])
    assert result["compared"] == []
    assert "error" in result


def test_compare_products_with_none_returns_empty_with_error():
    result = compare_products()
    assert result["compared"] == []
    assert "error" in result


# --- check_inventory --------------------------------------------------------


def test_check_inventory_reports_unknown_status_for_existing_product():
    result = check_inventory(id=1)
    assert result == {
        "status": "unknown",
        "product_id": 1,
        "message": "Live inventory information is not available for this product.",
    }


def test_check_inventory_never_reports_in_stock_or_out_of_stock_for_null_data():
    # All 6 catalog products currently have in_stock = null — this asserts
    # that stays true for the whole catalog, not just product 1.
    for product_id in range(1, 7):
        result = check_inventory(id=product_id)
        assert result["status"] == "unknown"


def test_check_inventory_reports_not_found_for_missing_product():
    result = check_inventory(id=9999)
    assert result["status"] == "not_found"
    assert result["product_id"] == 9999


def test_check_inventory_missing_id_returns_error_not_exception():
    result = check_inventory()
    assert result["status"] == "error"


def test_check_inventory_invalid_id_type_returns_error_not_exception():
    result = check_inventory(id="not-a-number")
    assert result["status"] == "error"
