import re


def route_user_question(question: str) -> dict:
    q = question.lower()

    if any(w in q for w in ["forecast", "predict", "next month", "future", "expected", "upcoming", "projection"]):
        intent = "prediction"
    elif any(w in q for w in ["top", "best", "worst", "highest", "lowest", "leading", "most profitable", "least profitable"]):
        intent = "ranking"
    elif any(w in q for w in ["trend", "growth", "decrease", "increase", "over time", "decline", "month", "year", "quarter"]):
        intent = "trend"
    elif any(w in q for w in ["correlat", "relation", "driver", "impact", "depend", "factor"]):
        intent = "correlation"
    elif any(w in q for w in ["outlier", "unusual", "anomaly", "abnormal", "strange", "extreme"]):
        intent = "outliers"
    elif any(w in q for w in ["quality", "missing", "duplicate", "clean", "null", "error"]):
        intent = "quality"
    elif any(w in q for w in ["revenue", "sales", "kpi", "performance", "how is business", "summary", "overview", "total"]):
        intent = "kpis"
    else:
        intent = "general_analysis"

    # Identify entity focus
    entity_focus = None
    if any(w in q for w in ["product", "item", "sku"]):
        entity_focus = "product"
    elif any(w in q for w in ["customer", "client", "buyer"]):
        entity_focus = "customer"
    elif any(w in q for w in ["category", "line", "department"]):
        entity_focus = "category"
    elif any(w in q for w in ["country", "region", "city", "location", "territory"]):
        entity_focus = "location"

    return {
        "intent": intent,
        "entity_focus": entity_focus,
        "raw_question": question
    }
