import pandas as pd
import numpy as np
from .field_mapper import detect_business_mapping


def calculate_business_kpis(df: pd.DataFrame, user_mapping: dict | None = None) -> dict:
    meta = detect_business_mapping(df, user_mapping)
    mapping = meta["mapping"]
    capabilities = meta["capabilities"]

    kpis = {
        "headline_metrics": {},
        "category_breakdown": [],
        "product_performance": [],
        "customer_performance": [],
        "geographic_breakdown": [],
        "time_performance": [],
        "capabilities": capabilities,
        "mapping_used": mapping
    }

    # Metric column (prefer revenue, fallback to sales, fallback to first numeric)
    val_col = mapping["revenue"] or mapping["sales"]
    if not val_col:
        num_cols = df.select_dtypes(include=np.number).columns
        if not num_cols.empty:
            val_col = num_cols[0]

    if not val_col:
        return kpis

    s_val = pd.to_numeric(df[val_col], errors="coerce").dropna()
    total_val = float(s_val.sum())
    avg_val = float(s_val.mean())

    total_orders = len(df)
    order_col = mapping["order_id"]
    if order_col and order_col in df.columns:
        total_orders = int(df[order_col].nunique())

    aov = (total_val / total_orders) if total_orders > 0 else avg_val

    kpis["headline_metrics"] = {
        "primary_metric_name": val_col,
        "total_revenue": round(total_val, 2),
        "total_transactions": total_orders,
        "average_order_value": round(aov, 2),
        "median_transaction_value": round(float(s_val.median()), 2),
        "max_transaction_value": round(float(s_val.max()), 2)
    }

    # Quantity metric
    qty_col = mapping["quantity"]
    if qty_col and qty_col in df.columns:
        s_qty = pd.to_numeric(df[qty_col], errors="coerce").dropna()
        kpis["headline_metrics"]["total_units_sold"] = int(s_qty.sum())
        kpis["headline_metrics"]["average_units_per_order"] = round(float(s_qty.sum() / total_orders), 1) if total_orders > 0 else 0

    # Profit & margin
    profit_col = mapping["profit"]
    if profit_col and profit_col in df.columns:
        s_profit = pd.to_numeric(df[profit_col], errors="coerce").dropna()
        tot_profit = float(s_profit.sum())
        margin_pct = (tot_profit / total_val * 100) if total_val > 0 else 0.0
        kpis["headline_metrics"]["total_profit"] = round(tot_profit, 2)
        kpis["headline_metrics"]["profit_margin_pct"] = round(margin_pct, 2)

    # Category breakdown
    cat_col = mapping["category"]
    if cat_col and cat_col in df.columns:
        cat_grp = df.groupby(cat_col)[val_col].agg(["sum", "count"]).reset_index()
        cat_grp = cat_grp.sort_values(by="sum", ascending=False).head(10)
        kpis["category_breakdown"] = [
            {
                "category": str(r[cat_col]),
                "revenue": round(float(r["sum"]), 2),
                "transactions": int(r["count"]),
                "share_pct": round(float(r["sum"]) / total_val * 100, 2) if total_val > 0 else 0.0
            }
            for _, r in cat_grp.iterrows()
        ]

    # Product performance
    prod_col = mapping["product"]
    if prod_col and prod_col in df.columns:
        prod_grp = df.groupby(prod_col)[val_col].agg(["sum", "count"]).reset_index()
        prod_grp = prod_grp.sort_values(by="sum", ascending=False).head(10)
        kpis["product_performance"] = [
            {
                "product": str(r[prod_col]),
                "revenue": round(float(r["sum"]), 2),
                "orders_count": int(r["count"])
            }
            for _, r in prod_grp.iterrows()
        ]

    # Customer performance
    cust_col = mapping["customer"]
    if cust_col and cust_col in df.columns:
        cust_grp = df.groupby(cust_col)[val_col].agg(["sum", "count"]).reset_index()
        cust_grp = cust_grp.sort_values(by="sum", ascending=False).head(10)
        kpis["customer_performance"] = [
            {
                "customer": str(r[cust_col]),
                "revenue": round(float(r["sum"]), 2),
                "orders_count": int(r["count"]),
                "average_spend": round(float(r["sum"] / r["count"]), 2) if r["count"] > 0 else 0.0
            }
            for _, r in cust_grp.iterrows()
        ]

    # Geographic breakdown
    geo_col = mapping["country"] or mapping["region"]
    if geo_col and geo_col in df.columns:
        geo_grp = df.groupby(geo_col)[val_col].agg(["sum", "count"]).reset_index()
        geo_grp = geo_grp.sort_values(by="sum", ascending=False).head(10)
        kpis["geographic_breakdown"] = [
            {
                "location": str(r[geo_col]),
                "revenue": round(float(r["sum"]), 2),
                "orders": int(r["count"])
            }
            for _, r in geo_grp.iterrows()
        ]

    # Time performance (Monthly)
    date_col = mapping["date"]
    if date_col and date_col in df.columns:
        w_df = df[[date_col, val_col]].copy()
        w_df[date_col] = pd.to_datetime(w_df[date_col], errors="coerce")
        w_df[val_col] = pd.to_numeric(w_df[val_col], errors="coerce")
        w_df = w_df.dropna().sort_values(by=date_col)
        if not w_df.empty:
            try:
                m_grp = w_df.set_index(date_col)[val_col].resample("ME").sum()
            except Exception:
                m_grp = w_df.set_index(date_col)[val_col].resample("M").sum()
            kpis["time_performance"] = [
                {"period": dt.strftime("%Y-%m"), "revenue": round(float(amt), 2)}
                for dt, amt in m_grp.items()
            ]

    return kpis
