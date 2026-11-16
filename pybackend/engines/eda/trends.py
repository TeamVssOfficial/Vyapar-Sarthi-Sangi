import pandas as pd
import numpy as np


def detect_date_columns(df: pd.DataFrame) -> list[str]:
    date_cols = []
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            date_cols.append(str(col))
        elif df[col].dtype == "object":
            name_lower = str(col).lower()
            if any(k in name_lower for k in ["date", "time", "timestamp", "dt", "period", "day", "month", "year"]):
                sample = df[col].dropna().astype(str).head(30)
                parsed = pd.to_datetime(sample, errors="coerce")
                if parsed.notna().mean() >= 0.7:
                    date_cols.append(str(col))
    return date_cols


def compute_time_trends(
    df: pd.DataFrame,
    date_col: str,
    value_col: str,
    frequency: str = "M",
    agg_func: str = "sum"
) -> dict:
    if date_col not in df.columns or value_col not in df.columns:
        return {"error": f"Columns {date_col} or {value_col} not found in dataset"}

    work = df[[date_col, value_col]].copy()
    work[date_col] = pd.to_datetime(work[date_col], errors="coerce")
    work[value_col] = pd.to_numeric(work[value_col], errors="coerce")
    work = work.dropna()

    if work.empty:
        return {"labels": [], "values": [], "message": "No valid datetime and numeric pairs available"}

    work = work.sort_values(by=date_col)
    resampled = work.set_index(date_col)[value_col].resample(frequency)

    if agg_func == "mean":
        series = resampled.mean().dropna()
    elif agg_func == "count":
        series = resampled.count().dropna()
    else:
        series = resampled.sum().dropna()

    labels = [ts.strftime("%Y-%m-%d") for ts in series.index]
    values = [round(float(v), 2) for v in series.values]

    # Growth rate
    growth_rates = []
    for i in range(1, len(values)):
        prev = values[i-1]
        curr = values[i]
        rate = round(((curr - prev) / prev * 100), 2) if prev != 0 else 0.0
        growth_rates.append({"period": labels[i], "growth_pct": rate})

    return {
        "date_column": date_col,
        "value_column": value_col,
        "frequency": frequency,
        "aggregation": agg_func,
        "total_periods": len(labels),
        "labels": labels,
        "values": values,
        "growth_rates": growth_rates
    }
