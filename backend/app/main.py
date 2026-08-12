"""FastAPI application entry point.

This module only wires together configuration, middleware, error handling,
and routers. No business logic lives here (see ARCHITECTURAL RULES: no
logic in main.py) — that belongs in `app.services`, `app.agents`,
`app.tools`, and `app.llm` in later phases.
"""

import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings

logger = logging.getLogger("lumajewel.backend")


def create_app() -> FastAPI:
    """Application factory.

    Using a factory (rather than a module-level `app`) keeps startup
    configurable and makes the app easy to construct in tests.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="LumaJewel AI backend — foundation for the Luma Concierge agent.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Catch-all handler so unexpected errors return clean JSON instead
        of leaking stack traces to the client."""
        logger.exception("Unhandled error while processing %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"status": "error", "detail": "Internal server error"},
        )

    app.include_router(api_router)

    return app


app = create_app()
