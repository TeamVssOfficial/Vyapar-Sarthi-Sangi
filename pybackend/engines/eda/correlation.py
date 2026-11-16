import pandas as pd
import numpy as np


def compute_correlations(df: pd.DataFrame) -> dict:
    numeric_df = df.select_dtypes(include=np.number)
    cols = numeric_df.columns.tolist()

    if len(cols) < 2:
        return {
            "has_correlation": False,
            "message": "At least two numeric columns are required to calculate correlations.",
            "columns": cols,
            "matrix": {},
            "top_correlations": []
        }

    corr_df = numeric_df.corr(method="pearson").round(4)
    matrix_dict = corr_df.replace({np.nan: 0.0}).to_dict()

    # Extract ranked pairs
    pairs = []
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            col1 = cols[i]
            col2 = cols[j]
            r = corr_df.loc[col1, col2]
            if pd.notna(r):
                abs_r = abs(float(r))
                relationship = (
                    "Strong Positive" if r >= 0.7
                    else "Moderate Positive" if r >= 0.4
                    else "Weak Positive" if r > 0.1
                    else "Strong Negative" if r <= -0.7
                    else "Moderate Negative" if r <= -0.4
                    else "Weak Negative" if r < -0.1
                    else "None"
                )
                pairs.append({
                    "col1": str(col1),
                    "col2": str(col2),
                    "correlation": round(float(r), 4),
                    "abs_correlation": round(abs_r, 4),
                    "relationship": relationship
                })

    pairs.sort(key=lambda x: x["abs_correlation"], reverse=True)

    return {
        "has_correlation": True,
        "columns": [str(c) for c in cols],
        "matrix": matrix_dict,
        "top_correlations": pairs[:15]
    }
