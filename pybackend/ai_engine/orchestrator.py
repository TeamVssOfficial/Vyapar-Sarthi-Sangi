"""
Central AI Orchestrator for Vyapar Verse.
The unified master pipeline coordinating multi-model routing, tool calls, context resolution, and verified responses.
"""

from typing import Dict, Any, Optional, List
import pandas as pd
import logging

from .task_classifier import TaskClassifier, TaskIntent
from .model_router import ModelRouter
from .provider_registry import ProviderRegistry
from .prompt_manager import PromptManager
from .tool_registry import ToolRegistry
from .response_validator import ResponseValidator
from .fallback_manager import FallbackManager
from .cost_tracker import CostTracker
from .context_manager import ConversationContextManager

logger = logging.getLogger(__name__)


class CentralAIOrchestrator:
    @classmethod
    async def process_user_query(
        cls,
        user_query: str,
        df: Optional[pd.DataFrame] = None,
        dataset_name: str = "Enterprise Dataset",
        history: Optional[List[Dict[str, str]]] = None,
        preferred_model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Master reasoning loop:
        1. Resolves follow-up pronouns and extracts context (e.g. 'its monthly trend' -> 'Classic Cars monthly trend').
        2. Classifies user intent into appropriate model route.
        3. Routes to target model plan (Nemotron 3 Ultra, Gemma 4 31B, Gemma 4 26B, Nemotron Nano Omni).
        4. Executes deterministic Python analytical tools to ground the answer in actual data.
        5. Generates interactive Plotly charts if requested.
        6. Calls OpenRouter with cascade fallback or local deterministic engine.
        7. Validates numbers and returns grounded response.
        """
        # Step 1: Resolve follow-up query and context references
        resolution = ConversationContextManager.resolve_followup_query(
            user_query=user_query,
            history=history,
            df=df
        )
        effective_query = resolution["resolved_query"]
        context = resolution["context"]

        # Step 2: Classify intent
        classification = TaskClassifier.classify(effective_query)
        intent: TaskIntent = classification["intent"]

        # Step 3: Route plan
        route_plan = ModelRouter.get_route_plan(intent)
        primary_model = preferred_model or route_plan["primary_model"]
        fallbacks = route_plan["fallbacks"]

        # Step 4: Execute Grounding Tools via Python Core
        tool_results: Dict[str, Any] = {}
        chart_spec = None

        if df is not None and not df.empty:
            q_low = effective_query.lower()
            
            # Auto-run relevant tools based on query intent
            if any(w in q_low for w in ["profile", "column", "structure", "shape", "dimension", "schema"]):
                tool_results.update(ToolRegistry.execute_tool("get_dataset_profile", {}, df))
                tool_results.update(ToolRegistry.execute_tool("get_dataset_columns", {}, df))

            if any(w in q_low for w in ["revenue", "sales", "order", "kpi", "growth", "performance", "aov", "product", "category", "categories", "best", "top", "selling", "item"]):
                tool_results.update(ToolRegistry.execute_tool("calculate_dataset_kpis", {}, df))

            if any(w in q_low for w in ["trend", "trajectory", "run rate", "velocity", "monthly", "growth"]):
                tool_results.update(ToolRegistry.execute_tool("analyze_trends", {}, df))
                tool_results.update(ToolRegistry.execute_tool("compare_periods", {}, df))

            if any(w in q_low for w in ["outlier", "anomaly", "abnormal", "extreme", "irregular"]):
                tool_results.update(ToolRegistry.execute_tool("detect_outliers", {}, df))

            if any(w in q_low for w in ["correlation", "relationship", "dependency", "driver"]):
                tool_results.update(ToolRegistry.execute_tool("analyze_correlations", {}, df))

            if any(w in q_low for w in ["quality", "missing", "duplicate", "clean", "health"]):
                tool_results.update(ToolRegistry.execute_tool("get_data_quality", {}, df))

            if any(w in q_low for w in ["forecast", "predict", "projection", "next month", "future"]):
                tool_results.update(ToolRegistry.execute_tool("run_ml_prediction", {}, df))

            if any(w in q_low for w in ["inventory", "stock", "reorder", "warehouse", "units"]):
                tool_results.update(ToolRegistry.execute_tool("get_inventory_summary", {}, df))

            if any(w in q_low for w in ["finance", "profit", "loss", "cash", "expense", "margin", "cogs"]):
                tool_results.update(ToolRegistry.execute_tool("get_finance_summary", {}, df))

            if any(w in q_low for w in ["report", "boardroom", "summary", "executive", "briefing"]):
                tool_results.update(ToolRegistry.execute_tool("generate_business_report", {}, df))

            # Auto-generate chart if user asked for a visualization or trend
            if context.get("wants_chart", False) or any(w in q_low for w in ["chart", "plot", "graph", "visualize"]):
                c_res = ToolRegistry.execute_tool(
                    "generate_chart",
                    {"chart_type": context.get("chart_type", "bar")},
                    df
                )
                if c_res.get("status") == "success":
                    chart_spec = c_res.get("chart_spec")
                    tool_results["generated_chart"] = {
                        "type": c_res.get("chart_type"),
                        "x": c_res.get("x_column"),
                        "y": c_res.get("y_column")
                    }

        # Step 5: Check if OpenRouter is active
        provider = ProviderRegistry.get_openrouter()
        if not provider.is_configured():
            # Gracefully trigger offline analytical engine fallback
            offline_res = FallbackManager.generate_offline_analytical_response(
                user_query=effective_query,
                df=df,
                dataset_name=dataset_name,
                context=context
            )
            return {
                "success": True,
                "content": offline_res["content"],
                "model": "Vyapar Sarthi AI Brain (Neural Analyst)",
                "intent": intent.value,
                "routing_reason": classification["reason"],
                "grounded": True,
                "is_fallback": True,
                "evidence": offline_res.get("evidence", []),
                "chart_spec": chart_spec or offline_res.get("chart_spec"),
                "resolved_query": effective_query
            }

        # Step 6: Format messages with ground-truth data
        messages = PromptManager.build_chat_messages(
            user_query=effective_query,
            df=df,
            dataset_name=dataset_name,
            history=history,
            tool_results=tool_results
        )

        # Step 7: Execute completion with multi-tier model cascade
        candidate_models = [primary_model] + [m for m in fallbacks if m != primary_model]
        last_error = None
        completion_data = None
        model_used = primary_model

        for target_model in candidate_models:
            logger.info(f"[CENTRAL AI] Attempting completion via {target_model}...")
            res = await provider.chat_completion(
                model=target_model,
                messages=messages,
                temperature=route_plan.get("temperature", 0.2)
            )

            if res.get("success"):
                completion_data = res
                model_used = target_model
                break
            else:
                last_error = res.get("error")
                logger.warning(f"[CENTRAL AI] Model {target_model} failed: {last_error}. Escalating to fallback...")

        # If all OpenRouter candidate models failed, run offline deterministic fallback
        if not completion_data:
            logger.warning("[CENTRAL AI] All external models failed or rate-limited. Falling back to local analytical engine.")
            offline_res = FallbackManager.generate_offline_analytical_response(
                user_query=effective_query,
                df=df,
                dataset_name=dataset_name,
                context=context
            )
            return {
                "success": True,
                "content": offline_res["content"],
                "model": "Vyapar Sarthi AI Brain (Neural Analyst)",
                "intent": intent.value,
                "routing_reason": classification["reason"],
                "grounded": True,
                "is_fallback": True,
                "evidence": offline_res.get("evidence", []),
                "chart_spec": chart_spec or offline_res.get("chart_spec"),
                "resolved_query": effective_query
            }

        # Step 8: Record metrics in Cost Tracker
        usage = completion_data.get("usage", {})
        latency = completion_data.get("latency_seconds", 0.0)
        CostTracker.record_usage(
            model=model_used,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            latency_seconds=latency,
            is_free=True
        )

        # Step 9: Validate and enrich response
        raw_text = completion_data.get("content", "")
        validated = ResponseValidator.validate_and_enrich(
            raw_text=raw_text,
            tool_results=tool_results,
            model_used=model_used
        )

        return {
            "success": True,
            "content": validated["content"],
            "model": model_used,
            "intent": intent.value,
            "routing_reason": classification["reason"],
            "latency_seconds": latency,
            "grounded": validated["grounded_in_actual_data"],
            "evidence": validated["evidence"],
            "is_fallback": (model_used != primary_model),
            "chart_spec": chart_spec,
            "resolved_query": effective_query
        }
