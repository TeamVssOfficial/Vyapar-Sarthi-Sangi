import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import (
    RandomForestRegressor,
    RandomForestClassifier,
    GradientBoostingRegressor,
    GradientBoostingClassifier,
    IsolationForest
)
from sklearn.linear_model import Ridge, LogisticRegression
from sklearn.cluster import KMeans
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    silhouette_score
)
import joblib
from pathlib import Path
import uuid


def clean_feature_candidates(df: pd.DataFrame, target: str | None = None) -> list[str]:
    """
    Selects valid features and filters out high-cardinality IDs, leaked fields, and free-form text.
    """
    excluded = set()
    if target:
        excluded.add(target)

    for col in df.columns:
        col_str = str(col).lower()
        s = df[col].dropna()
        # Drop ID columns with excessive uniqueness
        if s.nunique() > 100 and s.nunique() / len(df) > 0.8:
            excluded.add(col)
        # Drop free-form address / phone / email text
        elif any(k in col_str for k in ["phone", "addressline", "postalcode", "email", "url"]):
            excluded.add(col)
        # Drop exact target leakage
        elif target and target.lower() in col_str and col != target:
            excluded.add(col)

    candidates = [str(c) for c in df.columns if c not in excluded]
    return candidates


def train_supervised_model(
    df: pd.DataFrame,
    target: str,
    task_type: str = "regression",
    feature_columns: list[str] | None = None,
    test_size: float = 0.2,
    random_state: int = 42
) -> dict:
    if target not in df.columns:
        raise KeyError(f"Target column '{target}' not found in dataset")

    work = df.dropna(subset=[target]).copy()

    # Determine features
    if not feature_columns:
        feature_columns = clean_feature_candidates(work, target=target)

    # Filter out columns that don't exist
    feature_columns = [c for c in feature_columns if c in work.columns and c != target]
    if not feature_columns:
        raise ValueError("No usable feature columns available for model training.")

    X = work[feature_columns]
    y = work[target]

    num_cols = list(X.select_dtypes(include=np.number).columns)
    cat_cols = list(X.select_dtypes(include=["object", "category", "string"]).columns)

    # Filter high cardinality categoricals from OneHotEncoder to prevent memory explosion
    safe_cat_cols = [c for c in cat_cols if X[c].nunique() <= 50]
    dropped_cats = [c for c in cat_cols if c not in safe_cat_cols]
    if dropped_cats:
        X = X.drop(columns=dropped_cats)
        feature_columns = [c for c in feature_columns if c not in dropped_cats]

    transformers = []
    if num_cols:
        transformers.append(("num", SimpleImputer(strategy="median"), num_cols))
    if safe_cat_cols:
        transformers.append((
            "cat",
            Pipeline([
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
            ]),
            safe_cat_cols
        ))

    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")

    strat = None
    if task_type == "classification":
        # Encode target if object
        if y.dtype == "object":
            y = y.astype(str)
        # If classes have >= 2 instances each, use stratification
        val_counts = y.value_counts()
        if (val_counts >= 2).all() and len(val_counts) > 1:
            strat = y

        estimator = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=random_state, n_jobs=1)
    else:
        y = pd.to_numeric(y, errors="coerce")
        # Drop nan in target
        valid_mask = y.notna()
        X = X[valid_mask]
        y = y[valid_mask]
        estimator = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=random_state, n_jobs=1)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=strat
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", estimator)
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    # Extract metrics
    metrics = {}
    if task_type == "regression":
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))
        metrics = {
            "mean_absolute_error": round(mae, 4),
            "root_mean_squared_error": round(rmse, 4),
            "r2_score": round(r2, 4),
            "performance_rating": "Strong" if r2 >= 0.75 else "Moderate" if r2 >= 0.50 else "Baseline"
        }
    else:
        acc = float(accuracy_score(y_test, y_pred))
        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
        metrics = {
            "accuracy": round(acc, 4),
            "weighted_f1_score": round(f1, 4),
            "performance_rating": "Strong" if acc >= 0.80 else "Moderate" if acc >= 0.65 else "Baseline"
        }

    # Extract top feature importances
    feature_importances = []
    try:
        raw_model = pipeline.named_steps["model"]
        if hasattr(raw_model, "feature_importances_"):
            raw_importances = raw_model.feature_importances_
            feature_names = pipeline.named_steps["preprocessor"].get_feature_names_out()
            paired = sorted(zip(feature_names, raw_importances), key=lambda x: x[1], reverse=True)[:10]
            for fn, imp in paired:
                clean_name = fn.replace("num__", "").replace("cat__", "")
                feature_importances.append({"feature": clean_name, "importance": round(float(imp), 4)})
    except Exception:
        pass

    # Sample predictions
    sample_preview = []
    for i in range(min(10, len(y_test))):
        sample_preview.append({
            "actual": str(y_test.iloc[i]),
            "predicted": str(round(float(y_pred[i]), 2) if task_type == "regression" else y_pred[i])
        })

    return {
        "pipeline": pipeline,
        "task_type": task_type,
        "target": target,
        "feature_columns": feature_columns,
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "metrics": metrics,
        "feature_importances": feature_importances,
        "sample_predictions": sample_preview,
        "limitations": (
            "Model predictions represent statistical approximations derived from historical patterns. "
            "External market shifts, supply disruptions, and extreme economic volatility may affect future accuracy."
        )
    }


