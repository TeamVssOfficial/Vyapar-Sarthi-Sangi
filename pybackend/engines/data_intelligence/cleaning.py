import pandas as pd
import numpy as np


def generate_cleaning_recommendations(df: pd.DataFrame) -> list[dict]:
    recommendations = []
    total_rows = len(df)

    # 1. Duplicate check
    dup_count = int(df.duplicated().sum())
    if dup_count > 0:
        recommendations.append({
            "id": "drop_duplicates",
            "action": "Drop exact duplicates",
            "target": "Entire dataset",
            "reason": f"Found {dup_count} identical row(s). Removing them prevents artificial bias in business KPIs.",
            "impact": f"Removes {dup_count} row(s) ({round(dup_count/total_rows*100, 1)}%)",
            "is_recommended": True,
            "category": "deduplication"
        })

    # 2. Text whitespace check
    text_cols = list(df.select_dtypes(include=["object", "string"]).columns)
    untrimmed_cols = []
    for c in text_cols:
        sample = df[c].dropna().astype(str)
        if (sample != sample.str.strip()).any():
            untrimmed_cols.append(str(c))

    if untrimmed_cols:
        recommendations.append({
            "id": "trim_whitespace",
            "action": "Trim leading & trailing whitespace",
            "target": f"{len(untrimmed_cols)} column(s): {', '.join(untrimmed_cols[:3])}{'...' if len(untrimmed_cols) > 3 else ''}",
            "reason": "Inconsistent whitespace causes duplicate category groupings (e.g., 'Retail ' vs 'Retail').",
            "impact": "Harmonizes string values and eliminates false distinct categories.",
            "is_recommended": True,
            "category": "formatting"
        })

    # 3. High missingness column check
    for col in df.columns:
        missing_count = int(df[col].isna().sum())
        missing_pct = missing_count / total_rows * 100
        if missing_pct >= 60:
            recommendations.append({
                "id": f"drop_col_{col}",
                "action": f"Drop column '{col}'",
                "target": str(col),
                "reason": f"Column has {round(missing_pct, 1)}% missing values ({missing_count}/{total_rows} empty cells).",
                "impact": f"Removes 1 sparse column with insufficient data for modeling.",
                "is_recommended": missing_pct >= 80,
                "category": "drop_column"
            })
        elif 0 < missing_pct < 60:
            if pd.api.types.is_numeric_dtype(df[col]):
                recommendations.append({
                    "id": f"impute_num_{col}",
                    "action": f"Impute missing values in '{col}'",
                    "target": str(col),
                    "reason": f"Contains {missing_count} missing values ({round(missing_pct, 1)}%).",
                    "impact": "Imputes with column median to preserve distribution without skewing outliers.",
                    "is_recommended": True,
                    "category": "imputation",
                    "suggested_strategy": "median"
                })
            else:
                recommendations.append({
                    "id": f"impute_cat_{col}",
                    "action": f"Impute missing categories in '{col}'",
                    "target": str(col),
                    "reason": f"Contains {missing_count} missing values ({round(missing_pct, 1)}%).",
                    "impact": "Replaces missing categories with 'Unknown' to retain row records.",
                    "is_recommended": True,
                    "category": "imputation",
                    "suggested_strategy": "Unknown"
                })

    # 4. Outlier & anomaly check (IQR 1.5x)
    from engines.eda.outliers import detect_outliers
    try:
        outliers_info = detect_outliers(df)
        total_pts = outliers_info.get("total_outlier_points", 0)
        col_count = outliers_info.get("columns_with_outliers", 0)
        if total_pts > 0:
            recommendations.append({
                "id": "remove_outliers",
                "action": f"Remove or Cap {total_pts} Outliers",
                "target": f"{col_count} numeric column(s)",
                "reason": f"Identified {total_pts} statistical outliers outside 1.5× IQR fences across {col_count} columns.",
                "impact": f"Filters or winsorizes extreme anomalies to prevent bias in predictive models and BI metrics.",
                "is_recommended": True,
                "category": "outlier_removal",
                "suggested_strategy": "drop"
            })
    except Exception:
        pass

    return recommendations


