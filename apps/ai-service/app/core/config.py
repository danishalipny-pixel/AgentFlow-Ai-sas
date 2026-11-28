import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")
    PROJECT_NAME: str = "AgentFlow AI - Local Multi-Agent Orchestration Engine"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = int(os.getenv("AI_SERVICE_PORT", "5202"))
    
    # Local Ollama Configuration (Zero Paid External APIs)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    DEFAULT_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
    CODER_MODEL: str = os.getenv("OLLAMA_CODER_MODEL", "qwen2.5-coder:7b")
    FALLBACK_MODELS: List[str] = [
        "qwen2.5:7b",
        "qwen2.5-coder:7b",
        "qwen2.5:3b",
        "qwen2.5:1.5b",
        "llama3.2:3b",
        "mistral:7b"
    ]
    
    # CPU Inference Optimization (Windows 10, 32GB RAM, No GPU required)
    TIMEOUT_SECONDS: int = int(os.getenv("AI_EXECUTION_TIMEOUT_SECONDS", "180"))
    CPU_THREADS: int = int(os.getenv("AI_CPU_THREADS", "8"))
    CONTEXT_LENGTH: int = int(os.getenv("AI_CONTEXT_LENGTH", "4096"))
    TEMPERATURE: float = float(os.getenv("AI_TEMPERATURE", "0.3"))
    
    # Local Storage & Knowledge Base
    KNOWLEDGE_STORAGE_PATH: str = os.getenv("KNOWLEDGE_STORAGE_PATH", "./knowledge_store")
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
