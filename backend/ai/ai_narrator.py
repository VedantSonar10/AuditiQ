"""
AI Narrator
Generates professional audit insights using the Gemini API.
Falls back to rule-based narratives when API key is unavailable.
"""

import logging
import os
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


AUDIT_SYSTEM_PROMPT = """You are a senior finance compliance auditor at a Fortune 500 company.
You analyze SAP Concur expense data and provide concise, professional audit assessments.
Respond in structured audit language. Be specific, factual, and actionable.
Keep your response under 200 words."""


def generate_insight(expense_record: Dict[str, Any], api_key: str = "") -> Dict[str, str]:
    """
    Generate an AI-powered audit insight for a single expense record.

    Args:
        expense_record: Dictionary containing expense and risk details.
        api_key: Optional Gemini API key (falls back to env var GEMINI_API_KEY).

    Returns:
        Dictionary with keys: risk_level, reason, recommendation, source.
    """
    key = api_key or os.environ.get("GEMINI_API_KEY", "")

    if key:
        try:
            return _gemini_insight(expense_record, key)
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}. Using fallback narrator.")

    return _fallback_insight(expense_record)


def _gemini_insight(record: Dict[str, Any], api_key: str) -> Dict[str, str]:
    """
    Call Gemini API to generate audit insight.

    Args:
        record: Expense record dictionary.
        api_key: Gemini API key.

    Returns:
        Structured audit insight dictionary.
    """
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    flags = record.get("risk_flags", "None")
    prompt = f"""
You are a finance compliance auditor. Analyze the following expense record and provide a structured audit assessment.

EXPENSE RECORD:
- Employee: {record.get('employeeName', 'Unknown')} ({record.get('department', 'N/A')} dept)
- Date: {record.get('expenseDate', 'N/A')}
- Expense Type: {record.get('expenseType', 'N/A')}
- Vendor: {record.get('vendor', 'N/A')}
- Amount: ${record.get('amount', 0):.2f} {record.get('currency', 'USD')}
- City: {record.get('city', 'N/A')}
- Risk Score: {record.get('risk_score', 0)}/100
- Risk Flags: {flags}

Provide a professional audit assessment with:
1. RISK LEVEL: (Low / Medium / High)
2. REASON: Why this expense is flagged (2-3 sentences)
3. RECOMMENDATION: What the auditor should do (2-3 sentences)

Use formal audit language. Be specific and actionable.
"""

    response = model.generate_content(prompt)
    raw_text = response.text.strip()

    # Parse structured response
    risk_level = _extract_section(raw_text, "RISK LEVEL", record.get("risk_level", "Medium"))
    reason = _extract_section(raw_text, "REASON", "Expense pattern warrants further review.")
    recommendation = _extract_section(raw_text, "RECOMMENDATION", "Escalate for manual audit.")

    return {
        "risk_level": risk_level,
        "reason": reason,
        "recommendation": recommendation,
        "source": "Gemini AI",
        "raw": raw_text,
    }


def _extract_section(text: str, section: str, default: str) -> str:
    """
    Extract a section from structured AI response text.

    Args:
        text: Full response text.
        section: Section header to look for.
        default: Default value if section not found.

    Returns:
        Extracted section text.
    """
    import re
    pattern = rf"{section}:\s*(.*?)(?=\n\d+\.|$)"
    match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(1).strip()
    return default


def _fallback_insight(record: Dict[str, Any]) -> Dict[str, str]:
    """
    Rule-based fallback narrator when Gemini API is unavailable.

    Args:
        record: Expense record dictionary.

    Returns:
        Structured audit insight dictionary based on risk flags.
    """
    flags = record.get("risk_flags", "")
    risk_level = record.get("risk_level", "Low")
    amount = record.get("amount", 0)
    emp = record.get("employeeName", "The employee")
    vendor = record.get("vendor", "the vendor")
    expense_type = record.get("expenseType", "expense")
    date = record.get("expenseDate", "N/A")
    dept = record.get("department", "N/A")

    reasons = []
    recommendations = []

    if "Duplicate" in flags:
        reasons.append(
            f"A duplicate claim has been detected for a ${amount:.2f} {expense_type} "
            f"at {vendor}. The same amount was submitted within a 30-day window, "
            f"indicating a potential double-reimbursement scenario."
        )
        recommendations.append(
            "Cross-reference with original approved report and request employee confirmation. "
            "If confirmed duplicate, initiate clawback procedure per company policy."
        )

    if "Peer Outlier" in flags:
        reasons.append(
            f"This {expense_type} expense of ${amount:.2f} significantly exceeds "
            f"the average spend by {dept} peers for the same category, "
            f"triggering a peer benchmark alert."
        )
        recommendations.append(
            "Request supporting documentation and business justification from the employee. "
            "Validate against approved travel policy limits."
        )

    if "High Variance" in flags:
        reasons.append(
            f"The submitted amount of ${amount:.2f} for {expense_type} at {vendor} "
            f"is more than 150% of {emp}'s historical average for this expense type."
        )
        recommendations.append(
            "Review receipts and compare against prior submissions. "
            "Confirm pricing was not inflated or substituted."
        )

    if "Weekend" in flags:
        reasons.append(
            f"This expense was submitted on a weekend ({date}). "
            f"Weekend business expenses require additional approval and justification "
            f"per company T&E policy."
        )
        recommendations.append(
            "Confirm that business activity occurred and obtain manager sign-off "
            "with a brief written justification for the weekend activity."
        )

    if "Unusual Category" in flags:
        reasons.append(
            f"The expense type '{expense_type}' is rarely used by {emp}. "
            f"This one-time use of an uncommon category is flagged for verification."
        )
        recommendations.append(
            "Verify that the expense category is accurately classified and "
            "request a receipt if not already attached."
        )

    if not reasons:
        reasons.append(
            f"This expense of ${amount:.2f} at {vendor} has been reviewed and "
            f"does not exhibit significant anomaly patterns at this time."
        )
        recommendations.append(
            "No immediate action required. Continue standard approval workflow."
        )

    return {
        "risk_level": risk_level,
        "reason": " ".join(reasons),
        "recommendation": " ".join(recommendations),
        "source": "Rule-Based Engine (Gemini API not configured)",
        "raw": "",
    }


