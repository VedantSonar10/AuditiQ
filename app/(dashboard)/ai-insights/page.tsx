"use client";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { AiBadge, RiskBadge } from "@/components/ui/badge";
import { riskColor, parseFlags, FLAG_CONFIG } from "@/lib/utils";

const BOX  = { background:"#060D1A", border:"1px solid #0E1E33", borderRadius:10, padding:"20px 22px", marginBottom:12 };
const HDR  = { display:"flex", alignItems:"center", gap:10, paddingBottom:14, borderBottom:"1px solid #0A1628", marginBottom:14 };
const LBL  = { fontSize:9, fontWeight:600, color:"#3D5975", textTransform:"uppercase" as const, letterSpacing:"0.1em", marginBottom:5, marginTop:12 };
const BODY = { fontSize:13, color:"#6A8BAD", lineHeight:1.75 };

export default function AiInsightsPage() {
  const { result, geminiKey } = useApp();
  const router = useRouter();

  if (!result) {
    return (
      <div style={{ padding:32, textAlign:"center", paddingTop:80 }}>
        <div style={{ fontSize:32, marginBottom:16 }}>◆</div>
        <div style={{ fontSize:18, fontWeight:700, color:"#E6EFF8", marginBottom:8 }}>No Analysis Loaded</div>
        <p style={{ fontSize:13, color:"#3D5975", marginBottom:24 }}>Load expense data from the Executive Overview first.</p>
        <button onClick={() => router.push("/dashboard")}
          style={{ padding:"9px 20px", borderRadius:8, background:"#1659F5", color:"#fff", fontSize:13, fontWeight:600, border:"none", cursor:"pointer" }}>
          ← Back to Overview
        </button>
      </div>
    );
  }

  const { ai_insights: insights, executive_summary: execSummary } = result;

  return (
    <div style={{ padding:"32px 32px 48px" }}>
      <div className="eyebrow" style={{ marginBottom:4 }}>AI Audit Intelligence</div>
      <h1 style={{ fontSize:22, fontWeight:800, color:"#E6EFF8", letterSpacing:"-0.025em", marginBottom:4 }}>
        AI-Generated Audit Narratives
      </h1>
      <p style={{ fontSize:13, color:"#3D5975", marginBottom:20 }}>
        Professional audit language for every high-risk record — ready for audit committees and finance leadership.
      </p>

      {!geminiKey && (
        <div className="alert-bar info" style={{ marginBottom:20 }}>
          ◆ Rule-based audit engine active. Add a Gemini API key in Settings to enable AI-generated narratives.
        </div>
      )}

      {/* Executive Summary */}
      {execSummary && (
        <>
          <div style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:12 }}>
            Executive AI Summary
          </div>
          <div style={{ ...BOX, marginBottom:24 }}>
            <div style={HDR}>
              <AiBadge/>
              <span style={{ fontSize:12, color:"#3D5975", marginLeft:"auto" }}>Executive Summary</span>
            </div>
            <div style={{ fontSize:13, color:"#6A8BAD", lineHeight:1.8, whiteSpace:"pre-wrap" }}>{execSummary}</div>
          </div>
        </>
      )}

      {/* Per-record insights */}
      <div style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:14 }}>
        High-Risk Record Analysis — {insights.length} Reports
      </div>

      {insights.length === 0 ? (
        <div className="alert-bar info">No AI insights available. Run the analysis to generate them.</div>
      ) : (
        insights.map((rec, i) => {
          const insight = rec.ai_insight;
          const level   = insight.risk_level ?? rec.risk_level;
          const rc      = riskColor(rec.risk_score);
          const flags   = parseFlags(rec.risk_flags);
          const dateStr = rec.expenseDate?.slice(0,10) ?? "";

          return (
            <div key={i} style={BOX}>
              <div style={HDR}>
                <AiBadge/>
                <span style={{ fontSize:13, color:"#E6EFF8", fontWeight:700, marginLeft:6 }}>
                  {rec.employeeName} — {rec.expenseType} — ${rec.amount.toFixed(2)}
                </span>
                <span style={{ marginLeft:"auto", fontSize:11, color:rc, fontWeight:700 }}>
                  {level} Risk · {rec.risk_score}/100
                </span>
              </div>

              {/* Meta row */}
              <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:12, alignItems:"center" }}>
                {[["Date",dateStr],["Vendor",rec.vendor],["Dept",rec.department]].map(([lbl,val]) => (
                  <div key={lbl}>
                    <span style={{ fontSize:9, fontWeight:700, color:"#3D5975", textTransform:"uppercase", letterSpacing:"0.1em" }}>{lbl}</span>
                    <span style={{ fontSize:11, color:"#6A8BAD", marginLeft:6 }}>{val}</span>
                  </div>
                ))}
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {flags.map(f => {
                    const cfg = FLAG_CONFIG[f];
                    return cfg ? (
                      <span key={f} className={`chip ${cfg.cls}`} style={{ fontSize:10 }}>{cfg.label}</span>
                    ) : null;
                  })}
                </div>
                <span style={{ marginLeft:"auto", fontSize:9, color:"#1A3A5E" }}>{insight.source}</span>
              </div>

              <div style={LBL}>Audit Risk Assessment</div>
              <div style={BODY}>{insight.reason}</div>
              <div style={LBL}>Recommended Audit Action</div>
              <div style={BODY}>{insight.recommendation}</div>
            </div>
          );
        })
      )}
    </div>
  );
}
