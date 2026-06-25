"use client";
import { useRouter } from "next/navigation";
import { RefreshCw, ArrowRight } from "lucide-react";
import {
  RiskDistributionChart, TopRiskEmployeesChart,
  MonthlySpendChart, CategorySpendChart,
} from "@/components/charts";
import { useApp } from "@/lib/store";
import { usd, usdf, pct, toRiskDistribution, toMonthlySpend, toCategorySpend, riskColor } from "@/lib/utils";

const T = {
  surface:    "#080F1E",
  surfaceB:   "#0A1220",
  border:     "rgba(255,255,255,0.06)",
  borderFaint:"rgba(255,255,255,0.04)",
  dimText:    "#3D5975",
  bodyText:   "#6A8BAD",
  primary:    "#E6EFF8",
};

function ChartBox({ title, children, style }: { title:string; children:React.ReactNode; style?:React.CSSProperties }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, ...style }}>
      <div style={{ fontSize:11, fontWeight:500, color:T.bodyText, marginBottom:12, letterSpacing:"0.01em" }}>{title}</div>
      {children}
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label:string; value:string; sub?:string; accent?:string }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
      {accent && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:accent }}/>}
      <div style={{ fontSize:10, fontWeight:500, color:T.dimText, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:value.length > 8 ? 17 : 20, fontWeight:700, color:T.primary, letterSpacing:"-0.02em", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.dimText, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

export function CommandCenter() {
  const { result, setResult, setLoading, geminiKey } = useApp();
  const router = useRouter();
  if (!result) return null;

  const m      = result.summary_metrics;
  const scored = result.scored_expenses;
  const dups   = result.duplicates;
  const high   = m.high_risk;
  const total  = m.total_reports;
  const expAll  = scored.filter(e => e.risk_level !== "Low").reduce((s,e) => s+e.amount, 0);
  const dupVal  = dups.reduce((s,d) => s+d.amount, 0);
  const avgR    = m.avg_risk_score;
  const avgColor = avgR >= 61 ? "#C93636" : avgR >= 31 ? "#C97D10" : "#0C8A5C";

  const topEmp = Object.values(
    scored.reduce((acc, e) => {
      if (!acc[e.employeeId]) acc[e.employeeId] = { name:e.employeeName, dept:e.department, total:0, count:0 };
      acc[e.employeeId].total += e.risk_score;
      acc[e.employeeId].count++;
      return acc;
    }, {} as Record<string,{name:string;dept:string;total:number;count:number}>)
  ).map(d => ({ ...d, avg: d.total/d.count })).sort((a,b) => b.avg - a.avg).slice(0,5);

  const flaggedQueue = [...scored].filter(e => e.risk_score > 0).sort((a,b) => b.risk_score - a.risk_score).slice(0,5);

  async function rerun() {
    setLoading(true);
    try {
      const url = "/api/analyze?sample=true" + (geminiKey ? `&gemini_key=${encodeURIComponent(geminiKey)}` : "");
      const r = await fetch(url);
      if (r.ok) setResult(await r.json());
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding:"24px 24px 48px" }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:16, fontWeight:600, color:T.primary, letterSpacing:"-0.01em", margin:0, lineHeight:1 }}>
            Executive Overview
          </h1>
          <p style={{ fontSize:12, color:T.dimText, marginTop:4 }}>
            {total} expense reports · portfolio risk {avgR.toFixed(0)}/100
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {high > 0 && (
            <button onClick={() => router.push("/investigation")} style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"7px 12px", borderRadius:7,
              background:"rgba(201,54,54,0.12)", color:"#F28B8B",
              border:"1px solid rgba(201,54,54,0.22)", fontSize:12, fontWeight:600, cursor:"pointer",
            }}>
              ⚑ {high} High-Risk — Review now
            </button>
          )}
          <button onClick={rerun} style={{
            display:"inline-flex", alignItems:"center", gap:5,
            padding:"7px 12px", borderRadius:7,
            background:"transparent", color:T.bodyText,
            border:`1px solid ${T.border}`, fontSize:12, cursor:"pointer",
          }}>
            <RefreshCw size={12}/> Refresh
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:12 }}>
        <Metric label="Total Reports"     value={String(total)}            sub={usdf(m.total_spend) + " analyzed"} accent="#1659F5"/>
        <Metric label="Financial Exposure" value={usd(expAll)}             sub="High + medium risk"                accent="#C93636"/>
        <Metric label="Duplicate Exposure" value={usd(dupVal)}             sub={`${m.potential_duplicates} pairs`} accent="#C97D10"/>
        <Metric label="Potential Recovery" value={usd(dupVal * 0.85)}      sub="Est. via clawback"                 accent="#0C8A5C"/>
        <Metric label="Avg Risk Score"     value={`${avgR.toFixed(0)}/100`} sub={`${pct(high, total)} high risk`}  accent={avgColor}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:10, marginBottom:12 }}>
  <ChartBox title="Risk Distribution" style={{ overflow:"hidden" }}>
  <div style={{ height:220 }}>
    <RiskDistributionChart data={toRiskDistribution(scored)}/>
  </div>
