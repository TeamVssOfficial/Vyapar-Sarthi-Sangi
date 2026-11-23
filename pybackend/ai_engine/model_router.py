"""
Model Router for Vyapar Verse.
Dynamically maps classified user intents to the optimal OpenRouter models.
"""

import os
from typing import Dict, Any, List
from .task_classifier import TaskIntent


class ModelRouter:
    # Model assignments from environment configuration with canonical defaults
    CENTRAL_MODEL = os.getenv("VSS_CENTRAL_MODEL", os.getenv("VSS_PRIMARY_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free"))
    PRIMARY_MODEL = CENTRAL_MODEL
    REASONING_MODEL = os.getenv("VSS_REASONING_MODEL", "google/gemma-4-31b-it:free")
    FAST_MODEL = os.getenv("VSS_FAST_MODEL", "google/gemma-4-26b-a4b-it:free")
    MULTIMODAL_MODEL = os.getenv("VSS_MULTIMODAL_MODEL", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free")
    AUTO_FALLBACK_MODEL = os.getenv("VSS_AI_FALLBACK_MODEL", "openrouter/free")

    @classmethod
    def get_route_plan(cls, intent: TaskIntent) -> Dict[str, Any]:
        """
        Returns targeted primary model and ordered fallbacks for a given intent.
        """
        if intent == TaskIntent.STRATEGIC_REASONING:
            return {
                "primary_model": cls.PRIMARY_MODEL,
                "fallbacks": [cls.REASONING_MODEL, cls.FAST_MODEL, cls.AUTO_FALLBACK_MODEL],
                "role": "Strategic Business Orchestrator (Nemotron 3 Ultra)",
                "intent": intent.value,
                "temperature": 0.2
            }
        elif intent == TaskIntent.CODE_GENERATION:
            return {
                "primary_model": cls.REASONING_MODEL,
                "fallbacks": [cls.PRIMARY_MODEL, cls.FAST_MODEL, cls.AUTO_FALLBACK_MODEL],
                "role": "Data Science & Code Reasoning (Gemma 4 31B)",
                "intent": intent.value,
                "temperature": 0.1  # Deterministic syntax
            }
        elif intent == TaskIntent.MULTIMODAL_DOCUMENT:
            return {
                "primary_model": cls.MULTIMODAL_MODEL,
                "fallbacks": [cls.REASONING_MODEL, cls.PRIMARY_MODEL, cls.AUTO_FALLBACK_MODEL],
                "role": "Multimodal Vision & Document Reasoner (Nemotron Nano Omni)",
                "intent": intent.value,
                "temperature": 0.2
            }
        else:  # ROUTINE_QA
            return {
                "primary_model": cls.FAST_MODEL,
                "fallbacks": [cls.REASONING_MODEL, cls.PRIMARY_MODEL, cls.AUTO_FALLBACK_MODEL],
                "role": "Fast Business Analyst (Gemma 4 26B)",
                "intent": intent.value,
                "temperature": 0.3
            }

    @classmethod
    def get_configured_models(cls) -> Dict[str, str]:
        """Return dict of all registered models."""
        return {
            "primary": cls.PRIMARY_MODEL,
            "reasoning": cls.REASONING_MODEL,
            "fast": cls.FAST_MODEL,
            "multimodal": cls.MULTIMODAL_MODEL,
            "auto_fallback": cls.AUTO_FALLBACK_MODEL
        }
