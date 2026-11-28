import json
import time
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings

class OllamaService:
    @classmethod
    async def check_connection(cls) -> Dict[str, Any]:
        """Checks if local Ollama runtime is online and retrieves installed models."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    raw_models = data.get("models", [])
                    installed_models = [m.get("name") for m in raw_models]
                    
                    has_default = any(settings.DEFAULT_MODEL in name for name in installed_models)
                    has_coder = any(settings.CODER_MODEL in name for name in installed_models)

                    return {
                        "connected": True,
                        "base_url": settings.OLLAMA_BASE_URL,
                        "installed_models": installed_models,
                        "default_model": settings.DEFAULT_MODEL,
                        "coder_model": settings.CODER_MODEL,
                        "has_default_model": has_default,
                        "has_coder_model": has_coder,
                        "cpu_optimized": True,
                        "status_message": f"Connected to local Ollama. {len(installed_models)} model(s) available.",
                    }
                else:
                    return {
                        "connected": False,
                        "base_url": settings.OLLAMA_BASE_URL,
                        "error": f"Ollama returned HTTP status {res.status_code}",
                        "instructions": "Ensure Ollama service is active via: ollama serve",
                    }
        except Exception as e:
            return {
                "connected": False,
                "base_url": settings.OLLAMA_BASE_URL,
                "error": f"Cannot connect to Ollama: {str(e)}",
                "instructions": (
                    "Ollama is not running locally. To enable real local LLM inference:\n"
                    "1. Install Ollama from https://ollama.com\n"
                    "2. Start Ollama service: ollama serve\n"
                    f"3. Pull general model: ollama pull {settings.DEFAULT_MODEL}\n"
                    f"4. Pull coder model: ollama pull {settings.CODER_MODEL}"
                ),
            }

    @classmethod
    def get_model_for_role(cls, role: str, requested_model: Optional[str] = None) -> str:
        """Determines best local model based on agent specialization."""
        if requested_model and requested_model not in ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "default"]:
            return requested_model

        role_lower = role.lower()
        if "dev" in role_lower or "code" in role_lower or "engineer" in role_lower:
            return settings.CODER_MODEL
        return settings.DEFAULT_MODEL

    @classmethod
    async def generate(
        cls,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        json_format: bool = False,
        temperature: Optional[float] = None,
        context_window: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Executes a real local LLM generation request against Ollama."""
        selected_model = model or settings.DEFAULT_MODEL
        temp = temperature if temperature is not None else settings.TEMPERATURE
        ctx = context_window or settings.CONTEXT_LENGTH

        payload: Dict[str, Any] = {
            "model": selected_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temp,
                "num_ctx": ctx,
                "num_thread": settings.CPU_THREADS,
            },
        }

        if system_prompt:
            payload["system"] = system_prompt

        if json_format:
            payload["format"] = "json"

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=float(settings.TIMEOUT_SECONDS)) as client:
                res = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json=payload,
                )
                
                if res.status_code != 200:
                    error_detail = res.text
                    raise RuntimeError(f"Ollama inference error (HTTP {res.status_code}): {error_detail}")

                data = res.json()
                total_duration_ms = int((time.time() - start_time) * 1000)

                # Ollama reports nanosecond metrics
                ollama_eval_duration = data.get("eval_duration", 0)
                eval_duration_ms = int(ollama_eval_duration / 1_000_000) if ollama_eval_duration else total_duration_ms
                prompt_tokens = data.get("prompt_eval_count", 0)
                completion_tokens = data.get("eval_count", 0)

                raw_response = data.get("response", "").strip()

                return {
                    "text": raw_response,
                    "model": selected_model,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": prompt_tokens + completion_tokens,
                    "duration_ms": total_duration_ms,
                    "eval_duration_ms": eval_duration_ms,
                    "success": True,
                }
        except httpx.ConnectError:
            raise ConnectionError(
                f"Local LLM runtime (Ollama) is offline at {settings.OLLAMA_BASE_URL}. "
                f"Start Ollama with 'ollama serve' and download model '{selected_model}'."
            )
        except httpx.TimeoutException:
            raise TimeoutError(
                f"Local CPU model inference timed out after {settings.TIMEOUT_SECONDS}s. "
                "Consider using a smaller quantized model or reducing context length."
            )
