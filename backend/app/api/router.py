"""Combines all route modules into one router."""

from fastapi import APIRouter

from app.api.routes import concierge, health, products

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(products.router)
api_router.include_router(concierge.router)
