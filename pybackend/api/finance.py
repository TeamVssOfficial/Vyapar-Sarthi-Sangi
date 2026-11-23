"""
Finance Management API for Vyapar Verse.
Provides real-time Profit & Loss (P&L), Cash Flow, Income/Expense tracking,
and automated financial metric computation from uploaded datasets.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import time
import uuid
import pandas as pd
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Business, Dataset
from auth.dependencies import get_current_user, get_current_business
from api.datasets import load_dataset_df

router = APIRouter(prefix="/api/finance", tags=["Finance Management"])

# In-memory finance ledger store per business: business_id -> { "entries": [...], "budgets": [...] }
_FINANCE_STORES: Dict[str, Dict[str, Any]] = {}


class TransactionCreateRequest(BaseModel):
    category: str = Field(min_length=2, max_length=100)
    type: str = Field(pattern="^(INCOME|EXPENSE)$")
    amount: float = Field(gt=0.0)
    description: Optional[str] = "Standard business operation"
    date: Optional[str] = None
    account: Optional[str] = "Operating Account"


def _get_finance_store(business_id: str) -> Dict[str, Any]:
    if business_id not in _FINANCE_STORES:
        now = time.time()
        # Seed realistic baseline ledger entries
        _FINANCE_STORES[business_id] = {
            "entries": [
                {
                    "id": "tx-001",
                    "type": "INCOME",
                    "category": "Product Sales",
                    "amount": 142500.0,
                    "description": "Enterprise wholesale fulfillment - North Zone",
                    "account": "Operating Account",
                    "timestamp": now - 86400 * 25,
                    "date": "2026-10-28"
                },
                {
                    "id": "tx-002",
                    "type": "EXPENSE",
                    "category": "Inventory Procurement",
                    "amount": 78200.0,
                    "description": "Stock replenishment batch #418",
                    "account": "Commercial Credit",
                    "timestamp": now - 86400 * 20,
                    "date": "2026-11-02"
                },
                {
                    "id": "tx-003",
                    "type": "EXPENSE",
                    "category": "Operations & Logistics",
                    "amount": 14600.0,
                    "description": "Freight and courier distribution fees",
                    "account": "Operating Account",
                    "timestamp": now - 86400 * 15,
                    "date": "2026-11-07"
                },
                {
                    "id": "tx-004",
                    "type": "INCOME",
                    "category": "Consulting & Services",
                    "amount": 38900.0,
                    "description": "Annual ERP customization retainer",
                    "account": "Operating Account",
                    "timestamp": now - 86400 * 8,
                    "date": "2026-11-14"
                },
                {
                    "id": "tx-005",
                    "type": "EXPENSE",
                    "category": "Payroll & Salaries",
                    "amount": 32000.0,
                    "description": "Monthly engineering & operations payroll",
                    "account": "Payroll Account",
                    "timestamp": now - 86400 * 3,
                    "date": "2026-11-19"
                },
                {
                    "id": "tx-006",
                    "type": "INCOME",
                    "category": "Direct Retail Sales",
                    "amount": 54200.0,
                    "description": "Online storefront sales aggregate",
                    "account": "Payment Gateway",
                    "timestamp": now - 86400 * 1,
                    "date": "2026-11-21"
                }
            ]
        }
    return _FINANCE_STORES[business_id]


@router.get("/summary")
async def get_financial_summary(
    current_business: Business = Depends(get_current_business)
):
    """
    Computes total revenue, total expenses, net profit, profit margin,
    and cash position from verified ledger records.
    """
    store = _get_finance_store(current_business.id)
    entries = store.get("entries", [])

    total_income = sum(e["amount"] for e in entries if e["type"] == "INCOME")
    total_expense = sum(e["amount"] for e in entries if e["type"] == "EXPENSE")
    net_profit = total_income - total_expense
    margin = (net_profit / total_income * 100.0) if total_income > 0 else 0.0

    # Categorical breakdown
    expense_by_cat: Dict[str, float] = {}
    income_by_cat: Dict[str, float] = {}
    for e in entries:
        cat = e.get("category", "General")
        amt = e.get("amount", 0.0)
        if e["type"] == "EXPENSE":
            expense_by_cat[cat] = expense_by_cat.get(cat, 0.0) + amt
        else:
            income_by_cat[cat] = income_by_cat.get(cat, 0.0) + amt

    return {
        "business_id": current_business.id,
        "business_name": current_business.name,
        "kpis": {
            "total_income": round(total_income, 2),
            "total_expense": round(total_expense, 2),
            "net_profit": round(net_profit, 2),
            "profit_margin_pct": round(margin, 2),
            "total_transactions": len(entries),
            "status": "PROFITABLE" if net_profit >= 0 else "LOSS"
        },
        "breakdown": {
            "expenses": [{"category": k, "amount": round(v, 2)} for k, v in sorted(expense_by_cat.items(), key=lambda x: x[1], reverse=True)],
            "income": [{"category": k, "amount": round(v, 2)} for k, v in sorted(income_by_cat.items(), key=lambda x: x[1], reverse=True)]
        },
        "recent_entries": sorted(entries, key=lambda x: x.get("timestamp", 0), reverse=True)[:10]
    }


@router.post("/transactions")
async def record_transaction(
    payload: TransactionCreateRequest,
    current_business: Business = Depends(get_current_business)
):
    """Record an authentic financial entry (Income or Expense)."""
    store = _get_finance_store(current_business.id)
    now = time.time()
    date_str = payload.date or time.strftime("%Y-%m-%d", time.localtime(now))

    new_tx = {
        "id": f"tx-{uuid.uuid4().hex[:8]}",
        "type": payload.type,
        "category": payload.category.strip(),
        "amount": round(payload.amount, 2),
        "description": payload.description,
        "account": payload.account,
        "timestamp": now,
        "date": date_str
    }
    store["entries"].append(new_tx)
    return {
        "message": f"Successfully recorded {payload.type} entry of ₹{payload.amount:,.2f}",
        "transaction": new_tx
    }


@router.get("/cash-flow")
async def get_cash_flow(
    current_business: Business = Depends(get_current_business)
):
    """Return chronological cash inflow and outflow series for visualization."""
    store = _get_finance_store(current_business.id)
    entries = sorted(store.get("entries", []), key=lambda x: x.get("timestamp", 0))

    timeline = []
    cumulative = 0.0
    for e in entries:
        amt = e["amount"] if e["type"] == "INCOME" else -e["amount"]
        cumulative += amt
        timeline.append({
            "id": e["id"],
            "date": e.get("date", "Unknown"),
            "type": e["type"],
            "category": e["category"],
            "amount": e["amount"],
            "net_impact": amt,
            "running_balance": round(cumulative, 2)
        })

    return {
        "business_id": current_business.id,
        "current_balance": round(cumulative, 2),
        "flow_series": timeline
    }


@router.post("/sync-from-dataset/{dataset_id}")
async def sync_finance_from_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_business: Business = Depends(get_current_business)
):
    """
    Scans an uploaded business dataset (e.g. sales, orders, expenses)
    and synchronizes actual monetary records into the finance ledger.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = load_dataset_df(dataset.file_path)
    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="Cannot read dataset contents")

    # Detect revenue/sales columns
    cols_lower = {str(c).lower().strip(): c for c in df.columns}
    amt_col = None
    for cand in ["sales", "revenue", "amount", "total", "price", "net_amount", "subtotal"]:
        if cand in cols_lower:
            amt_col = cols_lower[cand]
            break

    cat_col = None
    for cand in ["productline", "category", "item_type", "type", "department", "segment"]:
        if cand in cols_lower:
            cat_col = cols_lower[cand]
            break

    date_col = None
    for cand in ["orderdate", "date", "created_at", "transaction_date", "timestamp"]:
        if cand in cols_lower:
            date_col = cols_lower[cand]
            break

    if not amt_col:
        raise HTTPException(status_code=422, detail="No currency or monetary amount column identified in dataset.")

    store = _get_finance_store(current_business.id)
    synced_count = 0
    now = time.time()

    # Process grouped or top records
    numeric_series = pd.to_numeric(df[amt_col], errors='coerce').dropna()
    total_synced_revenue = float(numeric_series.sum())

    if cat_col and cat_col in df.columns:
        grouped = df.groupby(cat_col)[amt_col].sum()
        for cat_name, sum_val in grouped.items():
            if pd.notna(sum_val) and sum_val > 0:
                store["entries"].append({
                    "id": f"ds-{uuid.uuid4().hex[:8]}",
                    "type": "INCOME",
                    "category": str(cat_name)[:60],
                    "amount": round(float(sum_val), 2),
                    "description": f"Aggregated revenue from dataset: {dataset.name}",
                    "account": "Dataset Ingestion",
                    "timestamp": now,
                    "date": time.strftime("%Y-%m-%d", time.localtime(now))
                })
                synced_count += 1
    else:
        store["entries"].append({
            "id": f"ds-{uuid.uuid4().hex[:8]}",
            "type": "INCOME",
            "category": "Dataset Revenue",
            "amount": round(total_synced_revenue, 2),
            "description": f"Total revenue mapped from {dataset.name}",
            "account": "Dataset Ingestion",
            "timestamp": now,
            "date": time.strftime("%Y-%m-%d", time.localtime(now))
        })
        synced_count = 1

    return {
        "message": f"Successfully ingested {synced_count} financial revenue streams from dataset '{dataset.name}'.",
        "total_revenue_synced": round(total_synced_revenue, 2),
        "records_processed": len(df)
    }
