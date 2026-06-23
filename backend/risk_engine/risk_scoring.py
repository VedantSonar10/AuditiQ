"""
Risk Scoring Engine
Calculates composite risk scores for each expense record.
"""

import logging
from typing import Dict, List, Any, Tuple

import pandas as pd

logger = logging.getLogger(__name__)

# Risk weights (must sum ≤ 100)
RISK_WEIGHTS = {
    "duplicate": 30,
    "peer_outlier": 20,
    "high_variance": 20,
    "weekend_expense": 10,
    "unusual_category": 20,
}

RISK_LEVELS = {
    "Low": (0, 30),
    "Medium": (31, 60),
    "High": (61, 100),
}


def _get_risk_level(score: int) -> str:
    """
    Map a numeric risk score to a categorical risk level.

    Args:
        score: Integer risk score (0–100).

    Returns:
        Risk level string: 'Low', 'Medium', or 'High'.
    """
    for level, (low, high) in RISK_LEVELS.items():
        if low <= score <= high:
            return level
    return "High"


def calculate_risk_scores(
    df: pd.DataFrame,
    anomalies: Dict[str, List[Dict[str, Any]]],
    duplicates: List[Dict[str, Any]],
) -> pd.DataFrame:
    """
    Calculate risk scores for all expense records.

    Args:
        df: Full expense DataFrame.
        anomalies: Output from run_all_anomaly_checks().
        duplicates: Output from detect_duplicates().

    Returns:
        DataFrame with additional columns: risk_score, risk_level, risk_flags.
    """
    # Build lookup sets for each flag type
    high_var_ids = {r["reportId"] for r in anomalies.get("high_variance", [])}
    peer_ids = {r["reportId"] for r in anomalies.get("peer_outliers", [])}
    weekend_ids = {r["reportId"] for r in anomalies.get("weekend_expenses", [])}
    unusual_ids = {r["reportId"] for r in anomalies.get("unusual_categories", [])}

    dup_ids: set = set()
    for d in duplicates:
        dup_ids.add(d["reportId_A"])
        dup_ids.add(d["reportId_B"])

    scores = []
    levels = []
    flags_list = []

    for _, row in df.iterrows():
        rid = row["reportId"]
        score = 0
        flags = []

        if rid in dup_ids:
            score += RISK_WEIGHTS["duplicate"]
            flags.append("Duplicate")

        if rid in peer_ids:
            score += RISK_WEIGHTS["peer_outlier"]
            flags.append("Peer Outlier")

        if rid in high_var_ids:
            score += RISK_WEIGHTS["high_variance"]
            flags.append("High Variance")

        if rid in weekend_ids:
            score += RISK_WEIGHTS["weekend_expense"]
            flags.append("Weekend")

        if rid in unusual_ids:
            score += RISK_WEIGHTS["unusual_category"]
            flags.append("Unusual Category")

        score = min(score, 100)
        scores.append(score)
        levels.append(_get_risk_level(score))
        flags_list.append(", ".join(flags) if flags else "None")

    result = df.copy()
    result["risk_score"] = scores
    result["risk_level"] = levels
    result["risk_flags"] = flags_list

    logger.info(
        f"Risk scoring complete. High: {(result['risk_level'] == 'High').sum()}, "
        f"Medium: {(result['risk_level'] == 'Medium').sum()}, "
        f"Low: {(result['risk_level'] == 'Low').sum()}"
    )

    return result


def get_employee_risk_summary(scored_df: pd.DataFrame) -> pd.DataFrame:
    """
    Summarize risk scores per employee.

    Args:
        scored_df: DataFrame with risk_score and risk_level columns.

    Returns:
        DataFrame with per-employee risk summary.
    """
    summary = (
        scored_df.groupby(["employeeId", "employeeName", "department"])
        .agg(
            total_expenses=("reportId", "count"),
            total_amount=("amount", "sum"),
            avg_risk_score=("risk_score", "mean"),
            max_risk_score=("risk_score", "max"),
            high_risk_count=("risk_level", lambda x: (x == "High").sum()),
            medium_risk_count=("risk_level", lambda x: (x == "Medium").sum()),
        )
        .reset_index()
        .sort_values("avg_risk_score", ascending=False)
    )
    summary["avg_risk_score"] = summary["avg_risk_score"].round(1)
    return summary
