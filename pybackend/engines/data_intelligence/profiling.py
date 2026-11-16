import pandas as pd
import numpy as np
from .type_detection import detect_column_types


def profile_dataset(df: pd.DataFrame) -> dict:
    types_meta = detect_column_types(df)
    columns_profile = []
    total_rows = len(df)
    total_cols = len(df.columns)
    duplicate_rows = int(df.duplicated().sum()) if total_rows > 0 else 0
    total_cells = total_rows * total_cols
    total_missing_cells = int(df.isna().sum().sum())

    numeric_cols = []
    categorical_cols = []
    datetime_cols = []
    text_cols = []

    quality_alerts = []

    for col in df.columns:
        s = df[col]
        col_type_info = types_meta.get(str(col), {})
        gen_type = col_type_info.get("general_type", "text")

        missing_count = int(s.isna().sum())
        missing_pct = round(float((missing_count / total_rows * 100) if total_rows > 0 else 0), 2)
        unique_count = int(s.nunique(dropna=True))

        col_alerts = []
        if missing_pct > 30:
            col_alerts.append(f"High missingness ({missing_pct}%)")
            quality_alerts.append({
                "column": str(col),
                "severity": "warning",
                "message": f"Column '{col}' has {missing_pct}% missing values."
            })
        if unique_count == 1:
            col_alerts.append("Constant column (only 1 unique value)")
            quality_alerts.append({
                "column": str(col),
                "severity": "critical",
                "message": f"Column '{col}' has zero variance (constant single value)."
            })
        elif unique_count == total_rows and total_rows > 50:
            col_alerts.append("Fully unique identifier candidate")

        col_data = {
            "name": str(col),
            "raw_dtype": str(s.dtype),
            "detected_type": gen_type,
            "sub_type": col_type_info.get("sub_type", ""),
            "semantic_tag": col_type_info.get("semantic_tag", "general"),
            "is_numeric": col_type_info.get("is_numeric", False),
            "is_datetime": col_type_info.get("is_datetime", False),
            "is_categorical": col_type_info.get("is_categorical", False),
            "missing_count": missing_count,
            "missing_percent": missing_pct,
            "unique_count": unique_count,
            "sample_values": [str(x) for x in s.dropna().head(5)],
            "alerts": col_alerts
        }

        # Numeric statistics
        if col_type_info.get("is_numeric", False):
            s_num = pd.to_numeric(s, errors="coerce").dropna()
            if not s_num.empty:
                col_data["stats"] = {
                    "min": float(s_num.min()),
                    "max": float(s_num.max()),
                    "mean": round(float(s_num.mean()), 4),
                    "median": round(float(s_num.median()), 4),
                    "std": round(float(s_num.std()), 4) if len(s_num) > 1 else 0.0,
                    "skew": round(float(s_num.skew()), 4) if len(s_num) > 2 else 0.0
                }
            numeric_cols.append(str(col))
        elif col_type_info.get("is_datetime", False):
            datetime_cols.append(str(col))
        elif col_type_info.get("is_categorical", False):
            categorical_cols.append(str(col))
            # Top categories
            top_vals = s.value_counts(dropna=False).head(5)
            col_data["top_categories"] = [
                {"value": str(k), "count": int(v), "percent": round(v / total_rows * 100, 2)}
                for k, v in top_vals.items()
            ]
        else:
            text_cols.append(str(col))

        columns_profile.append(col_data)

    # Compute overall quality score (100 - penalties)
    missing_ratio = (total_missing_cells / total_cells) if total_cells > 0 else 0
    duplicate_ratio = (duplicate_rows / total_rows) if total_rows > 0 else 0

    score = 100.0 - (missing_ratio * 40.0) - (duplicate_ratio * 20.0)
    # penalty for columns with > 50% missing
    high_missing_cols = sum(1 for c in columns_profile if c["missing_percent"] > 50)
    score -= min(20.0, high_missing_cols * 5.0)
    quality_score = max(10, min(100, round(score, 1)))

    return {
        "total_rows": total_rows,
        "total_columns": total_cols,
        "total_cells": total_cells,
        "missing_cells": total_missing_cells,
        "missing_percentage": round((total_missing_cells / total_cells * 100) if total_cells > 0 else 0, 2),
        "duplicate_rows": duplicate_rows,
        "duplicate_percentage": round((duplicate_rows / total_rows * 100) if total_rows > 0 else 0, 2),
        "quality_score": quality_score,
        "quality_rating": "Excellent" if quality_score >= 85 else "Good" if quality_score >= 70 else "Fair" if quality_score >= 50 else "Needs Attention",
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "datetime_columns": datetime_cols,
        "text_columns": text_cols,
        "columns": columns_profile,
        "alerts": quality_alerts
    }
