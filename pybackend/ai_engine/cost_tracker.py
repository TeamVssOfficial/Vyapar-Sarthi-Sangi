"""
Cost & Usage Tracker for Vyapar Verse AI.
Tracks token consumption, latency, and model billing metrics.
"""

from typing import Dict, Any, List
import time


class CostTracker:
    _history: List[Dict[str, Any]] = []

    @classmethod
    def record_usage(
        cls,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        latency_seconds: float,
        is_free: bool = True
    ) -> Dict[str, Any]:
        """Records an execution event."""
        # Free models on OpenRouter (:free) cost $0.00
        cost_usd = 0.0 if is_free or ":free" in model else round((prompt_tokens * 0.0000008) + (completion_tokens * 0.000002), 6)

        entry = {
            "timestamp": time.time(),
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
            "latency_seconds": latency_seconds,
            "cost_usd": cost_usd,
            "is_free": is_free
        }
        cls._history.append(entry)
        if len(cls._history) > 500:
            cls._history = cls._history[-500:]

        return entry

    @classmethod
    def get_summary(cls) -> Dict[str, Any]:
        """Returns aggregate usage statistics."""
        total_calls = len(cls._history)
        total_tokens = sum(e["total_tokens"] for e in cls._history)
        total_cost = sum(e["cost_usd"] for e in cls._history)
        avg_latency = round(sum(e["latency_seconds"] for e in cls._history) / total_calls, 3) if total_calls > 0 else 0.0

        return {
            "total_api_calls": total_calls,
            "total_tokens_processed": total_tokens,
            "total_cost_usd": round(total_cost, 4),
            "average_latency_seconds": avg_latency,
            "free_tier_active": True
        }
