"""
Conversation Context & Follow-Up Resolver for Vyapar Verse.
Enables true multi-turn conversational intelligence:
- Tracks current dataset metadata and active entity/category focus.
- Resolves pronouns and references ("its", "it", "this product", "the second one").
- Detects visualization requests ("show in a chart", "plot this").
- Keeps conversations isolated per user, business, and dataset.
"""

import re
from typing import Dict, Any, List, Optional
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class ConversationContextManager:
    @classmethod
    def resolve_followup_query(
        cls,
        user_query: str,
        history: Optional[List[Dict[str, Any]]] = None,
        df: Optional[pd.DataFrame] = None
    ) -> Dict[str, Any]:
        """
        Analyzes conversation history to extract previous focal entities and resolve pronouns.
        Returns:
            resolved_query: query text with resolved pronouns
            extracted_context: dict of last_entity, last_metric, wants_chart, etc.
        """
        context = {
            "last_entity": None,
            "last_metric": "revenue",
            "last_ranking": [],
            "wants_chart": False,
            "chart_type": "bar",
            "resolved_entity": None
        }

        q_lower = user_query.lower()

        # Detect chart request intent
        chart_keywords = ["chart", "plot", "graph", "visualize", "visualization", "curve", "histogram", "donut", "pie chart", "bar chart", "show trend", "display trend", "trend chart"]
        if any(w in q_lower for w in chart_keywords) or ("trend" in q_lower and any(w in q_lower for w in ["show", "display", "plot", "view"])):
            context["wants_chart"] = True
            if "line" in q_lower or "trend" in q_lower or "monthly" in q_lower:
                context["chart_type"] = "line"
            elif "pie" in q_lower or "donut" in q_lower or "share" in q_lower or "proportion" in q_lower:
                context["chart_type"] = "pie"
            elif "scatter" in q_lower:
                context["chart_type"] = "scatter"
            else:
                context["chart_type"] = "bar"

        # If no history, nothing to resolve from prior turns
        if not history or len(history) == 0:
            return {
                "resolved_query": user_query,
                "context": context
            }

        # Inspect last assistant message to find referenced entities or rankings
        last_assistant_msg = ""
        for turn in reversed(history):
            if turn.get("role") == "assistant":
                last_assistant_msg = turn.get("content", "")
                break

        # Extract entities from markdown bolding or ranking patterns (e.g., "**Product A**" or "1. **Classic Cars**")
        bold_items = re.findall(r"\*\*([^\*]+)\*\*", last_assistant_msg)
        # Filter out common labels
        ignore_labels = {
            "best-selling products & top categories breakdown", "top categories by revenue:",
            "best-selling products / skus:", "commercial snapshot:", "strategic recommendation:",
            "total revenue", "average order value (aov)", "operating margin", "model:", "zero hallucination verified"
        }
        filtered_entities = [b.strip() for b in bold_items if b.strip().lower() not in ignore_labels and len(b.strip()) < 50]

        if filtered_entities:
            context["last_entity"] = filtered_entities[0]
            context["last_ranking"] = filtered_entities

        # Detect ordinal references: "second one", "2nd product", "third", etc.
        ordinal_map = {
            "first": 0, "1st": 0,
            "second": 1, "2nd": 1,
            "third": 2, "3rd": 2,
            "fourth": 3, "4th": 3,
            "fifth": 4, "5th": 4
        }
        for word, idx in ordinal_map.items():
            if f"{word} one" in q_lower or f"{word} product" in q_lower or f"{word} category" in q_lower or f"the {word}" in q_lower:
                if len(context["last_ranking"]) > idx:
                    context["resolved_entity"] = context["last_ranking"][idx]
                    break

        # If pronoun reference used ("its", "it", "this product", "that product")
        pronoun_triggers = ["its ", " it", "this product", "that product", "this item", "this category", "this one", "show this"]
        if any(t in q_lower for t in pronoun_triggers) and not context["resolved_entity"]:
            if context["last_entity"]:
                context["resolved_entity"] = context["last_entity"]

        # Formulate resolved query string
        resolved = user_query
        target = context["resolved_entity"] or context["last_entity"]
        if target:
            # Replace pronouns if present
            if re.search(r"\b(its|it|this|that)\b", resolved, re.IGNORECASE):
                resolved = re.sub(r"\b(its)\b", f"{target}'s", resolved, flags=re.IGNORECASE)
                resolved = re.sub(r"\b(it|this|that)\b", target, resolved, flags=re.IGNORECASE)
            
            # Replace ordinal phrases if present
            for word in ["first", "1st", "second", "2nd", "third", "3rd", "fourth", "4th", "fifth", "5th"]:
                resolved = re.sub(rf"\b(the\s+)?{word}\s+(one|product|item|category)\b", target, resolved, flags=re.IGNORECASE)

            if target.lower() not in resolved.lower():
                resolved = f"{resolved} (referring to {target})"

        return {
            "resolved_query": resolved,
            "context": context
        }