def apply_cleaning(df: pd.DataFrame, options: dict) -> tuple[pd.DataFrame, dict]:
    """
    Applies user-selected cleaning actions safely to a copy of the dataframe.
    """
    cleaned = df.copy()
    rows_before = len(cleaned)
    cols_before = len(cleaned.columns)
    actions_performed = []

    # 1. Drop duplicates
    if options.get("drop_duplicates", True):
        dup_before = int(cleaned.duplicated().sum())
        if dup_before > 0:
            cleaned = cleaned.drop_duplicates().copy()
            actions_performed.append(f"Removed {dup_before} duplicate rows.")

    # 2. Trim whitespace
    if options.get("trim_whitespace", True):
        trimmed_count = 0
        for c in cleaned.select_dtypes(include=["object", "string"]).columns:
            cleaned[c] = cleaned[c].map(lambda x: x.strip() if isinstance(x, str) else x)
            trimmed_count += 1
        if trimmed_count > 0:
            actions_performed.append(f"Trimmed whitespace across {trimmed_count} string columns.")

    # 3. Drop specific columns
    cols_to_drop = options.get("drop_columns", [])
    if cols_to_drop:
        existing_drop = [c for c in cols_to_drop if c in cleaned.columns]
        if existing_drop:
            cleaned = cleaned.drop(columns=existing_drop)
            actions_performed.append(f"Dropped {len(existing_drop)} columns: {', '.join(existing_drop)}.")

    # 4. Impute numeric columns
    num_strategy = options.get("fill_numeric_strategy", "median")
    if num_strategy in ["median", "mean", "zero"]:
        num_cols = cleaned.select_dtypes(include=np.number).columns
        for c in num_cols:
            if cleaned[c].isna().any():
                if num_strategy == "median":
                    val = cleaned[c].median()
                elif num_strategy == "mean":
                    val = cleaned[c].mean()
                else:
                    val = 0
                cleaned[c] = cleaned[c].fillna(val)
                actions_performed.append(f"Imputed missing numbers in '{c}' using {num_strategy} ({round(float(val), 2)}).")

    # 5. Impute categorical columns
    cat_strategy = options.get("fill_categorical_strategy", "unknown")
    if cat_strategy and cat_strategy != "none":
        cat_cols = cleaned.select_dtypes(include=["object", "category", "string"]).columns
        for c in cat_cols:
            if cleaned[c].isna().any():
                if cat_strategy == "mode":
                    mode_val = cleaned[c].mode()
                    val = mode_val.iloc[0] if not mode_val.empty else "Unknown"
                else:
                    val = "Unknown"
                cleaned[c] = cleaned[c].fillna(val)
                actions_performed.append(f"Filled missing categories in '{c}' with '{val}'.")

    # 6. Outlier handling (IQR Fences)
    outlier_strategy = options.get("outlier_strategy", "none")
    if outlier_strategy in ["drop", "cap", "remove", "winsorize"]:
        target_cols = options.get("outlier_columns", [])
        num_cols = list(cleaned.select_dtypes(include=np.number).columns)
        if not target_cols:
            target_cols = num_cols
        else:
            target_cols = [c for c in target_cols if c in num_cols]

        multiplier = float(options.get("iqr_multiplier", 1.5))

        if outlier_strategy in ["drop", "remove"]:
            outlier_row_mask = pd.Series(False, index=cleaned.index)
            cols_affected = []
            for c in target_cols:
                s = cleaned[c].dropna()
                if s.empty or s.nunique() <= 3:
                    continue
                q25 = float(s.quantile(0.25))
                q75 = float(s.quantile(0.75))
                iqr = q75 - q25
                if iqr > 0:
                    lb = q25 - (multiplier * iqr)
                    ub = q75 + (multiplier * iqr)
                    col_outliers = (cleaned[c] < lb) | (cleaned[c] > ub)
                    if col_outliers.any():
                        outlier_row_mask = outlier_row_mask | col_outliers
                        cols_affected.append(c)

            outlier_rows_dropped = int(outlier_row_mask.sum())
            if outlier_rows_dropped > 0:
                cleaned = cleaned[~outlier_row_mask].copy()
                actions_performed.append(
                    f"Removed {outlier_rows_dropped} outlier row(s) outside {multiplier}× IQR bounds across {len(cols_affected)} column(s): {', '.join(cols_affected[:5])}."
                )
        elif outlier_strategy in ["cap", "winsorize"]:
            capped_points = 0
            cols_affected = []
            for c in target_cols:
                s = cleaned[c].dropna()
                if s.empty or s.nunique() <= 3:
                    continue
                q25 = float(s.quantile(0.25))
                q75 = float(s.quantile(0.75))
                iqr = q75 - q25
                if iqr > 0:
                    lb = q25 - (multiplier * iqr)
                    ub = q75 + (multiplier * iqr)
                    pts = int(((cleaned[c] < lb) | (cleaned[c] > ub)).sum())
                    if pts > 0:
                        cleaned[c] = cleaned[c].clip(lower=lb, upper=ub)
                        capped_points += pts
                        cols_affected.append(c)
            if capped_points > 0:
                actions_performed.append(
                    f"Winsorized/Capped {capped_points} outlier value(s) to {multiplier}× IQR boundaries across {len(cols_affected)} column(s): {', '.join(cols_affected[:5])}."
                )

    summary = {
        "rows_before": rows_before,
        "rows_after": len(cleaned),
        "columns_before": cols_before,
        "columns_after": len(cleaned.columns),
        "missing_values_remaining": int(cleaned.isna().sum().sum()),
        "actions_performed": actions_performed
    }

    return cleaned, summary
