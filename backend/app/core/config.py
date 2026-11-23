"""Application settings loaded from environment variables or a local .env file.

See .env.example for the supported keys.
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Field names map to env vars case-insensitively (BACKEND_PORT -> backend_port)."""

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

    # Comma-separated list of allowed CORS origins
    frontend_origin: str = "http://localhost:5173"

    # One provider ("fake", "gemini", "groq") or a fallback chain like "groq,gemini,fake"
    llm_provider: str = "fake"

    # Gemini
    llm_model: str = ""
    llm_api_key: Optional[str] = None

    # Groq
    groq_model: str = ""
    groq_api_key: Optional[str] = None

    # Max chat requests per client IP per hour (0 disables the limit)
    chat_rate_limit_per_hour: int = 20

    @property
    def cors_origins(self) -> list[str]:
        """Split `frontend_origin` into a list of origins."""
        return [origin.strip() for origin in self.frontend_origin.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
