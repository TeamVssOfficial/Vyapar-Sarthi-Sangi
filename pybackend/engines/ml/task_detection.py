import pandas as pd
import numpy as np


def detect_ml_tasks(df: pd.DataFrame) -> dict:
    """
    Scans dataset schema and variance to suggest statistically viable ML tasks.
    """
    suggestions = []
    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category", "string"]).columns.tolist()

    # Find candidate date column
    date_cols = []
    for c in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[c]):
            date_cols.append(str(c))
        elif df[c].dtype == "object" and any(k in str(c).lower() for k in ["date", "time", "dt"]):
            sample = pd.to_datetime(df[c].dropna().head(20), errors="coerce")
            if sample.notna().mean() >= 0.7:
                date_cols.append(str(c))

    # 1. Regression tasks (Continuous numeric targets with > 20 unique values)
    for c in numeric_cols:
        s = df[c].dropna()
        if s.nunique() > 20 and not any(k in str(c).lower() for k in ["id", "number", "code", "zip", "phone", "year", "month"]):
            name_lower = str(c).lower()
            is_business_measure = any(k in name_lower for k in ["sale", "revenue", "price", "profit", "amount", "total", "cost", "msrp", "quantity"])
            suggestions.append({
                "task_type": "regression",
                "target_column": str(c),
                "title": f"Predict {c} (Regression)",
                "description": f"Predict continuous numerical values for '{c}' based on transaction & customer attributes.",
                "confidence": "High" if is_business_measure else "Medium",
                "recommended_algorithms": ["RandomForestRegressor", "GradientBoostingRegressor"],
                "target_unique_values": int(s.nunique())
            })

    # 2. Classification tasks (Categorical or discrete targets with 2 to 10 classes)
    for c in cat_cols:
        s = df[c].dropna()
        n_unique = s.nunique()
        if 2 <= n_unique <= 10 and not any(k in str(c).lower() for k in ["id", "code", "date", "phone", "address", "zip", "name"]):
            suggestions.append({
                "task_type": "classification",
                "target_column": str(c),
                "title": f"Classify {c} ({n_unique} Classes)",
                "description": f"Classify records into '{c}' categories: {', '.join([str(x) for x in s.unique()[:4]])}{'...' if n_unique > 4 else ''}.",
                "confidence": "High" if any(k in str(c).lower() for k in ["status", "tier", "deal", "size", "segment", "risk"]) else "Medium",
                "recommended_algorithms": ["RandomForestClassifier", "LogisticRegression"],
                "classes": [str(x) for x in s.unique()[:10]]
            })

    # 3. Forecasting tasks (If date and business metric exist)
    if date_cols and numeric_cols:
        date_c = date_cols[0]
        for c in numeric_cols:
            if any(k in str(c).lower() for k in ["sale", "revenue", "quantity", "amount", "units", "total"]):
                suggestions.append({
                    "task_type": "forecasting",
                    "target_column": str(c),
                    "date_column": date_c,
                    "title": f"Time-Series Forecast for {c}",
                    "description": f"Forecast future period trends for '{c}' over time using '{date_c}'.",
                    "confidence": "High",
                    "recommended_algorithms": ["Chronological Random Forest with Lag Features", "Exponential Smoothing"]
                })
                break

    # 4. Clustering / Customer Segmentation (Unsupervised)
    cust_cols = [c for c in cat_cols if any(k in str(c).lower() for k in ["customer", "client", "buyer", "account"])]
    if cust_cols and numeric_cols:
        suggestions.append({
            "task_type": "clustering",
            "target_column": None,
            "entity_column": cust_cols[0],
            "title": f"Customer Segmentation on {cust_cols[0]}",
            "description": f"Segment accounts into behavioral clusters based on recency, frequency, and monetary spending.",
            "confidence": "High",
            "recommended_algorithms": ["K-Means Clustering", "RFM Segmentation"]
        })

    # 5. Anomaly Detection
    if len(numeric_cols) >= 2:
        suggestions.append({
            "task_type": "anomaly_detection",
            "target_column": None,
            "title": "Unsupervised Transaction Anomaly Detection",
            "description": "Identify fraudulent, erroneous, or extreme atypical business transactions using multivariate isolation.",
            "confidence": "High",
            "recommended_algorithms": ["IsolationForest"]
        })

    return {
        "dataset_rows": len(df),
        "total_suggestions": len(suggestions),
        "suggestions": suggestions,
        "date_columns_detected": date_cols
    }