def train_forecasting_model(
    df: pd.DataFrame,
    date_column: str,
    target_column: str,
    forecast_horizon: int = 6,
    frequency: str = "M"
) -> dict:
    """
    Time-series forecasting using chronological train/validation split and lag features.
    """
    work = df[[date_column, target_column]].dropna().copy()
    work[date_column] = pd.to_datetime(work[date_column], errors="coerce")
    work[target_column] = pd.to_numeric(work[target_column], errors="coerce")
    work = work.dropna().sort_values(by=date_column)

    if len(work) < 10:
        raise ValueError("Insufficient time points for time series forecasting (minimum 10 required).")

    # Resample to regular intervals
    ts = work.set_index(date_column)[target_column].resample(frequency).sum().reset_index()

    # Engineer time features and lags
    ts["lag_1"] = ts[target_column].shift(1)
    ts["lag_2"] = ts[target_column].shift(2)
    ts["lag_3"] = ts[target_column].shift(3)
    ts["rolling_mean_3"] = ts[target_column].shift(1).rolling(3).mean()

    clean_ts = ts.dropna().copy()
    if len(clean_ts) < 5:
        # Fallback to simple trend line
        clean_ts = ts.fillna(method="bfill").fillna(0)

    feature_cols = ["lag_1", "lag_2", "lag_3", "rolling_mean_3"]
    X = clean_ts[feature_cols]
    y = clean_ts[target_column]

    # Chronological split: last 20% is test
    split_idx = max(1, int(len(clean_ts) * 0.8))
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    test_mae = float(mean_absolute_error(y_test, model.predict(X_test))) if len(y_test) > 0 else 0.0

    # Auto-regressive iterative forecasting for future horizon
    history_vals = list(ts[target_column].values)
    last_date = ts[date_column].iloc[-1]

    future_predictions = []
    for step in range(1, forecast_horizon + 1):
        l1 = history_vals[-1]
        l2 = history_vals[-2] if len(history_vals) >= 2 else l1
        l3 = history_vals[-3] if len(history_vals) >= 3 else l2
        roll_mean = np.mean(history_vals[-3:])

        feat = np.array([[l1, l2, l3, roll_mean]])
        pred_val = max(0.0, float(model.predict(feat)[0]))
        history_vals.append(pred_val)

        next_date = last_date + pd.DateOffset(months=step) if frequency == "M" else last_date + pd.DateOffset(days=step*7)
        future_predictions.append({
            "period": next_date.strftime("%Y-%m-%d"),
            "forecasted_value": round(pred_val, 2),
            "lower_confidence_90": round(max(0.0, pred_val - (1.64 * test_mae)), 2),
            "upper_confidence_90": round(pred_val + (1.64 * test_mae), 2)
        })

    historical_series = [
        {"period": dt.strftime("%Y-%m-%d"), "actual_value": round(float(v), 2)}
        for dt, v in zip(ts[date_column], ts[target_column])
    ]

    return {
        "task_type": "forecasting",
        "date_column": date_column,
        "target_column": target_column,
        "test_mae": round(test_mae, 2),
        "historical_series": historical_series,
        "forecast": future_predictions
    }


def train_clustering_model(
    df: pd.DataFrame,
    entity_column: str,
    n_clusters: int = 4
) -> dict:
    """
    K-Means clustering on aggregated customer / entity metrics.
    """
    num_cols = df.select_dtypes(include=np.number).columns.tolist()
    if not num_cols:
        raise ValueError("Clustering requires numeric measure columns to compute segments.")

    agg_dict = {c: ["sum", "mean", "count"] for c in num_cols[:4]}
    grouped = df.groupby(entity_column).agg(agg_dict)
    grouped.columns = [f"{col}_{stat}" for col, stat in grouped.columns]
    grouped = grouped.fillna(0)

    scaler = StandardScaler()
    scaled = scaler.fit_transform(grouped)

    k = min(n_clusters, max(2, len(grouped) - 1))
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(scaled)

    grouped["cluster"] = clusters
    sil_score = float(silhouette_score(scaled, clusters)) if len(grouped) > k else 0.5

    cluster_profiles = []
    for c_id in range(k):
        c_subset = grouped[grouped["cluster"] == c_id]
        cluster_profiles.append({
            "cluster_id": c_id,
            "entity_count": len(c_subset),
            "percentage": round(len(c_subset) / len(grouped) * 100, 2),
            "persona": f"Segment {c_id + 1}: High Volume" if c_id == 0 else f"Segment {c_id + 1}: Standard"
        })

    return {
        "task_type": "clustering",
        "entity_column": entity_column,
        "total_entities_clustered": len(grouped),
        "number_of_clusters": k,
        "silhouette_score": round(sil_score, 4),
        "clusters": cluster_profiles
    }
