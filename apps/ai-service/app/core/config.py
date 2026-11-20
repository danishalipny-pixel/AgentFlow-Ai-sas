import os
from pydantic_settings import BaseSettings

class Settings:
    PROJECT_NAME: str = "AgentFlow AI - Orchestration Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = int(os.getenv("AI_SERVICE_PORT", "8000"))
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_AI_MODEL", "gpt-4o-mini")
    TIMEOUT_SECONDS: int = int(os.getenv("AI_EXECUTION_TIMEOUT_SECONDS", "120"))
    CORS_ORIGINS: list[str] = ["*"]

settings = Settings()
