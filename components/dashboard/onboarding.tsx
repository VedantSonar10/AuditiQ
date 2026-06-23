"use client";
import { useRef } from "react";
import { Upload, Database, Sparkles, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import type { AnalysisResult } from "@/types";

export function OnboardingPanel() {
  const { setResult, setLoading, loading, geminiKey, setGeminiKey } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  async function runAnalysis(file?: File) {
    setLoading(true);
    try {
      let resp: Response;
      if (file) {
        const body = new FormData();
        body.append("file", file);
        if (geminiKey) body.append("gemini_key", geminiKey);
        resp = await fetch("/api/analyze", { method:"POST", body });
      } else {
        const url = "/api/analyze?sample=true" + (geminiKey ? `&gemini_key=${encodeURIComponent(geminiKey)}` : "");
        resp = await fetch(url);
      }
      if (!resp.ok) throw new Error(`API error ${resp.status}`);
      const data: AnalysisResult = await resp.json();
      setResult(data);
    } catch (e) { console.error("Analysis failed:", e); }
    finally { setLoading(false); }
  }

  const BtnPrimary: React.CSSProperties = {
    width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
    padding:"10px 20px", borderRadius:8, background:"#1659F5", color:"#fff",
    fontSize:13, fontWeight:600, border:"none", cursor:"pointer",
    opacity: loading ? 0.5 : 1,
  };
  const BtnSecondary: React.CSSProperties = {
    ...BtnPrimary,
    background:"#0A1628", border:"1px solid #0E1E33", color:"#9BB8D8",
  };

  return (
    <div style={{ padding:"40px 48px 48px", maxWidth:880, margin:"0 auto" }}>
      {/* Hero */}
      <div style={{ marginBottom:40 }}>
        <div className="eyebrow" style={{ marginBottom:12 }}>AI-Powered Expense Risk Intelligence</div>
        <h1 style={{ fontSize:32, fontWeight:800, color:"#E6EFF8", letterSpacing:"-0.03em", lineHeight:1.15, margin:0 }}>
          Stop reimbursing <span style={{ color:"#1659F5" }}>risk</span>.<br/>
          Start auditing with precision.
        </h1>
        <p style={{ fontSize:14, color:"#3D5975", lineHeight:1.7, maxWidth:520, marginTop:12 }}>
          AuditIQ analyzes SAP Concur expense data to surface duplicate claims, peer benchmark
          outliers, weekend expenses, and anomalies — before they become financial liabilities.
        </p>
        <div style={{ display:"inline-block", marginTop:16, padding:"5px 12px", borderRadius:5,
                      fontSize:10, fontWeight:700, color:"#1659F5", letterSpacing:"0.12em",
                      background:"rgba(22,89,245,0.08)", border:"1px solid rgba(22,89,245,0.18)",
                      textTransform:"uppercase" }}>
          Concur enforces policy · AI identifies risk
        </div>
      </div>

      {/* Load actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <div style={{ background:"#080F1E", border:"1px solid #0E1E33", borderRadius:10, padding:22 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"rgba(22,89,245,0.1)", border:"1px solid rgba(22,89,245,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Database size={14} color="#4D8EFF"/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#E6EFF8" }}>Use Sample Data</div>
              <div style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.1em" }}>Quick Start</div>
            </div>
          </div>
          <p style={{ fontSize:12, color:"#3D5975", lineHeight:1.6, marginBottom:16 }}>
            120 pre-loaded SAP Concur records with anomalies, duplicates, peer outliers, and weekend expenses.
          </p>
          <button style={BtnPrimary} onClick={() => runAnalysis()} disabled={loading}>
            {loading ? "Running analysis…" : <><span>Load Sample Data</span><ArrowRight size={14}/></>}
          </button>
        </div>

        <div style={{ background:"#080F1E", border:"1px solid #0E1E33", borderRadius:10, padding:22 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"rgba(61,89,117,0.12)", border:"1px solid rgba(61,89,117,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Upload size={14} color="#9BB8D8"/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#E6EFF8" }}>Upload Concur Export</div>
              <div style={{ fontSize:10, fontWeight:700, color:"#3D5975", textTransform:"uppercase", letterSpacing:"0.1em" }}>Your Data</div>
            </div>
          </div>
          <p style={{ fontSize:12, color:"#3D5975", lineHeight:1.6, marginBottom:16 }}>
            Upload a JSON export from SAP Concur. AuditIQ validates, parses, and runs the full risk pipeline.
          </p>
          <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) runAnalysis(f); }}/>
          <button style={BtnSecondary} onClick={() => fileRef.current?.click()} disabled={loading}>
            <Upload size={14}/> Select JSON File
          </button>
        </div>
      </div>

      {/* Gemini */}
      <div style={{ background:"#080F1E", border:"1px solid #0E1E33", borderRadius:10, padding:16, display:"flex", alignItems:"center", gap:14, marginBottom:40 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Sparkles size={14} color="#A78BFA"/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#E6EFF8" }}>Gemini AI Narratives</div>
          <div style={{ fontSize:11, color:"#3D5975" }}>Optional — enables CFO-grade audit language. Falls back to rule-based engine.</div>
        </div>
        <input type="password" placeholder="AIza… (optional)" value={geminiKey}
          onChange={e => setGeminiKey(e.target.value)}
          style={{ width:220, padding:"8px 12px", borderRadius:8, background:"#030B18", border:"1px solid #152B4A", fontSize:12, color:"#E6EFF8", outline:"none" }}/>
        <span className={`status-pill ${geminiKey ? "ok" : "idle"}`} style={{ flexShrink:0 }}>
          <span className="status-dot"/>{geminiKey ? "Connected" : "Optional"}
        </span>
      </div>

      {/* Detection pillars */}
      <div className="eyebrow" style={{ marginBottom:14 }}>What AuditIQ Detects</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { icon:"🔄", title:"Duplicate Claims",   desc:"Same vendor, same amount within 30 days." },
          { icon:"📊", title:"Peer Outliers",      desc:"Spend exceeding 200% of department average." },
          { icon:"📅", title:"Weekend Expenses",   desc:"Saturday/Sunday submissions requiring justification." },
          { icon:"⚡", title:"Spending Anomalies", desc:"Claims 150%+ of employee historical average." },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{ background:"#070E1C", border:"1px solid #0E1E33", borderRadius:10, padding:16 }}>
            <div style={{ fontSize:18, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#E6EFF8", marginBottom:6 }}>{title}</div>
            <div style={{ fontSize:11, color:"#3D5975", lineHeight:1.55 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
