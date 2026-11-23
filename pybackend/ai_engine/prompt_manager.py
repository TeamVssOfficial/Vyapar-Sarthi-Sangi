"""
Prompt Manager for Vyapar Verse.
Provides system prompts and dataset-grounded context templates.
"""

from typing import Dict, Any, Optional
import pandas as pd


class PromptManager:
    SYSTEM_PROMPT = """You are the Central AI Business Sarthi of Vyapar Verse (Vyapar Sarthi Sangi - VSS AI).
Your mission: Provide senior-executive-grade business intelligence, operational recommendations, financial clarity, and data insights to business founders and operators.

CORE PRINCIPLES:
1. TRUTHFULNESS & NUMERICAL FIDELITY: Never invent, extrapolate, or fabricate business numbers, sales volumes, or metrics. Every number you state must come directly from the authorized dataset context or tool execution results provided to you.
2. PROFESSIONAL TONE: Clear, decisive, concise, and business-focused. Avoid sci-fi jargon, filler words, or empty hype.
3. ACTIONABILITY: After explaining a finding, always offer practical, concrete operational recommendations (e.g., inventory restocking, cost control, margin improvement).
4. CITATION OF EVIDENCE: State the basis of your calculations (e.g., "Calculated across 2,823 transaction rows using 1.5x IQR method").
"""

    @classmethod
    def format_dataset_context(cls, df: Optional[pd.DataFrame] = None, dataset_name: str = "Active Dataset") -> str:
        """Constructs a compact, privacy-safe summary of dataset metadata for grounding."""
        if df is None or df.empty:
            return "No active dataset loaded in the current workspace."

        cols = df.columns.tolist()
        row_count = len(df)
        col_count = len(cols)
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
        missing_count = int(df.isnull().sum().sum())

        sample_preview = df.head(3).to_dict(orient="records")

        return f"""
DATASET PROFILE ({dataset_name}):
- Total Rows: {row_count:,}
- Total Columns: {col_count} ({', '.join(cols[:15])}{'...' if len(cols) > 15 else ''})
- Numeric Columns: {', '.join(numeric_cols[:10])}
- Missing Cells: {missing_count}
- Sample Rows Snapshot: {sample_preview}
"""

    @classmethod
    def build_chat_messages(
        cls,
        user_query: str,
        df: Optional[pd.DataFrame] = None,
        dataset_name: str = "Enterprise Dataset",
        history: Optional[list] = None,
        tool_results: Optional[Dict[str, Any]] = None
    ) -> list:
        """Assembles prompt messages with system grounding, metadata, and history."""
        messages = [
            {"role": "system", "content": cls.SYSTEM_PROMPT}
        ]

        # Add dataset context if available
        if df is not None and not df.empty:
            ctx = cls.format_dataset_context(df, dataset_name)
            messages.append({"role": "system", "content": f"CURRENT AUTHORIZED BUSINESS CONTEXT:\n{ctx}"})

        # Inject tool results if executed
        if tool_results:
            messages.append({
                "role": "system",
                "content": f"VERIFIED COMPUTATIONAL TOOL RESULTS (Deterministic Python Engine):\n{tool_results}"
            })

        # Add past user/assistant turns (up to last 6)
        if history:
            for turn in history[-6:]:
                messages.append({
                    "role": turn.get("role", "user"),
                    "content": turn.get("content", "")
                })

        messages.append({"role": "user", "content": user_query})
        return messages
