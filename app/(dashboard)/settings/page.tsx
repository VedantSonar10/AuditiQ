"use client";
import { useRef } from "react";
import { useApp } from "@/lib/store";
import type { AnalysisResult } from "@/types";

export default function SettingsPage() {
  const { geminiKey, setGeminiKey, setResult, setLoading, reset } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const ok = Boolean(geminiKey);

  async function handleUpload(file: File) {
    setLoading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      if (geminiKey) body.append("gemini_key", geminiKey);
      const r = await fetch("/api/analyze", { method:"POST", body });
      if (r.ok) { const d: AnalysisResult = await r.json(); setResult(d); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const CARD = { background:"#070E1C", border:"1px solid #0E1E33", borderRadius:10, padding:"20px 22px", marginBottom:16 };
  const INP  = { width:"100%", padding:"9px 12px", borderRadius:8, background:"#030B18", border:"1px solid #152B4A", fontSize:13, color:"#E6EFF8", outline:"none", boxSizing:"border-box" as const };
  const BTN  = { padding:"9px 20px", borderRadius:8, fontSize:13, fontWeight:600, border:"none", cursor:"pointer" };

  return (
    <div style={{ padding:"32px 32px 48px", maxWidth:780 }}>
      <div className="eyebrow" style={{ marginBottom:4 }}>Configuration</div>
      <h1 style={{ fontSize:22, fontWeight:800, color:"#E6EFF8", letterSpacing:"-0.025em", marginBottom:4 }}>Settings</h1>
      <p style={{ fontSize:13, color:"#3D5975", marginBottom:24 }}>Configure AI integrations, data sources, and analysis parameters.</p>

      {/* Gemini */}
      <div style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:12 }}>
        AI Configuration
      </div>
      <div style={CARD}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 200px", gap:20, alignItems:"start" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#E6EFF8", marginBottom:8 }}>Gemini API Key</div>
            <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)}
              placeholder="AIza… (optional)" style={INP}/>
            <p style={{ fontSize:11, color:"#3D5975", marginTop:8, lineHeight:1.5 }}>
              Enables Gemini 1.5 Flash AI-generated audit narratives in executive-grade language.
              Keys are stored in session memory only — never persisted to disk.
            </p>
          </div>
          <div style={{ background:"#050C18", border:"1px solid #0E1E33", borderRadius:8, padding:16, textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:700, color: ok ? "#6EE7B7" : "#3D5975" }}>
              {ok ? "✓ Configured" : "Not configured"}
            </div>
            <div style={{ fontSize:10, color:"#3D5975", marginTop:4 }}>
              {ok ? "AI narratives active" : "Using rule-based analysis"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop:"1px solid #0E1E33", margin:"24px 0" }}/>

      {/* Data */}
      <div style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:12 }}>
        Data &amp; Analysis
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={CARD}>
          <div style={{ fontSize:13, fontWeight:700, color:"#E6EFF8", marginBottom:6 }}>Upload New Dataset</div>
          <p style={{ fontSize:11, color:"#3D5975", marginBottom:12, lineHeight:1.5 }}>
            Upload a new SAP Concur JSON export to replace the current analysis.
          </p>
          <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }}
            onChange={e => { const f=e.target.files?.[0]; if(f) handleUpload(f); }}/>
          <button onClick={() => fileRef.current?.click()}
            style={{ ...BTN, background:"#0A1628", border:"1px solid #0E1E33", color:"#9BB8D8" }}>
            Select JSON File
          </button>
        </div>
        <div style={CARD}>
          <div style={{ fontSize:13, fontWeight:700, color:"#E6EFF8", marginBottom:6 }}>Reset Session</div>
          <p style={{ fontSize:11, color:"#3D5975", marginBottom:12, lineHeight:1.5 }}>
            Clear all analysis data and return to the onboarding screen.
          </p>
          <button onClick={reset}
            style={{ ...BTN, background:"rgba(201,54,54,0.1)", border:"1px solid rgba(201,54,54,0.2)", color:"#FCA5A5" }}>
            Reset All Data
          </button>
        </div>
      </div>

      <div style={{ borderTop:"1px solid #0E1E33", margin:"24px 0" }}/>

      {/* About */}
      <div style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:12 }}>
        About AuditIQ
      </div>
      <div style={{ background:"#070E1C", border:"1px solid #0E1E33", borderRadius:10, padding:"20px 22px" }}>
        <div style={{ fontSize:13, color:"#6A8BAD", lineHeight:1.8 }}>
          <strong style={{ color:"#E6EFF8" }}>AuditIQ</strong> is an AI-Powered Expense Risk Intelligence Platform
          that analyzes SAP Concur expense data to identify spending anomalies, duplicate reimbursements,
          peer outliers, and compliance risks — before they become financial liabilities.<br/><br/>
          <strong style={{ color:"#E6EFF8" }}>Tech Stack:</strong> Next.js 15 · TypeScript · FastAPI · Python · Recharts · Tailwind<br/>
          <strong style={{ color:"#E6EFF8" }}>Backend:</strong> LangGraph pipeline · Gemini AI narrator · Rule-based fallback<br/><br/>
          <span style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.14em" }}>
            Concur enforces policy · AI identifies risk
          </span>
        </div>
      </div>
    </div>
  );
}
