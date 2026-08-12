"""Top-level API router.

Aggregates all route modules under `app.api.routes` into a single router
that `app.main` mounts on the FastAPI application. New route modules
(products, concierge, etc.) should be added here in later phases rather
than being wired directly into `main.py`.
"""

from fastapi import APIRouter

from app.api.routes import concierge, health, products

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(products.router)
api_router.include_router(concierge.router)
