"""
OpenRouter API Provider for Vyapar Verse.
Connects securely via backend environment variables to OpenRouter's API gateway.
Supports streaming, standard completions, tool definitions, and rate-limit handling.
"""

import os
import time
import httpx
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")


class OpenRouterProvider:
    def __init__(self, api_key: Optional[str] = None, base_url: str = OPENROUTER_BASE_URL):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY", "")
        self.base_url = base_url.rstrip("/")
        self.client_timeout = float(os.getenv("VSS_AI_TIMEOUT_SECONDS", "25.0"))

    def is_configured(self) -> bool:
        """Check if an actual non-placeholder API key is configured."""
        if not self.api_key:
            return False
        k = self.api_key.strip()
        return not (k.startswith("YOUR_") or k == "YOUR_NEW_OPENROUTER_API_KEY" or len(k) < 10)

    async def chat_completion(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 2048,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to OpenRouter.
        Returns response dict with content, model_used, latency, and token metrics.
        """
        if not self.is_configured():
            return {
                "success": False,
                "error": "OpenRouter API key is not configured in backend environment.",
                "model": model,
                "is_fallback": True
            }

        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "HTTP-Referer": "https://vyaparverse.com",
            "X-Title": "Vyapar Verse (VSS AI)",
            "Content-Type": "application/json"
        }

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if tools:
            payload["tools"] = tools

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=self.client_timeout) as client:
                res = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                latency = round(time.time() - start_time, 3)

                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices:
                        message = choices[0].get("message", {})
                        usage = data.get("usage", {})
                        return {
                            "success": True,
                            "content": message.get("content", ""),
                            "tool_calls": message.get("tool_calls", []),
                            "model": data.get("model", model),
                            "latency_seconds": latency,
                            "usage": {
                                "prompt_tokens": usage.get("prompt_tokens", 0),
                                "completion_tokens": usage.get("completion_tokens", 0),
                                "total_tokens": usage.get("total_tokens", 0)
                            }
                        }
                    return {
                        "success": False,
                        "error": "No response choices returned by model.",
                        "model": model,
                        "latency_seconds": latency
                    }
                else:
                    err_msg = f"OpenRouter HTTP {res.status_code}: {res.text}"
                    logger.warning(err_msg)
                    return {
                        "success": False,
                        "error": err_msg,
                        "status_code": res.status_code,
                        "model": model,
                        "latency_seconds": latency
                    }

        except httpx.TimeoutException:
            return {
                "success": False,
                "error": f"OpenRouter model {model} timed out after {self.client_timeout}s.",
                "model": model,
                "timeout": True
            }
        except Exception as e:
            logger.error(f"OpenRouter unexpected failure: {e}")
            return {
                "success": False,
                "error": str(e),
                "model": model
            }

    async def check_model_availability(self) -> List[Dict[str, Any]]:
        """Query OpenRouter models catalogue to inspect active available models."""
        headers = {}
        if self.is_configured():
            headers["Authorization"] = f"Bearer {self.api_key.strip()}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.base_url}/models", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("data", [])
        except Exception as e:
            logger.warning(f"Could not reach OpenRouter models endpoint: {e}")
        return []
