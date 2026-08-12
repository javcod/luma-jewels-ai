"""Health check endpoint.

Used for local verification, frontend connectivity testing, and future
deployment health checks. Deliberately has no dependencies on any
not-yet-implemented subsystem (agent, LLM provider, database, etc.).
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    service: str
    environment: str


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        environment=settings.app_env,
    )
