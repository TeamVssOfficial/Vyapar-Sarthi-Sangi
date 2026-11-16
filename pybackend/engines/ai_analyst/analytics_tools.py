import pandas as pd
from engines.bi.kpi_calculator import calculate_business_kpis
from engines.eda.correlation import compute_correlations
from engines.eda.outliers import detect_outliers
from engines.data_intelligence.profiling import profile_dataset
from engines.ml.training import train_forecasting_model


def execute_analytical_tool(df: pd.DataFrame, routing: dict) -> dict:
    intent = routing["intent"]
    focus = routing.get("entity_focus")

    kpis = calculate_business_kpis(df)

    if intent == "kpis":
        return {
            "type": "kpis",
            "title": "Business Performance Summary",
            "data": kpis["headline_metrics"],
            "category_breakdown": kpis.get("category_breakdown", [])[:5]
        }

    elif intent == "ranking":
        if focus == "customer" and kpis.get("customer_performance"):
            return {
                "type": "customer_ranking",
                "title": "Top Performing Customers",
                "data": kpis["customer_performance"][:5]
            }
        elif focus == "category" and kpis.get("category_breakdown"):
            return {
                "type": "category_ranking",
                "title": "Revenue by Product Category",
                "data": kpis["category_breakdown"][:5]
            }
        elif kpis.get("product_performance"):
            return {
                "type": "product_ranking",
                "title": "Top Performing Products",
                "data": kpis["product_performance"][:5]
            }
        elif kpis.get("category_breakdown"):
            return {
                "type": "category_ranking",
                "title": "Category Performance",
                "data": kpis["category_breakdown"][:5]
            }
        else:
            return {
                "type": "general",
                "title": "Performance Summary",
                "data": kpis["headline_metrics"]
            }

    elif intent == "trend":
        time_data = kpis.get("time_performance", [])
        return {
            "type": "time_trend",
            "title": "Historical Monthly Revenue Trend",
            "data": time_data
        }

    elif intent == "correlation":
        corr = compute_correlations(df)
        return {
            "type": "correlations",
            "title": "Key Feature Relationships & Drivers",
            "data": corr["top_correlations"][:5]
        }

    elif intent == "outliers":
        outliers = detect_outliers(df)
        return {
            "type": "outliers",
            "title": "Transaction Outliers & Atypical Patterns",
            "data": outliers
        }

    elif intent == "quality":
        prof = profile_dataset(df)
        return {
            "type": "quality",
            "title": "Data Health and Quality Overview",
            "data": {
                "quality_score": prof["quality_score"],
                "quality_rating": prof["quality_rating"],
                "missing_percentage": prof["missing_percentage"],
                "duplicate_rows": prof["duplicate_rows"],
                "alerts": prof["alerts"]
            }
        }

    elif intent == "prediction":
        m = kpis["mapping_used"]
        date_col = m.get("date")
        val_col = m.get("revenue") or m.get("sales")
        if date_col and val_col:
            try:
                forecast_res = train_forecasting_model(df, date_column=date_col, target_column=val_col, forecast_horizon=3)
                return {
                    "type": "prediction",
                    "title": f"3-Month Projected Outlook for {val_col}",
                    "data": forecast_res["forecast"]
                }
            except Exception as e:
                return {
                    "type": "prediction_limitation",
                    "title": "Projection Limitation",
                    "data": f"Unable to generate mathematical forecast: {str(e)}"
                }
        else:
            return {
                "type": "prediction_limitation",
                "title": "Missing Chronological Data",
                "data": "Dataset lacks an explicit date dimension to establish historical velocity for time-series forecasting."
            }

    # Default
    return {
        "type": "overview",
        "title": "General Business Snapshot",
        "data": kpis["headline_metrics"]
    }
