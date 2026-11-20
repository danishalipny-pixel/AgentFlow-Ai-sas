import math
import re
from datetime import datetime, timezone
from typing import Any, Dict
import httpx

class ToolRegistry:
    @staticmethod
    def calculate(expression: str) -> Dict[str, Any]:
        """Safely evaluates basic arithmetic expressions without arbitrary code execution."""
        clean = expression.strip()
        if not re.match(r"^[0-9\s\+\-\*\/\.\(\)\%\^]+$", clean):
            raise ValueError("Forbidden characters in arithmetic expression")
        
        # Safe evaluation namespace
        safe_dict = {
            "__builtins__": {},
            "abs": abs,
            "round": round,
            "min": min,
            "max": max,
            "pow": pow,
            "sqrt": math.sqrt,
        }
        clean = clean.replace("^", "**")
        result = eval(clean, safe_dict)
        return {"expression": expression, "value": float(result)}

    @staticmethod
    def datetime_utility(action: str = "current_time", days_delta: int = 0) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        if action == "add_days":
            target = now.timestamp() + (days_delta * 86400)
            target_dt = datetime.fromtimestamp(target, tz=timezone.utc)
            return {"original": now.isoformat(), "adjusted": target_dt.isoformat(), "days": days_delta}
        return {"utc_iso": now.isoformat(), "timestamp": int(now.timestamp())}

    @staticmethod
    def summarize_text(text: str, max_words: int = 150) -> Dict[str, Any]:
        words = text.split()
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        summary = " ".join(sentences[:3])
        return {
            "original_word_count": len(words),
            "sentence_count": len(sentences),
            "summary": summary if summary else text[:300] + "...",
            "key_takeaways": sentences[:2],
        }

    @staticmethod
    def parse_csv(csv_text: str, limit: int = 10) -> Dict[str, Any]:
        lines = [line.strip() for line in csv_text.splitlines() if line.strip()]
        if not lines:
            raise ValueError("CSV payload is empty")
        headers = [h.strip().strip('"\'') for h in lines[0].split(",")]
        rows = []
        for line in lines[1:limit + 1]:
            vals = [v.strip().strip('"\'') for v in line.split(",")]
            row_dict = {headers[i]: vals[i] if i < len(vals) else "" for i in range(len(headers))}
            rows.append(row_dict)
        return {"headers": headers, "total_rows": len(lines) - 1, "sample": rows}

    @staticmethod
    async def safe_fetch(url: str) -> Dict[str, Any]:
        """SSRF guarded HTTP request."""
        url_lower = url.lower()
        if any(h in url_lower for h in ["localhost", "127.0.0.1", "169.254", "0.0.0.0"]):
            raise PermissionError("Access to internal, loopback, or metadata addresses is blocked by security policy.")
        
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=False) as client:
            resp = await client.get(url, headers={"User-Agent": "AgentFlow-AI-Bot/1.0"})
            return {
                "status_code": resp.status_code,
                "content_type": resp.headers.get("content-type", ""),
                "snippet": resp.text[:1500],
            }
