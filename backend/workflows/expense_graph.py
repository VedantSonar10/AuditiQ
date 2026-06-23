"""
Expense Analysis Workflow
LangGraph-based pipeline for processing SAP Concur expense data.
"""

import logging
from typing import Any, Dict, Optional, TypedDict

import pandas as pd

from risk_engine.anomaly_detector import run_all_anomaly_checks
from risk_engine.duplicate_detector import detect_duplicates
from risk_engine.risk_scoring import calculate_risk_scores, get_employee_risk_summary
from ai.ai_narrator import generate_batch_insights, generate_executive_summary

logger = logging.getLogger(__name__)


# ─── State Schema ────────────────────────────────────────────────────────────

class ExpenseState(TypedDict, total=False):
    """Typed state object passed between LangGraph nodes."""
    raw_df: Optional[pd.DataFrame]
    anomalies: Optional[Dict[str, Any]]
    duplicates: Optional[list]
    scored_df: Optional[pd.DataFrame]
    employee_summary: Optional[pd.DataFrame]
    ai_insights: Optional[list]
    executive_summary: Optional[str]
    summary_metrics: Optional[Dict[str, Any]]
    error: Optional[str]
    api_key: Optional[str]


# ─── Node Functions ───────────────────────────────────────────────────────────

def fetch_reports(state: ExpenseState) -> ExpenseState:
    """
    Node: Validate and prepare the loaded DataFrame.

    Args:
        state: Current workflow state.

    Returns:
        Updated state.
    """
    logger.info("Node: fetch_reports — validating data...")
    df = state.get("raw_df")

    if df is None or df.empty:
        return {**state, "error": "No expense data loaded. Please upload a JSON file."}

    logger.info(f"Data ready: {len(df)} records across {df['department'].nunique()} departments.")
    return {**state, "raw_df": df}


def run_anomaly_detection(state: ExpenseState) -> ExpenseState:
    """
    Node: Run all anomaly detection checks.

    Args:
        state: Current workflow state.

    Returns:
        Updated state with anomaly findings.
    """
    if state.get("error"):
        return state

    logger.info("Node: run_anomaly_detection...")
    df = state["raw_df"]

    try:
        anomalies = run_all_anomaly_checks(df)
        total = sum(len(v) for v in anomalies.values())
        logger.info(f"Anomaly detection complete: {total} total findings.")
        return {**state, "anomalies": anomalies}
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}")
        return {**state, "anomalies": {}, "error": f"Anomaly detection error: {e}"}


def run_duplicate_detection(state: ExpenseState) -> ExpenseState:
    """
    Node: Run duplicate expense detection.

    Args:
        state: Current workflow state.

    Returns:
        Updated state with duplicate findings.
    """
    if state.get("error"):
        return state

    logger.info("Node: run_duplicate_detection...")
    df = state["raw_df"]

    try:
        duplicates = detect_duplicates(df)
        logger.info(f"Duplicate detection complete: {len(duplicates)} pairs found.")
        return {**state, "duplicates": duplicates}
    except Exception as e:
        logger.error(f"Duplicate detection failed: {e}")
        return {**state, "duplicates": [], "error": f"Duplicate detection error: {e}"}


def calculate_scores(state: ExpenseState) -> ExpenseState:
    """
    Node: Calculate risk scores for all expense records.

    Args:
        state: Current workflow state.

    Returns:
        Updated state with scored DataFrame.
    """
    if state.get("error"):
        return state

    logger.info("Node: calculate_scores...")
    df = state["raw_df"]
    anomalies = state.get("anomalies", {})
    duplicates = state.get("duplicates", [])

    try:
        scored_df = calculate_risk_scores(df, anomalies, duplicates)
        emp_summary = get_employee_risk_summary(scored_df)
        logger.info("Risk scoring complete.")
        return {**state, "scored_df": scored_df, "employee_summary": emp_summary}
    except Exception as e:
        logger.error(f"Risk scoring failed: {e}")
        return {**state, "error": f"Risk scoring error: {e}"}


