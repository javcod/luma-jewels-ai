"""Centralized application configuration.

All environment-derived settings live here so the rest of the backend never
reads `os.environ` directly. Values are loaded from process environment
variables (and a local `.env` file in development, via python-dotenv support
built into pydantic-settings) with safe defaults for local development.

No secrets are hardcoded here. See `.env.example` for the supported keys.
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, populated from environment variables.

    Field names map to env vars of the same name (case-insensitive), e.g.
    `BACKEND_PORT` -> `backend_port`.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General
    app_env: str = "development"
    app_name: str = "lumajewel-backend"

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # CORS — comma-separated list of allowed origins for local development.
    # The Vite dev server defaults to http://localhost:5173.
    frontend_origin: str = "http://localhost:5173"

    # LLM provider — provider-agnostic on purpose (see app/llm/base.py).
    # "fake" is the only provider implemented so far: a deterministic,
    # rule-based stand-in that needs no network access or API key. It is
    # both the default and what the automated test suite uses.
    llm_provider: str = "fake"
    llm_model: str = ""
    llm_api_key: Optional[str] = None

    @property
    def cors_origins(self) -> list[str]:
        """Parse `frontend_origin` into a list of allowed CORS origins.

        Supports a single origin or a comma-separated list, so multiple
        local dev ports/hosts can be allowed without code changes.
        """
        return [origin.strip() for origin in self.frontend_origin.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (read once per process)."""
    return Settings()
