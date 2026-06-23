"""
Anomaly Detector
Identifies spending anomalies in SAP Concur expense data.
"""

import logging
from typing import Dict, List, Any

import pandas as pd

logger = logging.getLogger(__name__)


def detect_high_spending_variance(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Detect expenses where an employee's single expense exceeds
    150% of their own historical average for that expense type.

    Args:
        df: Expense DataFrame.

    Returns:
        List of flagged records with anomaly details.
    """
    findings: List[Dict[str, Any]] = []

    if df.empty:
        return findings

    # Compute per-employee, per-category average
    avg_by_emp_type = (
        df.groupby(["employeeId", "expenseType"])["amount"]
        .mean()
        .reset_index()
        .rename(columns={"amount": "avgAmount"})
    )

    merged = df.merge(avg_by_emp_type, on=["employeeId", "expenseType"], how="left")
    flagged = merged[merged["amount"] > (merged["avgAmount"] * 1.5)]

    for _, row in flagged.iterrows():
        findings.append({
            "reportId": row["reportId"],
            "employeeId": row["employeeId"],
            "employeeName": row["employeeName"],
            "department": row["department"],
            "expenseType": row["expenseType"],
            "vendor": row["vendor"],
            "amount": row["amount"],
            "expenseDate": str(row["expenseDate"].date()),
            "city": row["city"],
            "anomalyType": "High Spending Variance",
            "detail": (
                f"Amount ${row['amount']:.2f} is "
                f"{((row['amount'] / row['avgAmount'] - 1) * 100):.0f}% above "
                f"employee avg ${row['avgAmount']:.2f}"
            ),
        })

    logger.info(f"High spending variance: {len(findings)} records flagged.")
    return findings


def detect_peer_outliers(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Detect expenses where an employee's amount exceeds
    200% of the department average for that expense type.

    Args:
        df: Expense DataFrame.

    Returns:
        List of flagged records with anomaly details.
    """
    findings: List[Dict[str, Any]] = []

    if df.empty:
        return findings

    dept_avg = (
        df.groupby(["department", "expenseType"])["amount"]
        .mean()
        .reset_index()
        .rename(columns={"amount": "deptAvgAmount"})
    )

    merged = df.merge(dept_avg, on=["department", "expenseType"], how="left")
    flagged = merged[merged["amount"] > (merged["deptAvgAmount"] * 2.0)]

    for _, row in flagged.iterrows():
        findings.append({
            "reportId": row["reportId"],
            "employeeId": row["employeeId"],
            "employeeName": row["employeeName"],
            "department": row["department"],
            "expenseType": row["expenseType"],
            "vendor": row["vendor"],
            "amount": row["amount"],
            "expenseDate": str(row["expenseDate"].date()),
            "city": row["city"],
            "anomalyType": "Peer Outlier",
            "detail": (
                f"Amount ${row['amount']:.2f} exceeds 200% of "
                f"{row['department']} dept avg ${row['deptAvgAmount']:.2f} "
                f"for {row['expenseType']}"
            ),
        })

    logger.info(f"Peer outliers: {len(findings)} records flagged.")
    return findings


def detect_weekend_expenses(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Detect expenses submitted on weekends (Saturday=5, Sunday=6).

    Args:
        df: Expense DataFrame.

    Returns:
        List of weekend expense records.
    """
    findings: List[Dict[str, Any]] = []

    if df.empty:
        return findings

    weekend_mask = df["expenseDate"].dt.dayofweek >= 5
    flagged = df[weekend_mask]

    for _, row in flagged.iterrows():
        day_name = row["expenseDate"].strftime("%A")
        findings.append({
            "reportId": row["reportId"],
            "employeeId": row["employeeId"],
            "employeeName": row["employeeName"],
            "department": row["department"],
            "expenseType": row["expenseType"],
            "vendor": row["vendor"],
            "amount": row["amount"],
            "expenseDate": str(row["expenseDate"].date()),
            "city": row["city"],
            "anomalyType": "Weekend Expense",
            "detail": f"Expense submitted on {day_name} — weekend activity requires justification.",
        })

    logger.info(f"Weekend expenses: {len(findings)} records flagged.")
    return findings


def detect_unusual_categories(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Detect expense types rarely used by a given employee
    (less than 10% of their total submissions for that category).

    Args:
        df: Expense DataFrame.

    Returns:
        List of records with unusual expense categories.
    """
    findings: List[Dict[str, Any]] = []

    if df.empty:
        return findings

    # Count expense types per employee
    emp_type_counts = (
        df.groupby(["employeeId", "expenseType"])
        .size()
        .reset_index(name="typeCount")
    )
    emp_totals = (
        df.groupby("employeeId")
        .size()
        .reset_index(name="totalCount")
    )

    merged = emp_type_counts.merge(emp_totals, on="employeeId")
    merged["typePct"] = merged["typeCount"] / merged["totalCount"]

    # Flag categories used in < 10% of submissions AND only once
    rare = merged[(merged["typePct"] < 0.10) & (merged["typeCount"] == 1)]
    rare_keys = set(zip(rare["employeeId"], rare["expenseType"]))

    for _, row in df.iterrows():
        key = (row["employeeId"], row["expenseType"])
        if key in rare_keys:
            findings.append({
                "reportId": row["reportId"],
                "employeeId": row["employeeId"],
                "employeeName": row["employeeName"],
                "department": row["department"],
                "expenseType": row["expenseType"],
                "vendor": row["vendor"],
                "amount": row["amount"],
                "expenseDate": str(row["expenseDate"].date()),
                "city": row["city"],
                "anomalyType": "Unusual Category",
                "detail": (
                    f"Employee rarely uses '{row['expenseType']}' — "
                    f"only 1 submission of this type on record."
                ),
            })

    logger.info(f"Unusual categories: {len(findings)} records flagged.")
    return findings


def run_all_anomaly_checks(df: pd.DataFrame) -> Dict[str, List[Dict[str, Any]]]:
    """
    Run all anomaly detection checks and return combined results.

    Args:
        df: Expense DataFrame.

    Returns:
        Dictionary with keys for each anomaly type.
    """
    return {
        "high_variance": detect_high_spending_variance(df),
        "peer_outliers": detect_peer_outliers(df),
        "weekend_expenses": detect_weekend_expenses(df),
        "unusual_categories": detect_unusual_categories(df),
    }