def generate_batch_insights(
    scored_df, api_key: str = "", max_records: int = 10
) -> List[Dict[str, Any]]:
    """
    Generate AI insights for the top high-risk records.

    Args:
        scored_df: DataFrame with risk scores.
        api_key: Optional Gemini API key.
        max_records: Maximum number of records to analyze.

    Returns:
        List of expense records with AI insights attached.
    """
    high_risk = scored_df[scored_df["risk_level"] == "High"].head(max_records)

    if high_risk.empty:
        high_risk = scored_df.nlargest(max_records, "risk_score")

    results = []
    for _, row in high_risk.iterrows():
        record = row.to_dict()
        if "expenseDate" in record and hasattr(record["expenseDate"], "date"):
            record["expenseDate"] = str(record["expenseDate"].date())
        insight = generate_insight(record, api_key)
        record["ai_insight"] = insight
        results.append(record)

    return results


def generate_executive_summary(scored_df, api_key: str = "") -> str:
    """
    Generate an executive-level AI summary of the audit findings.

    Args:
        scored_df: DataFrame with risk scores.
        api_key: Optional Gemini API key.

    Returns:
        Executive summary string.
    """
    total = len(scored_df)
    high = (scored_df["risk_level"] == "High").sum()
    medium = (scored_df["risk_level"] == "Medium").sum()
    low = (scored_df["risk_level"] == "Low").sum()
    total_spend = scored_df["amount"].sum()
    avg_risk = scored_df["risk_score"].mean()

    key = api_key or os.environ.get("GEMINI_API_KEY", "")

    if key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
You are a Chief Audit Executive preparing an executive summary for the board.

AUDIT STATISTICS:
- Total Expense Reports Reviewed: {total}
- Total Spend Analyzed: ${total_spend:,.2f}
- High Risk Reports: {high} ({high/total*100:.1f}%)
- Medium Risk Reports: {medium} ({medium/total*100:.1f}%)
- Low Risk Reports: {low} ({low/total*100:.1f}%)
- Average Risk Score: {avg_risk:.1f}/100

Write a concise executive summary (3-4 paragraphs) covering:
1. Overall risk landscape
2. Key areas of concern
3. Recommended actions for the finance leadership team

Use formal, executive-level language.
"""
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini executive summary failed: {e}")

    # Fallback
    risk_pct = high / total * 100 if total > 0 else 0
    concern = "elevated" if risk_pct > 20 else "moderate" if risk_pct > 10 else "low"

    return f"""**EXECUTIVE AUDIT SUMMARY**

This audit reviewed {total} expense reports totaling ${total_spend:,.2f} USD across all departments. The AI-powered analysis identified {high} high-risk ({high/total*100:.1f}%), {medium} medium-risk ({medium/total*100:.1f}%), and {low} low-risk ({low/total*100:.1f}%) records.

The overall risk exposure is assessed as **{concern.upper()}**, with an average risk score of {avg_risk:.1f}/100. High-risk records require immediate review by the internal audit team, focusing on duplicate claims, peer outliers, and weekend expense submissions.

**Recommended Actions:**
• Prioritize manual review of all High-risk flagged reports
• Initiate clawback procedures for confirmed duplicate claims
• Communicate weekend expense policy reminders to flagged employees
• Schedule department-level T&E policy refresher sessions

This analysis is advisory and supplements — not replaces — SAP Concur's built-in audit controls and approval workflows."""
