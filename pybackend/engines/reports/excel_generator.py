import pandas as pd
from pathlib import Path


def generate_excel_report(
    output_path: Path,
    df: pd.DataFrame,
    profile_data: dict,
    kpis_data: dict
) -> Path:
    """
    Generates a structured multi-tab Excel workbook.
    """
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        # Sheet 1: Dataset Summary
        summary_rows = [
            {"Metric": "Total Rows", "Value": profile_data.get("total_rows", len(df))},
            {"Metric": "Total Columns", "Value": profile_data.get("total_columns", len(df.columns))},
            {"Metric": "Data Quality Score", "Value": f"{profile_data.get('quality_score', 0)}/100 ({profile_data.get('quality_rating', '')})"},
            {"Metric": "Missing Cells Count", "Value": profile_data.get("missing_cells", 0)},
            {"Metric": "Missing Percentage", "Value": f"{profile_data.get('missing_percentage', 0)}%"},
            {"Metric": "Duplicate Rows", "Value": profile_data.get("duplicate_rows", 0)},
            {"Metric": "Numeric Columns Count", "Value": len(profile_data.get("numeric_columns", []))},
            {"Metric": "Categorical Columns Count", "Value": len(profile_data.get("categorical_columns", []))},
            {"Metric": "Datetime Columns Count", "Value": len(profile_data.get("datetime_columns", []))}
        ]
        pd.DataFrame(summary_rows).to_excel(writer, sheet_name="Dataset Summary", index=False)

        # Sheet 2: Column Details
        cols = profile_data.get("columns", [])
        if cols:
            col_rows = []
            for c in cols:
                col_rows.append({
                    "Column Name": c.get("name"),
                    "Detected Type": c.get("detected_type"),
                    "Sub Type": c.get("sub_type"),
                    "Semantic Tag": c.get("semantic_tag"),
                    "Missing Count": c.get("missing_count"),
                    "Missing %": c.get("missing_percent"),
                    "Unique Count": c.get("unique_count")
                })
            pd.DataFrame(col_rows).to_excel(writer, sheet_name="Column Profiles", index=False)

        # Sheet 3: Descriptive Statistics
        numeric_df = df.select_dtypes(include="number")
        if not numeric_df.empty:
            stats_df = numeric_df.describe().T.reset_index()
            stats_df.rename(columns={"index": "Column Name"}, inplace=True)
            stats_df.to_excel(writer, sheet_name="Descriptive Stats", index=False)

        # Sheet 4: Business KPIs & Category Breakdown
        cats = kpis_data.get("category_breakdown", [])
        if cats:
            pd.DataFrame(cats).to_excel(writer, sheet_name="Category Revenue", index=False)

        # Sheet 5: Data Preview (Top 100 rows)
        df.head(100).to_excel(writer, sheet_name="Data Preview", index=False)

    return output_path
