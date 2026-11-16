import pandas as pd
import numpy as np


def compute_descriptive_statistics(df: pd.DataFrame) -> dict:
    """
    Computes rigorous statistical measures for all numeric features:
    Count, mean, median, mode, std, var, min, max, 25%, 50%, 75%, 90%, 95%,
    IQR, skewness, kurtosis.
    """
    numeric_df = df.select_dtypes(include=np.number)
    if numeric_df.empty:
        return {"numeric_statistics": {}, "message": "No numeric columns present."}

    stats = {}
    for col in numeric_df.columns:
        s = numeric_df[col].dropna()
        if s.empty:
            continue

        q25 = float(s.quantile(0.25))
        q50 = float(s.quantile(0.50))
        q75 = float(s.quantile(0.75))
        q90 = float(s.quantile(0.90))
        q95 = float(s.quantile(0.95))
        iqr = q75 - q25

        mode_series = s.mode()
        mode_val = float(mode_series.iloc[0]) if not mode_series.empty else None

        stats[str(col)] = {
            "count": int(s.count()),
            "mean": round(float(s.mean()), 4),
            "median": round(q50, 4),
            "mode": round(mode_val, 4) if mode_val is not None else None,
            "std": round(float(s.std()), 4) if len(s) > 1 else 0.0,
            "variance": round(float(s.var()), 4) if len(s) > 1 else 0.0,
            "min": round(float(s.min()), 4),
            "max": round(float(s.max()), 4),
            "p25": round(q25, 4),
            "p50": round(q50, 4),
            "p75": round(q75, 4),
            "p90": round(q90, 4),
            "p95": round(q95, 4),
            "iqr": round(iqr, 4),
            "skewness": round(float(s.skew()), 4) if len(s) > 2 else 0.0,
            "kurtosis": round(float(s.kurtosis()), 4) if len(s) > 3 else 0.0
        }

    return {"numeric_statistics": stats}


def compute_categorical_distributions(df: pd.DataFrame, max_categories: int = 15) -> dict:
    """
    Computes frequency distributions and proportions for categorical variables.
    """
    cat_df = df.select_dtypes(include=["object", "category", "string"])
    distributions = {}

    for col in cat_df.columns:
        s = cat_df[col]
        total_valid = int(s.notna().sum())
        missing_count = int(s.isna().sum())

        counts = s.value_counts(dropna=False).head(max_categories)
        items = []
        for val, cnt in counts.items():
            label = "Missing" if pd.isna(val) else str(val)
            pct = round((cnt / len(s) * 100), 2)
            items.append({"label": label, "count": int(cnt), "percentage": pct})

        distributions[str(col)] = {
            "cardinality": int(s.nunique(dropna=True)),
            "total_records": len(s),
            "missing_count": missing_count,
            "distribution": items
        }

    return distributions


def compute_numerical_distributions(df: pd.DataFrame, bins_count: int = 20) -> dict:
    """
    Generates histogram bin counts and ranges for numeric variables.
    """
    numeric_df = df.select_dtypes(include=np.number)
    histograms = {}

    for col in numeric_df.columns:
        s = numeric_df[col].dropna()
        if s.empty or s.nunique() <= 1:
            continue

        counts, bin_edges = np.histogram(s, bins=min(bins_count, max(5, s.nunique())))
        bins_data = []
        for i in range(len(counts)):
            bins_data.append({
                "range_min": round(float(bin_edges[i]), 2),
                "range_max": round(float(bin_edges[i+1]), 2),
                "count": int(counts[i]),
                "label": f"{round(float(bin_edges[i]), 1)} - {round(float(bin_edges[i+1]), 1)}"
            })

        histograms[str(col)] = bins_data

    return histograms
