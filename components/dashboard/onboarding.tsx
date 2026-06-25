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

  const C = {
    surface:  "#080F1E" as const,
    border:   "rgba(255,255,255,0.06)" as const,
    dimText:  "#3D5975" as const,
    bodyText: "#8AADC8" as const,
  };

  return (
    <div style={{ padding:"28px 24px 48px" }}>

      <div style={{ marginBottom:32 }}>
        <div style={{ marginBottom:14 }}>
          <h1 style={{ fontSize:16, fontWeight:600, color:"#E6EFF8", letterSpacing:"-0.01em", margin:0, lineHeight:1 }}>
            Executive Overview
          </h1>
          <p style={{ fontSize:12, color:C.dimText, marginTop:4 }}>
            Load expense data to begin risk analysis.
          </p>
        </div>

        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <button
            onClick={() => runAnalysis()}
            disabled={loading}
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"8px 14px", borderRadius:7,
              background:"#1659F5", color:"#fff",
              fontSize:13, fontWeight:600, border:"none", cursor:"pointer",
              opacity: loading ? 0.55 : 1, transition:"opacity 0.15s",
            }}>
            <Database size={13}/>
            {loading ? "Running analysis…" : "Load Sample Data"}
            {!loading && <ArrowRight size={12}/>}
          </button>

          <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) runAnalysis(f); }}/>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"8px 14px", borderRadius:7,
              background:"transparent", color:C.bodyText,
              fontSize:13, fontWeight:500,
              border:`1px solid ${C.border}`,
              cursor:"pointer", opacity: loading ? 0.55 : 1,
            }}>
            <Upload size={13}/> Upload JSON
          </button>

          <div style={{
            display:"inline-flex", alignItems:"center", gap:8, marginLeft:"auto",
            padding:"6px 12px", borderRadius:7,
            border:`1px solid ${C.border}`, background:C.surface,
          }}>
            <Sparkles size={12} color={geminiKey ? "#A78BFA" : "#2A4A6A"}/>
            <input
              type="password"
              placeholder="Gemini API key (optional)"
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              style={{
                background:"transparent", border:"none", outline:"none",
                fontSize:12, color:"#8AADC8", width:200,
                fontFamily:"inherit",
              }}
            />
            {geminiKey && (
              <span style={{ fontSize:10, color:"#6EE7B7", fontWeight:600 }}>✓</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[
          { label:"Total Reports",    value:"—", sub:"Expense records" },
          { label:"Total Spend",      value:"—", sub:"Portfolio value" },
          { label:"Risk Cases",       value:"—", sub:"High + medium" },
          { label:"Duplicate Claims", value:"—", sub:"Potential pairs" },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{
            background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:8, padding:"14px 16px",
            position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"rgba(255,255,255,0.04)" }}/>
            <div style={{ fontSize:10, fontWeight:500, color:C.dimText, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:"rgba(230,239,248,0.15)", letterSpacing:"-0.02em", lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:11, color:"rgba(61,89,117,0.6)", marginTop:4 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:20 }}>
          <div style={{ fontSize:12, fontWeight:600, color:"rgba(230,239,248,0.35)", marginBottom:16 }}>
            Investigation Queue
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:6, background:"rgba(255,255,255,0.03)", flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ height:8, background:"rgba(255,255,255,0.04)", borderRadius:4, marginBottom:5, width:`${75 - i*10}%` }}/>
                  <div style={{ height:7, background:"rgba(255,255,255,0.025)", borderRadius:4, width:`${55 - i*8}%` }}/>
                </div>
                <div style={{ width:28, height:28, borderRadius:5, background:"rgba(255,255,255,0.03)" }}/>
              </div>
            ))}
          </div>
          <div style={{ marginTop:20, padding:"10px 0", borderTop:"1px solid rgba(255,255,255,0.04)", fontSize:11, color:"rgba(61,89,117,0.5)", textAlign:"center" }}>
            Load data to view flagged reports
          </div>
        </div>

        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:20 }}>
          <div style={{ fontSize:12, fontWeight:600, color:"rgba(230,239,248,0.35)", marginBottom:16 }}>
            Risk Distribution
          </div>
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:"12px 0" }}>
            <div style={{ position:"relative", width:110, height:110 }}>
              <svg viewBox="0 0 110 110" style={{ width:"100%", height:"100%", transform:"rotate(-90deg)" }}>
                <circle cx="55" cy="55" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="18"/>
                <circle cx="55" cy="55" r="40" fill="none" stroke="rgba(201,54,54,0.15)"  strokeWidth="18" strokeDasharray="60 192"/>
                <circle cx="55" cy="55" r="40" fill="none" stroke="rgba(201,125,16,0.12)" strokeWidth="18" strokeDasharray="80 192" strokeDashoffset="-60"/>
                <circle cx="55" cy="55" r="40" fill="none" stroke="rgba(12,138,92,0.1)"   strokeWidth="18" strokeDasharray="52 192" strokeDashoffset="-140"/>
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ fontSize:11, color:"rgba(230,239,248,0.15)", fontWeight:600 }}>—</div>
              </div>
            </div>
            <div style={{ marginLeft:20, display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { color:"rgba(201,54,54,0.4)",  label:"High" },
                { color:"rgba(201,125,16,0.4)", label:"Medium" },
                { color:"rgba(12,138,92,0.4)",  label:"Low" },
              ].map(({ color, label }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:color }}/>
                  <span style={{ fontSize:11, color:"rgba(61,89,117,0.5)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop:8, padding:"10px 0", borderTop:"1px solid rgba(255,255,255,0.04)", fontSize:11, color:"rgba(61,89,117,0.5)", textAlign:"center" }}>
            Load data to view risk split
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
        {[
          { label:"Duplicate Claims",   desc:"Same vendor + amount, 30-day window" },
          { label:"Peer Outliers",      desc:"200%+ above department average" },
          { label:"Weekend Expenses",   desc:"Sat/Sun submissions" },
          { label:"Spending Anomalies", desc:"150%+ above personal average" },
        ].map(({ label, desc }) => (
          <div key={label} style={{ padding:"11px 13px", border:`1px solid ${C.border}`, borderRadius:7, background:"transparent" }}>
            <div style={{ fontSize:12, fontWeight:600, color:"rgba(230,239,248,0.4)", marginBottom:3 }}>{label}</div>
            <div style={{ fontSize:11, color:"rgba(61,89,117,0.6)", lineHeight:1.4 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}