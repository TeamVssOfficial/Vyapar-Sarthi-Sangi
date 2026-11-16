import pandas as pd
import numpy as np


def detect_outliers(df: pd.DataFrame) -> dict:
    numeric_df = df.select_dtypes(include=np.number)
    outliers_report = {}
    summary_total_outliers = 0

    for col in numeric_df.columns:
        s = numeric_df[col].dropna()
        if s.empty or s.nunique() <= 3:
            continue

        q25 = float(s.quantile(0.25))
        q75 = float(s.quantile(0.75))
        iqr = q75 - q25

        if iqr == 0:
            continue

        lower_bound = q25 - (1.5 * iqr)
        upper_bound = q75 + (1.5 * iqr)
        extreme_lower = q25 - (3.0 * iqr)
        extreme_upper = q75 + (3.0 * iqr)

        outlier_mask = (s < lower_bound) | (s > upper_bound)
        extreme_mask = (s < extreme_lower) | (s > extreme_upper)

        outlier_count = int(outlier_mask.sum())
        extreme_count = int(extreme_mask.sum())
        outlier_pct = round((outlier_count / len(s) * 100), 2)

        if outlier_count > 0:
            summary_total_outliers += outlier_count
            outlier_samples = s[outlier_mask].head(6).tolist()
            outliers_report[str(col)] = {
                "lower_bound": round(lower_bound, 4),
                "upper_bound": round(upper_bound, 4),
                "q25": round(q25, 4),
                "q75": round(q75, 4),
                "iqr": round(iqr, 4),
                "outlier_count": outlier_count,
                "outlier_percentage": outlier_pct,
                "extreme_outlier_count": extreme_count,
                "sample_outlier_values": [round(float(x), 2) for x in outlier_samples]
            }

    return {
        "columns_with_outliers": len(outliers_report),
        "total_outlier_points": summary_total_outliers,
        "details": outliers_report
    }
