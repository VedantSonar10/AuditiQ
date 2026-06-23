"use client";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { KpiCard } from "@/components/ui/kpi-card";
import { DepartmentRiskChart, DeptScatterChart } from "@/components/charts";
import { riskColor, usd, usdf, toDepartmentMetrics } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress";

const BOX = { background:"#080F1E", border:"1px solid #0E1E33", borderRadius:10, padding:16 };
const CARD = { background:"#070E1C", border:"1px solid #0E1E33", borderRadius:10, padding:"20px 22px", marginBottom:10 };

export default function DepartmentsPage() {
  const { result } = useApp();
  const router = useRouter();

  if (!result) {
    return (
      <div style={{ padding:32, textAlign:"center", paddingTop:80 }}>
        <div style={{ fontSize:32, marginBottom:16 }}>▣</div>
        <div style={{ fontSize:18, fontWeight:700, color:"#E6EFF8", marginBottom:8 }}>No Analysis Loaded</div>
        <p style={{ fontSize:13, color:"#3D5975", marginBottom:24 }}>Load expense data from the Executive Overview first.</p>
        <button onClick={() => router.push("/dashboard")}
          style={{ padding:"9px 20px", borderRadius:8, background:"#1659F5", color:"#fff", fontSize:13, fontWeight:600, border:"none", cursor:"pointer" }}>
          ← Back to Overview
        </button>
      </div>
    );
  }

  const { scored_expenses: scored, employee_summary: empSum } = result;
  const deptData = toDepartmentMetrics(scored);
  const topRisk  = deptData[0];
  const topSpend = [...deptData].sort((a,b) => b.total_spend - a.total_spend)[0];
  const flagged  = deptData.reduce((s,d) => s + d.high_risk + d.med_risk, 0);

  return (
    <div style={{ padding:"32px 32px 48px" }}>
      <div className="eyebrow" style={{ marginBottom:4 }}>Department Intelligence</div>
      <h1 style={{ fontSize:22, fontWeight:800, color:"#E6EFF8", letterSpacing:"-0.025em", marginBottom:4 }}>
        Department Risk Ranking
      </h1>
      <p style={{ fontSize:13, color:"#3D5975", marginBottom:20 }}>
        Financial exposure, compliance scores, and high-risk breakdowns — ranked by average risk score.
      </p>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
        <KpiCard label="Highest Risk Dept"   value={topRisk?.department ?? "—"} accent="crimson" sub={`Avg ${topRisk?.avg_risk.toFixed(0)}/100`}/>
        <KpiCard label="Highest Spend Dept"  value={topSpend?.department ?? "—"} accent="amber"  sub={usd(topSpend?.total_spend ?? 0) + " total"}/>
        <KpiCard label="Departments Tracked" value={String(deptData.length)} accent="cobalt" sub="All active"/>
        <KpiCard label="Flagged Reports"     value={String(flagged)} accent="amber" sub="High + medium risk"/>
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
        <div style={BOX}>
          <div style={{ fontSize:11, fontWeight:600, color:"#6A8BAD", marginBottom:12 }}>Risk Reports by Department</div>
          <DepartmentRiskChart expenses={scored}/>
        </div>
        <div style={BOX}>
          <div style={{ fontSize:11, fontWeight:600, color:"#6A8BAD", marginBottom:12 }}>Spend vs. Risk by Department</div>
          <DeptScatterChart data={scored.reduce((acc, e) => {
            const d = acc.find(x => x.department === e.department);
            if (d) { d.spend += e.amount; d.risk += e.risk_score; d.count++; }
            else acc.push({ department:e.department, spend:e.amount, risk:e.risk_score, count:1 });
            return acc;
          }, [] as {department:string;spend:number;risk:number;count:number}[]).map(d => ({ ...d, risk: d.risk/d.count }))}/>
        </div>
      </div>

      {/* Department breakdown cards */}
      <div style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:14 }}>
        Department Breakdown
      </div>
      {deptData.map((dept, rank) => {
        const rc  = riskColor(dept.avg_risk);
        const cc  = dept.compliance >= 70 ? "#0C8A5C" : dept.compliance >= 40 ? "#C97D10" : "#C93636";
        const top = empSum.filter(e => e.department === dept.department)
                          .sort((a,b) => b.avg_risk_score - a.avg_risk_score).slice(0,3);
        return (
          <div key={dept.department} style={CARD}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14 }}>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontSize:9, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:4 }}>
                  #{rank+1} — {dept.department.toUpperCase()}
                </div>
                <div style={{ fontSize:17, fontWeight:800, color:"#E6EFF8", letterSpacing:"-0.02em", marginBottom:12 }}>
                  {dept.department} Department
                </div>
                <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                  {[
                    ["Total Spend", usdf(dept.total_spend)],
                    ["Reports",     String(dept.total_reports)],
                    ["Employees",   String(dept.employees)],
                    ["High Risk",   String(dept.high_risk)],
                  ].map(([lbl,val]) => (
                    <div key={lbl}>
                      <div style={{ fontSize:9, color:"#3D5975", textTransform:"uppercase", letterSpacing:"0.1em" }}>{lbl}</div>
                      <div style={{ fontSize:14, fontWeight:700, color: lbl === "High Risk" ? "#C93636" : "#E6EFF8" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", gap:22, alignItems:"center" }}>
                {[["Avg Risk", dept.avg_risk, rc], ["Compliance", dept.compliance, cc]].map(([lbl,val,color]) => (
                  <div key={lbl as string} style={{ textAlign:"center", minWidth:70 }}>
                    <div style={{ fontSize:9, color:"#3D5975", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>{lbl}</div>
                    <div style={{ fontSize:28, fontWeight:800, color:color as string, letterSpacing:"-0.03em" }}>{(val as number).toFixed(0)}</div>
                    <div style={{ fontSize:9, color:"#1A3A5E" }}>/100</div>
                    <ProgressBar value={val as number} color={color as string}/>
                  </div>
                ))}
              </div>
            </div>
            {top.length > 0 && (
              <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid #0A1628" }}>
                <div style={{ fontSize:9, fontWeight:700, color:"#1A3A5E", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>
                  Top Risk Employees
                </div>
                {top.map(e => (
                  <div key={e.employeeId} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderTop:"1px solid #0A1628" }}>
                    <div style={{ fontSize:12, color:"#6A8BAD" }}>{e.employeeName}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:riskColor(e.avg_risk_score) }}>{e.avg_risk_score.toFixed(0)} pts</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
