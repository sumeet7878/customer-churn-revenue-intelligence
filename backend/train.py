import logging
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

DATA_URL = (
    "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d"
    "/master/data/Telco-Customer-Churn.csv"
)
FALLBACK_URL = (
    "https://raw.githubusercontent.com/dsrscientist/dataset1"
    "/master/Telco_Customer_Churn.csv"
)
DATA_PATH = Path("data/Telco-Customer-Churn.csv")


def load_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        logger.info("Downloading Telco Churn dataset…")
        for url in (DATA_URL, FALLBACK_URL):
            try:
                r = requests.get(url, timeout=60)
                r.raise_for_status()
                DATA_PATH.write_bytes(r.content)
                logger.info("Dataset saved from %s", url)
                break
            except Exception as exc:
                logger.warning("Download failed (%s): %s", url, exc)
        else:
            raise RuntimeError("Could not download dataset from any source.")
    return pd.read_csv(DATA_PATH)


def preprocess(df: pd.DataFrame):
    df = df.copy()

    customer_ids = df["customerID"].reset_index(drop=True)
    monthly_charges = (
        pd.to_numeric(df["MonthlyCharges"], errors="coerce")
        .fillna(0)
        .reset_index(drop=True)
    )

    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df["TotalCharges"] = df["TotalCharges"].fillna(df["TotalCharges"].median())
    df["Churn"] = (df["Churn"] == "Yes").astype(int)

    df.drop(columns=["customerID"], inplace=True)
    y = df.pop("Churn")

    # Binary-encode known yes/no columns
    binary_map = {
        "gender": lambda s: (s == "Male").astype(int),
        "Partner": lambda s: (s == "Yes").astype(int),
        "Dependents": lambda s: (s == "Yes").astype(int),
        "PhoneService": lambda s: (s == "Yes").astype(int),
        "PaperlessBilling": lambda s: (s == "Yes").astype(int),
    }
    for col, fn in binary_map.items():
        if col in df.columns:
            df[col] = fn(df[col])

    # One-hot encode remaining object columns
    cat_cols = df.select_dtypes(include="object").columns.tolist()
    df = pd.get_dummies(df, columns=cat_cols, drop_first=True)

    feature_cols = df.columns.tolist()
    return df, y, feature_cols, customer_ids, monthly_charges


def train_and_save_model(model_path: Path) -> None:
    logger.info("Loading data…")
    df = load_data()

    logger.info("Preprocessing…")
    X, y, feature_cols, customer_ids, monthly_charges = preprocess(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    logger.info("Training Logistic Regression…")
    lr = LogisticRegression(max_iter=1000, random_state=42, C=1.0)
    lr.fit(X_train_s, y_train)
    lr_auc = roc_auc_score(y_test, lr.predict_proba(X_test_s)[:, 1])
    logger.info("LR  ROC-AUC: %.4f", lr_auc)

    logger.info("Training Random Forest…")
    rf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    rf_auc = roc_auc_score(y_test, rf.predict_proba(X_test)[:, 1])
    logger.info("RF  ROC-AUC: %.4f", rf_auc)

    if rf_auc >= lr_auc:
        best_model, best_name, best_auc, use_scaler = rf, "RandomForest", rf_auc, False
    else:
        best_model, best_name, best_auc, use_scaler = lr, "LogisticRegression", lr_auc, True

    logger.info("Best model: %s  (AUC=%.4f)", best_name, best_auc)

    payload = {
        "model": best_model,
        "scaler": scaler,
        "use_scaler": use_scaler,
        "feature_cols": feature_cols,
        "model_name": best_name,
        "auc": best_auc,
        "X_full": X,
        "customer_ids": customer_ids,
        "monthly_charges": monthly_charges,
    }

    with open(model_path, "wb") as f:
        pickle.dump(payload, f)

    logger.info("Model saved → %s", model_path)


def load_model(model_path: Path) -> dict:
    with open(model_path, "rb") as f:
        return pickle.load(f)


def get_predictions_df(payload: dict) -> pd.DataFrame:
    model = payload["model"]
    scaler = payload["scaler"]
    use_scaler = payload["use_scaler"]
    X_full = payload["X_full"]
    customer_ids = payload["customer_ids"]
    monthly_charges = payload["monthly_charges"]

    X_input = scaler.transform(X_full) if use_scaler else X_full
    probs = model.predict_proba(X_input)[:, 1]

    def tier(p: float) -> str:
        if p >= 0.7:
            return "High"
        if p >= 0.4:
            return "Medium"
        return "Low"

    return pd.DataFrame(
        {
            "customerID": customer_ids.values.tolist(),
            "churn_probability": np.round(probs, 4).tolist(),
            "risk_tier": [tier(float(p)) for p in probs],
            "MonthlyCharges": monthly_charges.fillna(0).values.tolist(),
        }
    )
