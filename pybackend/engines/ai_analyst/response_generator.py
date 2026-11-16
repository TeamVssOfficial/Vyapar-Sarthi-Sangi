import os
import json
import httpx
from config import settings


def generate_analyst_response(question: str, routing: dict, analytical_data: dict) -> dict:
    """
    Synthesizes numerical proof and natural language reasoning.
    If OPENAI_API_KEY is configured, queries the LLM with grounded facts;
    otherwise generates an expert deterministic analytical report.
    """
    openai_key = os.getenv("OPENAI_API_KEY") or settings.OPENAI_API_KEY

    t_type = analytical_data["type"]
    title = analytical_data["title"]
    data = analytical_data["data"]

    # Grounded narrative builder
    answer_text = ""
    suggested_actions = []
    chart_payload = None

    if t_type == "kpis":
        rev = data.get("total_revenue", 0)
        orders = data.get("total_transactions", 0)
        aov = data.get("average_order_value", 0)
        answer_text = (
            f"### Business Performance Overview\n\n"
            f"- **Total Revenue / Volume:** ₹{rev:,.2f} across **{orders:,}** transactions.\n"
            f"- **Average Order Value (AOV):** ₹{aov:,.2f}.\n"
            f"- **Transaction Dynamics:** Median deal value is ₹{data.get('median_transaction_value', 0):,.2f} "
            f"with a maximum single transaction of ₹{data.get('max_transaction_value', 0):,.2f}."
        )
        if "total_profit" in data:
            answer_text += f"\n- **Total Net Profit:** ₹{data['total_profit']:,.2f} (Profit Margin: **{data.get('profit_margin_pct', 0)}%**)."

        suggested_actions = [
            "Monitor weekly transaction velocity against historical benchmarks.",
            "Identify deals above median transaction value to focus high-tier account retention."
        ]

    elif t_type in ["product_ranking", "category_ranking", "customer_ranking"]:
        answer_text = f"### {title}\n\nBased on historical transaction data, here are the top contributors:\n\n"
        if isinstance(data, list):
            for idx, item in enumerate(data, 1):
                name = item.get("product") or item.get("category") or item.get("customer") or "Unknown"
                rev = item.get("revenue", 0)
                orders = item.get("orders_count") or item.get("transactions") or 0
                answer_text += f"{idx}. **{name}**: ₹{rev:,.2f} ({orders} transactions)\n"

        suggested_actions = [
            "Prioritize inventory allocation and marketing budget on top revenue drivers.",
            "Establish loyalty or volume incentive programs for leading commercial accounts."
        ]

    elif t_type == "time_trend":
        if isinstance(data, list) and data:
            first_p = data[0]
            last_p = data[-1]
            answer_text = (
                f"### Revenue Trajectory Analysis\n\n"
                f"- Analysis spans **{len(data)} periods** from **{first_p['period']}** (₹{first_p['revenue']:,.2f}) "
                f"to **{last_p['period']}** (₹{last_p['revenue']:,.2f}).\n"
                f"- Peak revenue recorded was ₹{max(p['revenue'] for p in data):,.2f}."
            )
            suggested_actions = [
                "Investigate cyclical or seasonal dips identified in historical revenue.",
                "Align procurement cycles with predictable quarterly demand surges."
            ]
        else:
            answer_text = "No consistent longitudinal time points were detected in the current dataset."

    elif t_type == "correlations":
        answer_text = f"### Statistical Drivers & Feature Relationships\n\n"
        if isinstance(data, list) and data:
            for item in data:
                answer_text += f"- **{item['col1']}** ↔ **{item['col2']}**: Correlation of **{item['correlation']}** ({item['relationship']}).\n"
            suggested_actions = [
                "Leverage highly correlated variables as baseline indicators for demand forecasts.",
                "Ensure independent variables are not collinear before training predictive models."
            ]
        else:
            answer_text += "No strong multi-variable correlations (|r| >= 0.4) were detected."

    elif t_type == "outliers":
        tot = data.get("total_outlier_points", 0)
        cols = data.get("columns_with_outliers", 0)
        answer_text = (
            f"### Outlier & Anomaly Detection\n\n"
            f"Detected **{tot} unusual data points** across **{cols} numeric columns**.\n"
            f"These points deviate significantly beyond 1.5× the Interquartile Range (IQR)."
        )
        suggested_actions = [
            "Audit high-value outlier transactions to verify whether they represent institutional orders or clerical data entry errors.",
            "Consider winsorizing or isolating extreme values before fine-tuning sensitive regression algorithms."
        ]

    elif t_type == "prediction":
        answer_text = f"### {title}\n\nUsing an autoregressive machine learning model trained on historical periodicity:\n\n"
        if isinstance(data, list):
            for item in data:
                answer_text += f"- **{item['period']}**: Projected ₹{item['forecasted_value']:,.2f} (90% Confidence Interval: ₹{item['lower_confidence_90']:,.2f} – ₹{item['upper_confidence_90']:,.2f})\n"
        suggested_actions = [
            "Ensure operational capacity can accommodate projected volume.",
            "Recalibrate model monthly as new realized invoice data is logged."
        ]

    elif t_type == "prediction_limitation":
        answer_text = f"### Forecast Limitation\n\n{data}"
        suggested_actions = [
            "Upload an updated dataset containing transaction timestamps or date columns."
        ]

    else:
        answer_text = (
            f"### Business Analysis\n\n"
            f"Dataset contains {data.get('total_transactions', 0)} recorded entries with total volume of ₹{data.get('total_revenue', 0):,.2f}."
        )

    # Optional LLM polish if OpenAI key available
    if openai_key and len(openai_key) > 10:
        try:
            prompt = (
                f"You are the senior VSS AI Business Analyst. Answer the user question accurately based STRICTLY on the data below.\n"
                f"Do not invent facts or numbers. Maintain an executive, concise tone.\n\n"
                f"DATA:\n{json.dumps(analytical_data, default=str)}\n\n"
                f"USER QUESTION: {question}\n\n"
                f"Provide: 1. Executive Summary, 2. Key Findings with exact numbers, 3. Strategic Recommendations."
            )
            with httpx.Client(timeout=10) as client:
                resp = client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.2
                    }
                )
                if resp.status_code == 200:
                    answer_text = resp.json()["choices"][0]["message"]["content"]
        except Exception:
            # Fall back safely to deterministic analytical response
            pass

    return {
        "title": title,
        "answer": answer_text,
        "suggested_actions": suggested_actions,
        "evidence_data": analytical_data
    }
