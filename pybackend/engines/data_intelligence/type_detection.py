import pandas as pd
import numpy as np
import re


def detect_column_types(df: pd.DataFrame) -> dict:
    """
    Intelligently inspects each column to determine its statistical and semantic role:
    - numeric (integer, float)
    - datetime
    - categorical
    - text
    - boolean
    - identifier
    - semantic tags (currency, location, date, status, identifier)
    """
    result = {}

    for col in df.columns:
        s = df[col].dropna()
        col_str = str(col).lower()
        total_non_null = len(s)

        if total_non_null == 0:
            result[str(col)] = {
                "general_type": "empty",
                "sub_type": "all_null",
                "is_numeric": False,
                "is_datetime": False,
                "is_categorical": False,
                "semantic_tag": "unknown"
            }
            continue

        # Check boolean
        if pd.api.types.is_bool_dtype(s) or (s.nunique() <= 2 and set(s.astype(str).str.lower()).issubset({"true", "false", "0", "1", "yes", "no"})):
            result[str(col)] = {
                "general_type": "boolean",
                "sub_type": "boolean",
                "is_numeric": False,
                "is_datetime": False,
                "is_categorical": True,
                "semantic_tag": "flag"
            }
            continue

        # Check if already parsed datetime
        if pd.api.types.is_datetime64_any_dtype(s):
            result[str(col)] = {
                "general_type": "datetime",
                "sub_type": "datetime64",
                "is_numeric": False,
                "is_datetime": True,
                "is_categorical": False,
                "semantic_tag": "date_time"
            }
            continue

        # Check numeric
        if pd.api.types.is_numeric_dtype(s):
            unique_count = s.nunique()
            # If numeric has very few unique integers, could be categorical code (e.g. QTR_ID, MONTH_ID)
            is_cat_code = (
                pd.api.types.is_integer_dtype(s)
                and unique_count <= 12
                and any(k in col_str for k in ["qtr", "quarter", "month", "code", "status", "tier", "cluster"])
            )
            # Check ID
            is_id = (
                unique_count == len(df)
                or any(k in col_str for k in ["id", "order_number", "ordernumber", "key", "uuid", "num"])
            ) and unique_count > 50

            semantic = "measure"
            if any(k in col_str for k in ["sale", "revenue", "price", "amount", "total", "cost", "msrp", "profit", "fee"]):
                semantic = "financial"
            elif any(k in col_str for k in ["qty", "quantity", "count", "units", "items"]):
                semantic = "quantity"
            elif any(k in col_str for k in ["discount", "rate", "percent", "margin", "ratio"]):
                semantic = "rate"
            elif is_id:
                semantic = "identifier"

            result[str(col)] = {
                "general_type": "numeric",
                "sub_type": "integer" if pd.api.types.is_integer_dtype(s) else "float",
                "is_numeric": True,
                "is_datetime": False,
                "is_categorical": bool(is_cat_code),
                "semantic_tag": semantic
            }
            continue

        # Check for potential Datetime string format
        is_date_named = any(k in col_str for k in ["date", "time", "timestamp", "period", "dt", "year", "month", "day"])
        parsed_success = False
        if is_date_named or s.dtype == "object":
            sample_strs = s.astype(str).head(50)
            try:
                # Test datetime conversion
                converted = pd.to_datetime(sample_strs, errors="coerce")
                ratio = converted.notna().mean()
                if ratio >= 0.80:
                    parsed_success = True
            except Exception:
                parsed_success = False

        if parsed_success:
            result[str(col)] = {
                "general_type": "datetime",
                "sub_type": "datetime_string",
                "is_numeric": False,
                "is_datetime": True,
                "is_categorical": False,
                "semantic_tag": "date_time"
            }
            continue

        # Object / Categorical / Text
        unique_count = s.nunique()
        ratio_unique = unique_count / total_non_null

        # Semantic detection for text
        semantic = "category"
        if any(k in col_str for k in ["country", "city", "state", "territory", "postal", "zip", "address"]):
            semantic = "geographic"
        elif any(k in col_str for k in ["name", "customer", "contact", "person", "client"]):
            semantic = "entity_name"
        elif any(k in col_str for k in ["status", "stage", "dealsize", "deal_size", "category", "productline", "line"]):
            semantic = "status_category"
        elif any(k in col_str for k in ["phone", "email", "url", "link"]):
            semantic = "contact_info"

        if unique_count <= max(30, int(total_non_null * 0.05)):
            result[str(col)] = {
                "general_type": "categorical",
                "sub_type": "low_cardinality_category",
                "is_numeric": False,
                "is_datetime": False,
                "is_categorical": True,
                "semantic_tag": semantic
            }
        elif ratio_unique > 0.85 and total_non_null > 20:
            result[str(col)] = {
                "general_type": "text",
                "sub_type": "unique_identifier",
                "is_numeric": False,
                "is_datetime": False,
                "is_categorical": False,
                "semantic_tag": "identifier"
            }
        else:
            result[str(col)] = {
                "general_type": "text",
                "sub_type": "high_cardinality_text",
                "is_numeric": False,
                "is_datetime": False,
                "is_categorical": False,
                "semantic_tag": semantic
            }

    return result
