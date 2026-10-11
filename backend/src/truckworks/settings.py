"""API configuration, independent of production model settings."""

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="TRUCKWORKS_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )
    database_url: SecretStr | None = None
    session_cookie_secure: bool = False
    visitor_idle_seconds: float = Field(default=1800, gt=0)
    openai_api_key: SecretStr | None = None
    openai_model: str = "gpt-5.6-luna"
