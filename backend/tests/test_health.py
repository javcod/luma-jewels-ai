"""Tests for the GET /health endpoint.

Deterministic and independent: no network calls, no external services,
no shared mutable state between tests.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_200():
    response = client.get("/health")
    assert response.status_code == 200


def test_health_returns_expected_status():
    response = client.get("/health")
    body = response.json()
    assert body["status"] == "ok"


def test_health_response_structure():
    response = client.get("/health")
    body = response.json()

    assert set(body.keys()) == {"status", "service", "environment"}
    assert isinstance(body["status"], str)
    assert isinstance(body["service"], str)
    assert isinstance(body["environment"], str)
