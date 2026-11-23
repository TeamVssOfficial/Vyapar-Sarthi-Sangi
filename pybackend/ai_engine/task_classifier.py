"""
Task Intent Classifier for Vyapar Verse.
Categorizes user intent into specialized model routes deterministically.
"""

from enum import Enum
from typing import Dict, Any, List


class TaskIntent(str, Enum):
    STRATEGIC_REASONING = "STRATEGIC_REASONING"
    CODE_GENERATION = "CODE_GENERATION"
    ROUTINE_QA = "ROUTINE_QA"
    MULTIMODAL_DOCUMENT = "MULTIMODAL_DOCUMENT"


class TaskClassifier:
    CODE_KEYWORDS = {
        "python", "code", "script", "pandas", "numpy", "scipy", "scikit",
        "matplotlib", "function", "generate code", "write code", "clean script",
        "algorithm", "def ", "import ", "regex", "dataframe", "transform column",
        "lambda", "write a python", "plot in python"
    }

    STRATEGIC_KEYWORDS = {
        "strategy", "projection", "forecast", "planning", "quarterly", "growth",
        "cross-department", "recommendation", "simulate", "orchestrate",
        "deep analysis", "root cause", "business health", "comprehensive report",
        "optimize", "tradeoff", "scenario", "decision"
    }

    MULTIMODAL_KEYWORDS = {
        "image", "screenshot", "receipt", "invoice ocr", "scan", "document photo",
        "visual chart", "inspect image", "read png", "read jpeg"
    }

    @classmethod
    def classify(cls, query: str, has_media: bool = False) -> Dict[str, Any]:
        """
        Classifies user prompt into appropriate model intent.
        Returns intent and confidence rationale.
        """
        if has_media:
            return {
                "intent": TaskIntent.MULTIMODAL_DOCUMENT,
                "reason": "Request contains image or multimodal attachment."
            }

        q_lower = query.lower()

        # Check code generation indicators first
        matched_code = [kw for kw in cls.CODE_KEYWORDS if kw in q_lower]
        if matched_code:
            return {
                "intent": TaskIntent.CODE_GENERATION,
                "reason": f"Detected coding / data transformation signals: {', '.join(matched_code[:3])}"
            }

        # Check multimodal keywords
        matched_mm = [kw for kw in cls.MULTIMODAL_KEYWORDS if kw in q_lower]
        if matched_mm:
            return {
                "intent": TaskIntent.MULTIMODAL_DOCUMENT,
                "reason": f"Detected document/image inspection intent: {', '.join(matched_mm[:2])}"
            }

        # Check strategic reasoning keywords
        matched_strat = [kw for kw in cls.STRATEGIC_KEYWORDS if kw in q_lower]
        if matched_strat or len(query.split()) > 25:
            return {
                "intent": TaskIntent.STRATEGIC_REASONING,
                "reason": f"Detected strategic/multi-step reasoning intent: {', '.join(matched_strat[:2]) if matched_strat else 'long context query'}"
            }

        # Routine Q&A fallback
        return {
            "intent": TaskIntent.ROUTINE_QA,
            "reason": "Fast routine business question or dataset inquiry."
        }
