"""
AuditIQ FastAPI Backend
Exposes the existing Python risk engine as a REST API.
"""

import json
import logging
import os
import sys
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

# Make engine importable
sys.path.insert(0, str(Path(__file__).parent))

from utils.data_loader import load_json, load_uploaded_json
from workflows.expense_graph import run_expense_pipeline
from reports.pdf_generator import generate_pdf

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AuditIQ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_DATA = Path(__file__).parent / "data" / "sample_expenses.json"


class SampleRequest(BaseModel):
    gemini_key: Optional[str] = ""


def _pipeline_result_to_dict(result: dict) -> dict:
    """Convert pipeline result (with DataFrames) to JSON-serialisable dict."""
    scored = result.get("scored_df")
    emp    = result.get("employee_summary")
    dups   = result.get("duplicates", [])
    anoms  = result.get("anomalies", {})
    insights = result.get("ai_insights", [])

    def fix_record(r: dict) -> dict:
        """Convert any non-JSON-safe values."""
        out = {}
        for k, v in r.items():
            if hasattr(v, "isoformat"):          # datetime / Timestamp
                out[k] = str(v.date()) if hasattr(v, "date") else str(v)
            elif hasattr(v, "item"):             # numpy scalar
                out[k] = v.item()
            else:
                out[k] = v
        return out

    scored_records = [fix_record(r) for r in scored.to_dict("records")] if scored is not None else []
    emp_records    = [fix_record(r) for r in emp.to_dict("records")]    if emp is not None else []

    # Fix insights — scored_df rows + ai_insight dicts
    clean_insights = []
    for ins in insights:
        clean = fix_record(ins)
        clean_insights.append(clean)

    return {
        "scored_expenses":   scored_records,
        "anomalies":         anoms,
        "duplicates":        dups,
        "employee_summary":  emp_records,
        "ai_insights":       clean_insights,
        "executive_summary": result.get("executive_summary", ""),
        "summary_metrics":   result.get("summary_metrics", {}),
        "error":             result.get("error"),
    }


@app.post("/analyze/sample")
async def analyze_sample(req: SampleRequest):
    """Run analysis on the built-in sample dataset."""
    if not SAMPLE_DATA.exists():
        raise HTTPException(status_code=404, detail="Sample data not found.")
    try:
        df     = load_json(str(SAMPLE_DATA))
        result = run_expense_pipeline(df, api_key=req.gemini_key or "", use_langgraph=False)
        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])
        return _pipeline_result_to_dict(result)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Sample analysis failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/upload")
async def analyze_upload(
    file: UploadFile = File(...),
    gemini_key: str  = Form(""),
):
    """Run analysis on an uploaded JSON file."""
    if not file.filename or not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="File must be a .json")
    try:
        import io
        content = await file.read()
        df = load_uploaded_json(io.BytesIO(content))
        result = run_expense_pipeline(df, api_key=gemini_key, use_langgraph=False)
        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])
        return _pipeline_result_to_dict(result)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Upload analysis failed")
        raise HTTPException(status_code=500, detail=str(e))


class PdfRequest(BaseModel):
    summary_metrics: dict
    duplicates: list


@app.post("/report/pdf")
async def generate_report(req: PdfRequest):
    """Generate and return the audit PDF."""
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            path = tmp.name

        findings = {
            "duplicates":        req.duplicates,
            "top_risk_employees": [],
        }
        generate_pdf(req.summary_metrics, findings, path)
        return FileResponse(
            path,
            media_type="application/pdf",
            filename="AuditIQ_Report.pdf",
        )
    except Exception as e:
        logger.exception("PDF generation failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