</ChartBox>
        <ChartBox title="Monthly Spend Trend">
          <MonthlySpendChart data={toMonthlySpend(scored)}/>
        </ChartBox>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 220px", gap:10, marginBottom:12 }}>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:500, color:T.bodyText }}>Investigation Queue</div>
            <button onClick={() => router.push("/investigation")} style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:11, color:"#1659F5", background:"none", border:"none", cursor:"pointer", padding:0, fontWeight:500 }}>
              View all <ArrowRight size={11}/>
            </button>
          </div>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {flaggedQueue.map((row, i) => {
              const rc = riskColor(row.risk_score);
              return (
                <div key={row.reportId} onClick={() => router.push("/investigation")} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderTop: i === 0 ? "none" : `1px solid ${T.borderFaint}`, cursor:"pointer" }}>
                  <div style={{ width:32, height:32, borderRadius:6, background:`rgba(${rc === "#C93636" ? "201,54,54" : rc === "#C97D10" ? "201,125,16" : "12,138,92"},0.1)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:rc }}>{row.risk_score}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:T.primary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.employeeName}</div>
                    <div style={{ fontSize:11, color:T.dimText, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.expenseType} · {row.vendor} · {usdf(row.amount)}</div>
                  </div>
                  <div style={{ fontSize:10, fontWeight:600, color:rc, background:`rgba(${rc === "#C93636" ? "201,54,54" : rc === "#C97D10" ? "201,125,16" : "12,138,92"},0.1)`, padding:"2px 7px", borderRadius:4 }}>
                    {row.risk_level}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:500, color:T.bodyText }}>Top Risk Employees</div>
            <button onClick={() => router.push("/employees")} style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:11, color:"#1659F5", background:"none", border:"none", cursor:"pointer", padding:0, fontWeight:500 }}>
              Profiles <ArrowRight size={11}/>
            </button>
          </div>
          {topEmp.map((emp, i) => {
            const rc = riskColor(emp.avg);
            const pctWidth = Math.min((emp.avg / 100) * 100, 100);
            return (
              <div key={emp.name} style={{ padding:"8px 0", borderTop: i === 0 ? "none" : `1px solid ${T.borderFaint}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <div>
                    <span style={{ fontSize:12, fontWeight:500, color:T.primary }}>{emp.name}</span>
                    <span style={{ fontSize:11, color:T.dimText, marginLeft:7 }}>{emp.dept}</span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:rc }}>{emp.avg.toFixed(0)}</span>
                </div>
                <div style={{ height:2, background:T.borderFaint, borderRadius:9999, overflow:"hidden" }}>
                  <div style={{ width:`${pctWidth}%`, height:"100%", background:rc, borderRadius:9999, transition:"width 0.6s ease" }}/>
                </div>
              </div>
            );
          })}
        </div>

        <ChartBox title="Spend by Category">
          <CategorySpendChart data={toCategorySpend(scored)}/>
        </ChartBox>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        {[
          { accent:"#C93636", priority:"Priority 1 · 48h",        title:`${high} High-Risk Report${high !== 1 ? "s" : ""}`, body:`${high} reports scored 61+. Verify before next payroll.`,          href:"/investigation", cta:"Open Investigation" },
          { accent:"#C97D10", priority:"Priority 2 · This week",   title:`${usdf(dupVal)} Duplicate Exposure`,                body:`${m.potential_duplicates} potential pairs. Initiate clawback.`,  href:"/compliance",    cta:"View Duplicates"   },
          { accent:"#1659F5", priority:"Priority 3 · This month",  title:"Department Policy Review",                          body:`${m.medium_risk} medium-risk reports need routine audit.`,        href:"/departments",   cta:"View Departments"  },
        ].map(({ accent, priority, title, body, href, cta }) => (
          <div key={title} style={{ background:T.surface, border:`1px solid ${T.border}`, borderTop:`2px solid ${accent}`, borderRadius:8, padding:16 }}>
            <div style={{ fontSize:10, fontWeight:600, color:T.dimText, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>{priority}</div>
            <div style={{ fontSize:13, fontWeight:600, color:T.primary, marginBottom:5, letterSpacing:"-0.01em" }}>{title}</div>
            <p style={{ fontSize:12, color:T.bodyText, lineHeight:1.5, margin:0, marginBottom:12 }}>{body}</p>
            <button onClick={() => router.push(href)} style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:12, fontWeight:500, color:"#4D8EFF", background:"none", border:"none", cursor:"pointer", padding:0 }}>
              {cta} <ArrowRight size={11}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}