import pandas as pd


def validate_dataset(df: pd.DataFrame) -> dict:
    """
    Validates the dataset against business integrity checks.
    Returns status: 'valid', 'warning', or 'invalid' and specific findings.
    """
    checks = []
    is_valid = True

    # Check 1: Empty dataset
    if df.empty:
        checks.append({
            "check": "Dataset not empty",
            "passed": False,
            "severity": "critical",
            "message": "Dataset contains 0 rows."
        })
        return {"status": "invalid", "checks": checks, "can_proceed": False}
    else:
        checks.append({
            "check": "Dataset not empty",
            "passed": True,
            "severity": "info",
            "message": f"Contains {len(df):,} rows."
        })

    # Check 2: Column count
    if len(df.columns) < 2:
        checks.append({
            "check": "Sufficient column count",
            "passed": False,
            "severity": "critical",
            "message": "Dataset has fewer than 2 columns; cannot perform meaningful analysis."
        })
        is_valid = False
    else:
        checks.append({
            "check": "Sufficient column count",
            "passed": True,
            "severity": "info",
            "message": f"{len(df.columns)} columns found."
        })

    # Check 3: Row volume
    if len(df) < 5:
        checks.append({
            "check": "Row volume adequacy",
            "passed": False,
            "severity": "warning",
            "message": "Very few rows (< 5). Statistical tests may be unreliable."
        })
    else:
        checks.append({
            "check": "Row volume adequacy",
            "passed": True,
            "severity": "info",
            "message": f"{len(df):,} records available for analysis."
        })

    # Check 4: Unnamed columns
    unnamed_cols = [c for c in df.columns if "unnamed" in str(c).lower()]
    if unnamed_cols:
        checks.append({
            "check": "Header integrity",
            "passed": False,
            "severity": "warning",
            "message": f"{len(unnamed_cols)} unnamed column(s) detected. Header row may be misaligned."
        })
    else:
        checks.append({
            "check": "Header integrity",
            "passed": True,
            "severity": "info",
            "message": "All columns have proper naming headers."
        })

    # Check 5: Duplicate rows
    dup_count = int(df.duplicated().sum())
    if dup_count > 0:
        checks.append({
            "check": "Duplicate records",
            "passed": False,
            "severity": "warning",
            "message": f"{dup_count} exact duplicate rows found ({round(dup_count/len(df)*100, 1)}%)."
        })
    else:
        checks.append({
            "check": "Duplicate records",
            "passed": True,
            "severity": "info",
            "message": "No duplicate rows found."
        })

    # Check 6: Overall missing cells
    total_cells = len(df) * len(df.columns)
    missing_cells = int(df.isna().sum().sum())
    missing_pct = round(missing_cells / total_cells * 100, 2)
    if missing_pct > 25:
        checks.append({
            "check": "Missing data threshold",
            "passed": False,
            "severity": "warning",
            "message": f"High missingness: {missing_pct}% of all data cells are empty."
        })
    else:
        checks.append({
            "check": "Missing data threshold",
            "passed": True,
            "severity": "info",
            "message": f"Clean data density: {100 - missing_pct}% filled."
        })

    status = "valid" if is_valid and not any(c["severity"] == "critical" and not c["passed"] for c in checks) else "warning"
    if any(c["severity"] == "critical" and not c["passed"] for c in checks):
        status = "invalid"

    return {
        "status": status,
        "can_proceed": status != "invalid",
        "checks": checks
    }
