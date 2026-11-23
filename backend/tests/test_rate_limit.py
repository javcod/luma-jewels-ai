"""Tests for the per-IP chat rate limit."""

import pytest
from fastapi.testclient import TestClient

from app.api.rate_limit import reset_rate_limits
from app.core.config import get_settings
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def _limit_of_two(monkeypatch):
    monkeypatch.setenv("CHAT_RATE_LIMIT_PER_HOUR", "2")
    get_settings.cache_clear()
    reset_rate_limits()
    yield
    get_settings.cache_clear()
    reset_rate_limits()


def _chat(ip="1.1.1.1"):
    return client.post("/concierge/chat", json={"message": "hello"}, headers={"X-Forwarded-For": ip})


def test_requests_over_the_limit_get_429():
    assert _chat().status_code == 200
    assert _chat().status_code == 200

    response = _chat()
    assert response.status_code == 429
    assert response.json()["detail"] == "Chat limit reached. Please try again later."


def test_limit_is_tracked_per_ip():
    _chat("1.1.1.1")
    _chat("1.1.1.1")

    assert _chat("1.1.1.1").status_code == 429
    assert _chat("2.2.2.2").status_code == 200


def test_first_forwarded_ip_is_used():
    _chat("3.3.3.3, 10.0.0.1")
    _chat("3.3.3.3, 10.0.0.2")

    assert _chat("3.3.3.3").status_code == 429


def test_zero_disables_the_limit(monkeypatch):
    monkeypatch.setenv("CHAT_RATE_LIMIT_PER_HOUR", "0")
    get_settings.cache_clear()

    for _ in range(5):
        assert _chat().status_code == 200


def test_products_endpoint_is_not_rate_limited():
    for _ in range(5):
        assert client.get("/products").status_code == 200
