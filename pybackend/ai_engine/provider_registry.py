"""
Provider Registry for Vyapar Verse AI Subsystem.
Manages provider instances, credentials validation, and gateway health.
"""

import os
from typing import Dict, Any, Optional
from .providers.openrouter_provider import OpenRouterProvider


class ProviderRegistry:
    _instance: Optional[OpenRouterProvider] = None

    @classmethod
    def get_openrouter(cls) -> OpenRouterProvider:
        if cls._instance is None:
            cls._instance = OpenRouterProvider()
        return cls._instance

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        provider = cls.get_openrouter()
        configured = provider.is_configured()
        return {
            "gateway": "OpenRouter API Gateway",
            "base_url": provider.base_url,
            "configured": configured,
            "status": "READY" if configured else "OFFLINE_FALLBACK_ACTIVE",
            "timeout_seconds": provider.client_timeout,
            "api_key_masked": ("sk-or-v1-..." + provider.api_key[-4:]) if configured else "NOT_CONFIGURED"
        }
