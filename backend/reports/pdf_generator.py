"""
PDF Report Generator
Generates professional audit PDF reports using FPDF2.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List

from fpdf import FPDF

logger = logging.getLogger(__name__)


class AuditReport(FPDF):
    """Custom FPDF class for the Concur AI Audit Report."""

    BRAND_BLUE = (30, 64, 175)
    BRAND_DARK = (15, 23, 42)
    ACCENT_RED = (239, 68, 68)
    ACCENT_AMBER = (245, 158, 11)
    ACCENT_GREEN = (16, 185, 129)
    GRAY = (100, 116, 139)
    LIGHT_GRAY = (241, 245, 249)
    WHITE = (255, 255, 255)

    def header(self):
        """Render page header with branding."""
        self.set_fill_color(*self.BRAND_DARK)
        self.rect(0, 0, 210, 18, "F")
        self.set_text_color(*self.WHITE)
        self.set_font("Helvetica", "B", 10)
        self.set_xy(10, 5)
        self.cell(0, 8, "CONCUR AI DASHBOARD  |  AUDIT REPORT  |  CONFIDENTIAL", align="L")
        self.set_xy(0, 5)
        self.cell(200, 8, f"Page {self.page_no()}", align="R")
        self.ln(14)

    def footer(self):
        """Render page footer."""
        self.set_y(-15)
        self.set_fill_color(*self.BRAND_DARK)
        self.rect(0, self.get_y(), 210, 15, "F")
        self.set_text_color(*self.GRAY)
        self.set_font("Helvetica", "I", 8)
        generated = datetime.now().strftime("%B %d, %Y at %H:%M")
        self.cell(0, 10, f"Generated: {generated}  |  AI-Powered SAP Concur Expense Intelligence", align="C")

    def section_title(self, title: str):
        """Render a section title block."""
        self.set_fill_color(*self.BRAND_BLUE)
        self.set_text_color(*self.WHITE)
        self.set_font("Helvetica", "B", 12)
        self.cell(0, 9, f"  {title}", ln=True, fill=True)
        self.ln(3)

    def kpi_card(self, label: str, value: str, color: tuple):
        """Render a KPI card."""
        x = self.get_x()
        y = self.get_y()
        w = 42
        h = 22

        self.set_fill_color(*self.LIGHT_GRAY)
        self.rect(x, y, w, h, "F")
        self.set_fill_color(*color)
        self.rect(x, y, 3, h, "F")

        self.set_text_color(*self.GRAY)
        self.set_font("Helvetica", "", 7)
        self.set_xy(x + 5, y + 4)
        self.cell(w - 5, 4, label.upper(), ln=True)

        self.set_text_color(*self.BRAND_DARK)
        self.set_font("Helvetica", "B", 14)
        self.set_xy(x + 5, y + 10)
        self.cell(w - 5, 8, str(value))


def generate_pdf(
    summary_data: Dict[str, Any],
    findings: Dict[str, Any],
    output_path: str = "/tmp/audit_report.pdf",
) -> str:
    """
    Generate a professional PDF audit report.

    Args:
        summary_data: Dictionary with aggregate metrics.
        findings: Dictionary with anomaly and duplicate findings.
        output_path: File path for the output PDF.

    Returns:
        Path to the generated PDF file.
    """
    pdf = AuditReport(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # ─── Cover / Title ────────────────────────────────────────────────
    pdf.set_fill_color(*AuditReport.BRAND_DARK)
    pdf.rect(0, 18, 210, 55, "F")

    pdf.set_text_color(*AuditReport.WHITE)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_xy(15, 25)
    pdf.cell(0, 10, "CONCUR AI DASHBOARD", ln=True)

    pdf.set_font("Helvetica", "", 13)
    pdf.set_xy(15, 37)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 7, "AI-Powered SAP Concur Expense Intelligence Report", ln=True)

    pdf.set_text_color(*AuditReport.WHITE)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_xy(15, 50)
    generated = datetime.now().strftime("%B %d, %Y")
    pdf.cell(0, 6, f"Report Date: {generated}", ln=True)
    pdf.set_xy(15, 57)
    pdf.cell(0, 6, "Classification: CONFIDENTIAL - For Internal Audit Use Only", ln=True)
    pdf.ln(30)

    # ─── Executive Summary KPI Row ────────────────────────────────────
    pdf.section_title("EXECUTIVE SUMMARY")

    total = summary_data.get("total_reports", 0)
    high = summary_data.get("high_risk", 0)
    medium = summary_data.get("medium_risk", 0)
    low = summary_data.get("low_risk", 0)
    duplicates = summary_data.get("potential_duplicates", 0)
    total_spend = summary_data.get("total_spend", 0.0)

    kpi_data = [
        ("Total Reports", str(total), AuditReport.BRAND_BLUE),
        ("High Risk", str(high), AuditReport.ACCENT_RED),
        ("Medium Risk", str(medium), AuditReport.ACCENT_AMBER),
        ("Low Risk", str(low), AuditReport.ACCENT_GREEN),
        ("Duplicates", str(duplicates), AuditReport.BRAND_BLUE),
    ]

    start_x = 10
    gap = 4
    card_w = 38
    y_pos = pdf.get_y()

    for i, (label, value, color) in enumerate(kpi_data):
        pdf.set_xy(start_x + i * (card_w + gap), y_pos)
        pdf.kpi_card(label, value, color)

    pdf.ln(30)

    # Total spend row
    pdf.set_fill_color(*AuditReport.LIGHT_GRAY)
    pdf.set_text_color(*AuditReport.BRAND_DARK)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 10, f"   Total Spend Analyzed: ${total_spend:,.2f} USD", ln=True, fill=True)
    pdf.ln(5)

    # ─── Risk Overview ────────────────────────────────────────────────
    pdf.section_title("RISK ASSESSMENT OVERVIEW")

    risk_pct = (high / total * 100) if total > 0 else 0
    concern = "ELEVATED" if risk_pct > 20 else "MODERATE" if risk_pct > 10 else "LOW"

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*AuditReport.BRAND_DARK)
    pdf.multi_cell(
        0, 6,
        f"This audit analyzed {total} expense reports totaling ${total_spend:,.2f} USD. "
        f"The AI risk engine identified {high} high-risk ({risk_pct:.1f}%), "
        f"{medium} medium-risk ({medium / total * 100:.1f}%), "
        f"and {low} low-risk records.\n\n"
        f"Overall Risk Exposure: {concern}. "
        f"{'Immediate escalation to the Internal Audit Committee is recommended.' if concern == 'ELEVATED' else 'Standard review procedures apply.'}",
    )
    pdf.ln(5)

    # ─── Duplicate Findings ───────────────────────────────────────────
    dup_findings: List[Dict] = findings.get("duplicates", [])
    if dup_findings:
        pdf.section_title(f"DUPLICATE CLAIM FINDINGS ({len(dup_findings)} Cases)")

        headers = ["Employee", "Vendor", "Amount", "Date A", "Date B", "Days Apart"]
        col_widths = [38, 40, 20, 22, 22, 22]

        # Table header
        pdf.set_fill_color(*AuditReport.BRAND_BLUE)
        pdf.set_text_color(*AuditReport.WHITE)
        pdf.set_font("Helvetica", "B", 8)
        for h, w in zip(headers, col_widths):
            pdf.cell(w, 7, h, border=0, fill=True, align="C")
        pdf.ln()

        # Table rows
        for i, dup in enumerate(dup_findings[:15]):
            pdf.set_fill_color(245, 247, 250) if i % 2 == 0 else pdf.set_fill_color(*AuditReport.WHITE)
            pdf.set_text_color(*AuditReport.BRAND_DARK)
            pdf.set_font("Helvetica", "", 8)
            pdf.cell(col_widths[0], 6, dup.get("employeeName", "")[:22], fill=True)
            pdf.cell(col_widths[1], 6, dup.get("vendor", "")[:24], fill=True)
            pdf.cell(col_widths[2], 6, f"${dup.get('amount', 0):.2f}", fill=True, align="R")
            pdf.cell(col_widths[3], 6, str(dup.get("expenseDate_A", ""))[:10], fill=True, align="C")
            pdf.cell(col_widths[4], 6, str(dup.get("expenseDate_B", ""))[:10], fill=True, align="C")
            pdf.cell(col_widths[5], 6, str(dup.get("daysBetween", "")), fill=True, align="C")
            pdf.ln()

        if len(dup_findings) > 15:
            pdf.set_text_color(*AuditReport.GRAY)
            pdf.set_font("Helvetica", "I", 8)
            pdf.cell(0, 6, f"  ... and {len(dup_findings) - 15} additional duplicate cases.", ln=True)
        pdf.ln(5)

    # ─── Top Risk Employees ───────────────────────────────────────────
    top_employees: List[Dict] = findings.get("top_risk_employees", [])
    if top_employees:
        pdf.add_page()
        pdf.section_title("TOP RISK EMPLOYEES")

        headers = ["Employee", "Department", "Total Spend", "Avg Risk Score", "High Risk"]
        col_widths = [45, 35, 30, 35, 25]

        pdf.set_fill_color(*AuditReport.BRAND_BLUE)
        pdf.set_text_color(*AuditReport.WHITE)
        pdf.set_font("Helvetica", "B", 8)
        for h, w in zip(headers, col_widths):
            pdf.cell(w, 7, h, border=0, fill=True, align="C")
        pdf.ln()

        for i, emp in enumerate(top_employees[:10]):
            pdf.set_fill_color(245, 247, 250) if i % 2 == 0 else pdf.set_fill_color(*AuditReport.WHITE)
            pdf.set_text_color(*AuditReport.BRAND_DARK)
            pdf.set_font("Helvetica", "", 8)
            pdf.cell(col_widths[0], 6, emp.get("employeeName", "")[:28], fill=True)
            pdf.cell(col_widths[1], 6, emp.get("department", ""), fill=True, align="C")
            pdf.cell(col_widths[2], 6, f"${emp.get('total_amount', 0):,.2f}", fill=True, align="R")
            pdf.cell(col_widths[3], 6, f"{emp.get('avg_risk_score', 0):.1f}/100", fill=True, align="C")
            pdf.cell(col_widths[4], 6, str(emp.get("high_risk_count", 0)), fill=True, align="C")
            pdf.ln()
        pdf.ln(5)

    # ─── Recommendations ─────────────────────────────────────────────
    pdf.section_title("AUDIT RECOMMENDATIONS")

    recommendations = [
        ("1. Immediate Review", "All High-Risk flagged expense reports should be escalated to senior auditors within 48 hours for manual verification and receipt validation."),
        ("2. Duplicate Claim Recovery", f"Initiate recovery procedures for the {len(dup_findings)} identified duplicate claims. Cross-reference with payroll and reimbursement history."),
        ("3. Policy Communication", "Distribute T&E policy reminders to departments with elevated risk scores, with specific focus on weekend expense justification and meal limits."),
        ("4. Peer Benchmark Calibration", "Review per-diem and entertainment limits against current market rates. Update Concur policy rules to auto-flag peer outliers at submission."),
        ("5. Continuous Monitoring", "Implement monthly AI audit cycles to track risk score trends over time and identify repeat offenders early."),
    ]

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*AuditReport.BRAND_DARK)
    for title, body in recommendations:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 7, title, ln=True)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*AuditReport.GRAY)
        pdf.multi_cell(0, 5, f"  {body}")
        pdf.set_text_color(*AuditReport.BRAND_DARK)
        pdf.ln(2)

    # ─── Disclaimer ───────────────────────────────────────────────────
    pdf.ln(5)
    pdf.set_fill_color(*AuditReport.LIGHT_GRAY)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(*AuditReport.GRAY)
    pdf.multi_cell(
        0, 5,
        "DISCLAIMER: This report is generated by the Concur AI Dashboard - an advisory tool that identifies patterns and anomalies "
        "in expense data. It does not replace SAP Concur's built-in audit rules, approval workflows, or compliance validations. "
        "All findings require human review before action.",
        fill=True,
    )

    pdf.output(output_path)
    logger.info(f"Audit PDF generated: {output_path}")
    return output_path
