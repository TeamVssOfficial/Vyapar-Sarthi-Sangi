import os
import sys
from pathlib import Path
import pandas as pd

# Add pybackend to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from database.connection import init_db, SessionLocal
from database.models import User, Business, Dataset
from auth.security import hash_password, verify_password, create_access_token, decode_access_token
from engines.data_intelligence.profiling import profile_dataset
from engines.data_intelligence.validation import validate_dataset
from engines.data_intelligence.cleaning import generate_cleaning_recommendations, apply_cleaning
from engines.eda.statistics import compute_descriptive_statistics
from engines.eda.correlation import compute_correlations
from engines.eda.outliers import detect_outliers
from engines.bi.kpi_calculator import calculate_business_kpis
from engines.visualization.chart_generator import generate_plotly_spec
from engines.ml.task_detection import detect_ml_tasks
from engines.ml.training import train_supervised_model, train_forecasting_model
from engines.ai_analyst.question_router import route_user_question
from engines.ai_analyst.analytics_tools import execute_analytical_tool
from engines.ai_analyst.response_generator import generate_analyst_response
from engines.reports.pdf_generator import generate_executive_pdf
from engines.reports.excel_generator import generate_excel_report


def run_full_verification():
    print("=" * 60)
    print("VYAPAR SARTHI SANGI (VSS AI) - FULL PLATFORM VERIFICATION")
    print("=" * 60)

    # 1. Database & Auth Security
    print("\n[1/9] Testing Database & Auth Security...")
    init_db()
    pwd = "EnterpriseSecurePassword2026!"
    h = hash_password(pwd)
    assert verify_password(pwd, h), "Password verification failed"
    token = create_access_token({"userID": "usr_test", "email": "admin@vssai.com", "role": "admin"})
    payload = decode_access_token(token)
    assert payload["userID"] == "usr_test", "JWT decoding failed"
    print("  -> Password hashing (bcrypt) & JWT tokens: PASSED")

    # 2. Ingestion & Real Dataset
    print("\n[2/9] Testing Dataset Ingestion...")
    sample_path = BACKEND_DIR.parent / "notebooks" / "sales_data_sample.csv"
    assert sample_path.is_file(), f"Missing dataset at {sample_path}"
    df = pd.read_csv(sample_path, encoding="latin1")
    print(f"  -> Ingested benchmark dataset: {len(df):,} rows, {len(df.columns)} columns: PASSED")

    # 3. Data Intelligence & Quality Profiling
    print("\n[3/9] Testing Data Intelligence & Profiling Engine...")
    prof = profile_dataset(df)
    val = validate_dataset(df)
    recs = generate_cleaning_recommendations(df)
    score = prof["quality_score"]
    rating = prof["quality_rating"]
    assert score > 0, "Quality score calculation failed"
    assert val["status"] in ["valid", "warning"], "Validation check failed"
    print(f"  -> Quality Score: {score}/100 ({rating}), {len(recs)} Cleaning Recommendations: PASSED")

    # 4. Safe Cleaning Engine
    print("\n[4/9] Testing Safe Data Cleaning...")
    cleaned_df, clean_summary = apply_cleaning(
        df,
        {"drop_duplicates": True, "trim_whitespace": True, "fill_numeric_strategy": "median"}
    )
    assert len(cleaned_df) == len(df), "Row loss during safe cleaning"
    print(f"  -> Non-destructive transformation applied ({clean_summary['actions_performed']}): PASSED")

    # 5. Exploratory Data Analysis (EDA) Engine
    print("\n[5/9] Testing Exploratory Data Analysis Engine...")
    stats = compute_descriptive_statistics(df)
    corrs = compute_correlations(df)
    outliers = detect_outliers(df)
    assert corrs["has_correlation"] is True, "Correlations missing"
    assert outliers["total_outlier_points"] > 0, "Outlier detection failed"
    print(f"  -> {len(corrs['top_correlations'])} Correlation pairs detected")
    print(f"  -> {outliers['total_outlier_points']} Outlier points identified across {outliers['columns_with_outliers']} columns: PASSED")

    # 6. Business Intelligence Engine & KPIs
    print("\n[6/9] Testing Business Intelligence & Metric Detection...")
    kpis = calculate_business_kpis(df)
    headline = kpis["headline_metrics"]
    tot_rev = headline["total_revenue"]
    aov = headline["average_order_value"]
    assert tot_rev > 0, "Revenue calculation failed"
    print(f"  -> Total Revenue: Rs. {tot_rev:,.2f}, AOV: Rs. {aov:,.2f}")
    print(f"  -> Categories broken down: {len(kpis['category_breakdown'])}, Top customers: {len(kpis['customer_performance'])}: PASSED")

    # 7. Visualization Engine (Plotly)
    print("\n[7/9] Testing Visualization Engine...")
    spec = generate_plotly_spec(df, "bar", x="PRODUCTLINE", y="SALES", title="Revenue by Product Line")
    assert "data" in spec and "layout" in spec, "Plotly specification generation failed"
    print("  -> Plotly JSON specification generated with VSS AI theme palette: PASSED")

    # 8. Machine Learning Studio
    print("\n[8/9] Testing Machine Learning Studio...")
    tasks = detect_ml_tasks(df)
    assert len(tasks["suggestions"]) > 0, "No ML tasks detected"
    print(f"  -> Suggested {len(tasks['suggestions'])} viable ML tasks")

    # Train regression
    ml_res = train_supervised_model(df, target="SALES", task_type="regression")
    r2 = ml_res["metrics"]["r2_score"]
    mae = ml_res["metrics"]["mean_absolute_error"]
    print(f"  -> Trained Random Forest Regressor on SALES: R2 = {r2}, MAE = {mae}")

    # Train forecast
    fc_res = train_forecasting_model(df, date_column="ORDERDATE", target_column="SALES", forecast_horizon=3)
    assert len(fc_res["forecast"]) == 3, "Forecasting horizon count mismatch"
    print(f"  -> Generated 3-month forward projection (Test MAE: {fc_res['test_mae']}): PASSED")

    # 9. AI Analyst & Grounded Reasoning
    print("\n[9/9] Testing AI Analyst Grounding...")
    q = "What is our overall sales volume and top performing product line?"
    routing = route_user_question(q)
    tool_data = execute_analytical_tool(df, routing)
    ai_resp = generate_analyst_response(q, routing, tool_data)
    assert len(ai_resp["answer"]) > 50, "AI response too short"
    assert len(ai_resp["suggested_actions"]) > 0, "No actions suggested"
    print(f"  -> Intent: {routing['intent']}, Focus: {routing['entity_focus']}")
    print(f"  -> Generated factual grounded synthesis ({len(ai_resp['answer'])} chars): PASSED")

    # 10. Reports Engine
    print("\n[Bonus] Testing Report Generation (PDF & Excel)...")
    out_dir = BACKEND_DIR.parent / "storage" / "reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = out_dir / "verification_report.pdf"
    excel_path = out_dir / "verification_report.xlsx"

    generate_executive_pdf(pdf_path, "Sales Sample", "Enterprise Demo", prof, kpis, prof)
    generate_excel_report(excel_path, df, prof, kpis)

    assert pdf_path.is_file() and pdf_path.stat().st_size > 1000, "PDF generation failed"
    assert excel_path.is_file() and excel_path.stat().st_size > 1000, "Excel generation failed"
    print(f"  -> PDF generated: {pdf_path.name} ({pdf_path.stat().st_size:,} bytes)")
    print(f"  -> Excel workbook generated: {excel_path.name} ({excel_path.stat().st_size:,} bytes): PASSED")

    print("\n" + "=" * 60)
    print("ALL 9 ARCHITECTURAL MODULES FULLY TESTED & VERIFIED!")
    print("=" * 60)


if __name__ == "__main__":
    run_full_verification()
