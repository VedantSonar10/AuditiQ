"use client";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { KpiCard }   from "@/components/ui/kpi-card";
import { Alert }     from "@/components/ui/alert";
import {
  RiskDistributionChart, TopRiskEmployeesChart,
  MonthlySpendChart, CategorySpendChart, DeptScatterChart,
} from "@/components/charts";
import { useApp } from "@/lib/store";
import { usd, usdf, pct, toRiskDistribution, toMonthlySpend, toCategorySpend, toDeptScatter } from "@/lib/utils";

const S = {
  wrap:   { padding:"32px 32px 48px" },
  row14:  { height:14 },
  charts: { display:"grid", gridTemplateColumns:"240px 1fr 1.4fr", gap:16 } as React.CSSProperties,
  charts2:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 } as React.CSSProperties,
  kpi4:   { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 } as React.CSSProperties,
  kpi5:   { display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:16 } as React.CSSProperties,
  pCards: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 } as React.CSSProperties,
  chartBox:{ background:"#080F1E", border:"1px solid #0E1E33", borderRadius:10, padding:16 },
  pCard:  { background:"#070E1C", border:"1px solid #0E1E33", borderRadius:10, padding:20, borderTop:"2px solid" },
};

export function CommandCenter() {
  const { result, setResult, setLoading, geminiKey } = useApp();
  const router = useRouter();
  if (!result) return null;

  const m      = result.summary_metrics;
  const scored = result.scored_expenses;
  const dups   = result.duplicates;
  const high   = m.high_risk;
  const total  = m.total_reports;
  const expHigh = scored.filter(e => e.risk_level === "High").reduce((s, e) => s + e.amount, 0);
  const expAll  = scored.filter(e => e.risk_level !== "Low").reduce((s, e) => s + e.amount, 0);
  const dupVal  = dups.reduce((s, d) => s + d.amount, 0);
  const topDept = Object.entries(
    scored.reduce((acc, e) => { acc[e.department] = (acc[e.department] || 0) + e.risk_score; return acc; }, {} as Record<string,number>)
  ).sort(([,a],[,b]) => b - a)[0]?.[0] ?? "Sales";

  const avgR = m.avg_risk_score;

  async function rerun() {
    setLoading(true);
    try {
      const url = "/api/analyze?sample=true" + (geminiKey ? `&gemini_key=${encodeURIComponent(geminiKey)}` : "");
      const r = await fetch(url);
      if (r.ok) setResult(await r.json());
    } finally { setLoading(false); }
  }

  const priorityCards = [
    { label:"Priority 1 — Immediate (48h)", title:`Review ${high} High-Risk Reports`, body:`${high} expense reports scored 61+ risk points. Manual verification and receipt validation required before next payroll cycle.`, href:"/investigation", cta:"Open Risk Investigation →", color:"#C93636" },
    { label:"Priority 2 — This Week", title:`Recover ${usdf(dupVal)} in Duplicates`, body:`${m.potential_duplicates} potential duplicate pairs detected. Cross-reference payroll records and initiate clawback procedures.`, href:"/compliance", cta:"View Duplicate Claims →", color:"#C97D10" },
    { label:"Priority 3 — This Month", title:`${topDept} Department Review`, body:`${topDept} shows the highest average risk score. Schedule T&E policy refresher and review per-diem limits.`, href:"/departments", cta:"View Department Intel →", color:"#1659F5" },
  ];

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, marginBottom:20 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom:4 }}>Executive Overview</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#E6EFF8", letterSpacing:"-0.025em", lineHeight:1.15 }}>
            Risk Intelligence Command Center
          </h1>
          <p style={{ fontSize:13, color:"#3D5975", marginTop:4 }}>
            Portfolio-wide analysis · Prioritized by financial exposure
          </p>
        </div>
        <button onClick={rerun} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8, border:"1px solid #0E1E33", background:"transparent", color:"#6A8BAD", fontSize:12, cursor:"pointer" }}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {/* Alert */}
      {high > 0 ? (
        <Alert variant="danger" className="mb-4">
          <strong>⚑ {high} high-risk report{high !== 1 ? "s" : ""} require immediate review</strong>
          {" "}— estimated exposure {usdf(expHigh + dupVal)}.{" "}
          <button onClick={() => router.push("/investigation")} style={{ textDecoration:"underline", background:"none", border:"none", color:"inherit", cursor:"pointer", fontSize:"inherit" }}>
            Open Risk Investigation →
          </button>
        </Alert>
      ) : (
        <Alert variant="success" className="mb-4">
          ✓ No high-risk reports detected. {m.medium_risk} medium-risk report{m.medium_risk !== 1 ? "s" : ""} flagged.
        </Alert>
      )}

      {/* KPI Row 1 */}
      <div style={{ ...S.kpi4, marginBottom:16 }}>
        <KpiCard label="Total Spend Analyzed" value={usd(m.total_spend)}  accent="cobalt"  sub={`${total} expense reports`}/>
        <KpiCard label="Financial Exposure"   value={usd(expAll)}         accent="crimson" sub="High + medium risk spend"/>
        <KpiCard label="Duplicate Exposure"   value={usdf(dupVal)}        accent="amber"   sub={`${m.potential_duplicates} potential pairs`}/>
        <KpiCard label="Potential Recovery"   value={usd(dupVal * 0.85)}  accent="emerald" sub="Est. recoverable via clawback"/>
      </div>

      {/* KPI Row 2 */}
      <div style={{ ...S.kpi5, marginBottom:20 }}>
        <KpiCard label="High Risk Reports"   value={String(m.high_risk)}   accent="crimson" sub={`${pct(m.high_risk, total)} of portfolio`}/>
        <KpiCard label="Medium Risk Reports" value={String(m.medium_risk)} accent="amber"   sub={`${pct(m.medium_risk, total)} of portfolio`}/>
        <KpiCard label="Low Risk Reports"    value={String(m.low_risk)}    accent="emerald" sub={`${pct(m.low_risk, total)} of portfolio`}/>
        <KpiCard label="Audit Hours Saved"   value={`${Math.round(total*0.2)}h`} accent="cobalt" sub="vs. manual review"/>
        <KpiCard label="Avg Portfolio Risk"  value={`${avgR.toFixed(0)}/100`}
                 accent={avgR >= 61 ? "crimson" : avgR >= 31 ? "amber" : "emerald"}
                 sub="Across all reports"/>
      </div>

      {/* Charts Row 1 */}
      <div style={{ ...S.charts, marginBottom:16 }}>
        <div style={S.chartBox}>
          <div style={{ fontSize:11, fontWeight:600, color:"#6A8BAD", marginBottom:12 }}>Portfolio Risk Split</div>
          <RiskDistributionChart data={toRiskDistribution(scored)}/>
        </div>
        <div style={S.chartBox}>
          <div style={{ fontSize:11, fontWeight:600, color:"#6A8BAD", marginBottom:12 }}>Spend vs. Risk by Department</div>
          <DeptScatterChart data={toDeptScatter(scored)}/>
        </div>
        <div style={S.chartBox}>
          <div style={{ fontSize:11, fontWeight:600, color:"#6A8BAD", marginBottom:12 }}>Employees by Avg Risk Score</div>
          <TopRiskEmployeesChart expenses={scored}/>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ ...S.charts2, marginBottom:24 }}>
        <div style={S.chartBox}>
          <div style={{ fontSize:11, fontWeight:600, color:"#6A8BAD", marginBottom:12 }}>Monthly Spend Trend</div>
          <MonthlySpendChart data={toMonthlySpend(scored)}/>
        </div>
        <div style={S.chartBox}>
          <div style={{ fontSize:11, fontWeight:600, color:"#6A8BAD", marginBottom:12 }}>Spend by Expense Category</div>
          <CategorySpendChart data={toCategorySpend(scored)}/>
        </div>
      </div>

      {/* Management Actions */}
      <div className="eyebrow" style={{ marginBottom:16 }}>Management Recommended Actions</div>
      <div style={S.pCards}>
        {priorityCards.map(({ label, title, body, href, cta, color }) => (
          <div key={title} style={{ ...S.pCard, borderTopColor: color }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>
              {label}
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:"#E6EFF8", marginBottom:8, letterSpacing:"-0.01em", lineHeight:1.3 }}>
              {title}
            </div>
            <p style={{ fontSize:12, color:"#3D5975", lineHeight:1.6, marginBottom:14 }}>{body}</p>
            <button onClick={() => router.push(href)}
              style={{ fontSize:12, fontWeight:600, color:"#4D8EFF", background:"none", border:"none", cursor:"pointer", padding:0 }}>
              {cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
