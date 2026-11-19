"""Application settings, read from environment variables (and an optional ``.env``)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parent
DATA_DIR = BACKEND_DIR / "app" / "data"

PAGES_ORIGIN = "https://obadaalqaisee-dev.github.io"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    environment: Literal["development", "test", "production"] = "development"
    log_level: str = "INFO"

    database_url: str = f"sqlite:///{BACKEND_DIR / 'quran.sqlite3'}"

    # Browser origins allowed to call the API (comma-separated in the env var).
    # The GitHub Pages site is the production frontend.
    cors_origins: Annotated[list[str], NoDecode] = Field(default_factory=lambda: [PAGES_ORIGIN])

    # Interactive API documentation (/api/docs). Off by default in production.
    enable_docs: bool | None = None

    # Serve the static site from this backend (useful for local development only;
    # in production the site is served by GitHub Pages).
    serve_static: bool | None = None
    static_dir: Path = REPO_ROOT

    # Rate limiting (requests per window per client IP).
    rate_limit_window_seconds: int = Field(60, ge=1)
    rate_limit_default: int = Field(240, ge=1)
    rate_limit_upstream: int = Field(30, ge=1)  # endpoints that call third-party services

    upstream_timeout_seconds: float = Field(8.0, gt=0, le=60)
    aladhan_base_url: str = "https://api.aladhan.com/v1"
    mp3quran_base_url: str = "https://www.mp3quran.net/api/v3"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value):
        if isinstance(value, str):
            return [o.strip().rstrip("/") for o in value.split(",") if o.strip()]
        return value

    @field_validator("cors_origins")
    @classmethod
    def _no_wildcard_in_production(cls, value, info):
        if "*" in value and info.data.get("environment") == "production":
            raise ValueError("CORS_ORIGINS must list explicit origins in production")
        return value

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def docs_enabled(self) -> bool:
        return (not self.is_production) if self.enable_docs is None else self.enable_docs

    @property
    def static_enabled(self) -> bool:
        return (not self.is_production) if self.serve_static is None else self.serve_static


@lru_cache
def get_settings() -> Settings:
    return Settings()
