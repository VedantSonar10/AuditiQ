"""
Duplicate Expense Detector
Identifies potential duplicate reimbursement claims in SAP Concur data.
"""

import logging
from typing import Dict, List, Any

import pandas as pd

logger = logging.getLogger(__name__)

DUPLICATE_WINDOW_DAYS = 30


def detect_duplicates(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Detect potential duplicate expenses based on:
    - Same vendor
    - Same amount
    - Same employee
    - Within a 30-day window

    Args:
        df: Expense DataFrame sorted by date.

    Returns:
        List of duplicate record pairs with details.
    """
    findings: List[Dict[str, Any]] = []

    if df.empty:
        return findings

    # Work with a sorted copy
    sorted_df = df.sort_values(["employeeId", "vendor", "amount", "expenseDate"]).reset_index(drop=True)

    # Group by employee + vendor + amount for efficiency
    groups = sorted_df.groupby(["employeeId", "vendor", "amount"])

    seen_pairs: set = set()

    for (emp_id, vendor, amount), group in groups:
        if len(group) < 2:
            continue

        records = group.reset_index(drop=True)

        for i in range(len(records)):
            for j in range(i + 1, len(records)):
                row_a = records.iloc[i]
                row_b = records.iloc[j]

                date_a = row_a["expenseDate"]
                date_b = row_b["expenseDate"]

                delta_days = abs((date_b - date_a).days)
                if delta_days <= DUPLICATE_WINDOW_DAYS:
                    pair_key = tuple(sorted([row_a["reportId"], row_b["reportId"]]))
                    if pair_key in seen_pairs:
                        continue
                    seen_pairs.add(pair_key)

                    findings.append({
                        "reportId_A": row_a["reportId"],
                        "reportId_B": row_b["reportId"],
                        "employeeId": emp_id,
                        "employeeName": row_a["employeeName"],
                        "department": row_a["department"],
                        "vendor": vendor,
                        "amount": amount,
                        "expenseDate_A": str(date_a.date()),
                        "expenseDate_B": str(date_b.date()),
                        "daysBetween": delta_days,
                        "expenseType": row_a["expenseType"],
                        "city": row_a["city"],
                        "anomalyType": "Duplicate Claim",
                        "detail": (
                            f"Same vendor '{vendor}' and amount ${amount:.2f} "
                            f"submitted {delta_days} days apart "
                            f"({row_a['reportId']} vs {row_b['reportId']})"
                        ),
                    })

    logger.info(f"Duplicate detection: {len(findings)} potential duplicates found.")
    return findings


def get_duplicate_report_ids(duplicates: List[Dict[str, Any]]) -> set:
    """
    Extract all report IDs involved in duplicate claims.

    Args:
        duplicates: List of duplicate findings from detect_duplicates().

    Returns:
        Set of report IDs flagged as duplicates.
    """
    ids = set()
    for dup in duplicates:
        ids.add(dup["reportId_A"])
        ids.add(dup["reportId_B"])
    return ids
