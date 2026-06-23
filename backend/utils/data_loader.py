"""
Data Loader Utility
Handles loading and validating expense data from JSON files.
"""

import json
import logging
from pathlib import Path
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

REQUIRED_FIELDS = [
    "reportId", "employeeId", "employeeName", "department",
    "expenseDate", "expenseType", "vendor", "amount",
    "currency", "city", "approvalStatus"
]


def load_json(filepath: str) -> pd.DataFrame:
    """
    Load expense data from a JSON file into a Pandas DataFrame.

    Args:
        filepath: Path to the JSON file containing expense records.

    Returns:
        A cleaned and typed Pandas DataFrame of expense records.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the JSON is malformed or missing required fields.
    """
    path = Path(filepath)

    if not path.exists():
        raise FileNotFoundError(f"Expense data file not found: {filepath}")

    if path.suffix.lower() != ".json":
        raise ValueError(f"Expected a .json file, got: {path.suffix}")

    try:
        with open(path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON file '{filepath}': {e}")

    if not isinstance(raw_data, list):
        raise ValueError("JSON file must contain a list of expense records.")

    if len(raw_data) == 0:
        raise ValueError("JSON file contains no expense records.")

    df = pd.DataFrame(raw_data)

    # Validate required fields
    missing = [col for col in REQUIRED_FIELDS if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required fields in data: {missing}")

    df = _clean_dataframe(df)
    logger.info(f"Loaded {len(df)} expense records from '{filepath}'.")
    return df


def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and type-cast the raw DataFrame.

    Args:
        df: Raw DataFrame loaded from JSON.

    Returns:
        Cleaned and properly-typed DataFrame.
    """
    # Parse dates
    df["expenseDate"] = pd.to_datetime(df["expenseDate"], errors="coerce")

    # Ensure amount is numeric
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)

    # Strip whitespace from string columns
    str_cols = ["reportId", "employeeId", "employeeName", "department",
                "expenseType", "vendor", "currency", "city", "approvalStatus"]
    for col in str_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    # Drop rows where critical fields are null
    df.dropna(subset=["expenseDate", "amount", "employeeId"], inplace=True)
    df.reset_index(drop=True, inplace=True)

    return df


def load_uploaded_json(uploaded_file) -> Optional[pd.DataFrame]:
    """
    Load expense data from a Streamlit UploadedFile object.

    Args:
        uploaded_file: Streamlit UploadedFile object.

    Returns:
        Cleaned DataFrame or None on failure.
    """
    try:
        raw_data = json.load(uploaded_file)
        if not isinstance(raw_data, list):
            raise ValueError("Uploaded file must contain a JSON array.")
        df = pd.DataFrame(raw_data)
        missing = [col for col in REQUIRED_FIELDS if col not in df.columns]
        if missing:
            raise ValueError(f"Missing required fields: {missing}")
        return _clean_dataframe(df)
    except Exception as e:
        logger.error(f"Failed to load uploaded file: {e}")
        raise