def generate_ai_insights(state: ExpenseState) -> ExpenseState:
    """
    Node: Generate AI-powered audit insights for high-risk records.

    Args:
        state: Current workflow state.

    Returns:
        Updated state with AI insights.
    """
    if state.get("error"):
        return state

    logger.info("Node: generate_ai_insights...")
    scored_df = state.get("scored_df")
    api_key = state.get("api_key", "")

    try:
        insights = generate_batch_insights(scored_df, api_key=api_key, max_records=10)
        logger.info(f"AI insights generated for {len(insights)} records.")
        return {**state, "ai_insights": insights}
    except Exception as e:
        logger.warning(f"AI insights generation warning: {e}")
        return {**state, "ai_insights": []}


def generate_summary(state: ExpenseState) -> ExpenseState:
    """
    Node: Generate executive summary and aggregate metrics.

    Args:
        state: Current workflow state.

    Returns:
        Updated state with summary metrics and executive summary.
    """
    if state.get("error"):
        return state

    logger.info("Node: generate_summary...")
    scored_df = state.get("scored_df")
    duplicates = state.get("duplicates", [])
    api_key = state.get("api_key", "")

    try:
        metrics = {
            "total_reports": len(scored_df),
            "high_risk": int((scored_df["risk_level"] == "High").sum()),
            "medium_risk": int((scored_df["risk_level"] == "Medium").sum()),
            "low_risk": int((scored_df["risk_level"] == "Low").sum()),
            "potential_duplicates": len(duplicates),
            "total_spend": float(scored_df["amount"].sum()),
            "avg_risk_score": float(scored_df["risk_score"].mean()),
        }

        exec_summary = generate_executive_summary(scored_df, api_key=api_key)
        logger.info("Executive summary generated.")
        return {**state, "summary_metrics": metrics, "executive_summary": exec_summary}
    except Exception as e:
        logger.error(f"Summary generation failed: {e}")
        return {**state, "error": f"Summary generation error: {e}"}


# ─── Graph Construction ───────────────────────────────────────────────────────

def build_expense_graph():
    """
    Build and compile the LangGraph expense analysis workflow.

    Returns:
        Compiled LangGraph StateGraph.
    """
    try:
        from langgraph.graph import StateGraph, END

        graph = StateGraph(ExpenseState)

        graph.add_node("fetch_reports", fetch_reports)
        graph.add_node("run_anomaly_detection", run_anomaly_detection)
        graph.add_node("run_duplicate_detection", run_duplicate_detection)
        graph.add_node("calculate_scores", calculate_scores)
        graph.add_node("generate_ai_insights", generate_ai_insights)
        graph.add_node("generate_summary", generate_summary)

        graph.set_entry_point("fetch_reports")
        graph.add_edge("fetch_reports", "run_anomaly_detection")
        graph.add_edge("run_anomaly_detection", "run_duplicate_detection")
        graph.add_edge("run_duplicate_detection", "calculate_scores")
        graph.add_edge("calculate_scores", "generate_ai_insights")
        graph.add_edge("generate_ai_insights", "generate_summary")
        graph.add_edge("generate_summary", END)

        return graph.compile()

    except ImportError:
        logger.warning("LangGraph not available — using sequential fallback pipeline.")
        return None


def run_expense_pipeline(
    df: pd.DataFrame,
    api_key: str = "",
    use_langgraph: bool = True,
) -> ExpenseState:
    """
    Run the full expense analysis pipeline.

    Attempts to use LangGraph if available; falls back to sequential execution.

    Args:
        df: Loaded expense DataFrame.
        api_key: Optional Gemini API key.
        use_langgraph: Whether to attempt LangGraph execution.

    Returns:
        Final workflow state with all analysis results.
    """
    initial_state: ExpenseState = {
        "raw_df": df,
        "api_key": api_key,
        "anomalies": None,
        "duplicates": None,
        "scored_df": None,
        "employee_summary": None,
        "ai_insights": None,
        "executive_summary": None,
        "summary_metrics": None,
        "error": None,
    }

    if use_langgraph:
        graph = build_expense_graph()
        if graph:
            try:
                logger.info("Running pipeline via LangGraph...")
                return graph.invoke(initial_state)
            except Exception as e:
                logger.warning(f"LangGraph execution failed: {e}. Falling back to sequential.")

    # Sequential fallback
    logger.info("Running pipeline sequentially...")
    state = fetch_reports(initial_state)
    state = run_anomaly_detection(state)
    state = run_duplicate_detection(state)
    state = calculate_scores(state)
    state = generate_ai_insights(state)
    state = generate_summary(state)
    return state
