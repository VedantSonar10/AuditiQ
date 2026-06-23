"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { ProgressBar }         from "@/components/ui/progress";
import { EmployeeTimelineChart } from "@/components/charts";
import { riskColor, rlevel, usdf } from "@/lib/utils";
import type { EmployeeSummary } from "@/types";

const S = {
  wrap:  { padding:"32px 32px 48px" },
  grid:  { display:"grid", gridTemplateColumns:"280px 1fr", gap:20, alignItems:"start" } as React.CSSProperties,
  card:  { background:"#080F1E", border:"1px solid #0E1E33", borderRadius:10, padding:16, marginBottom:8, cursor:"pointer" } as React.CSSProperties,
  box:   { background:"#070E1C", border:"1px solid #0E1E33", borderRadius:10, padding:20 },
  label: { fontSize:9, fontWeight:600, color:"#3D5975", textTransform:"uppercase" as const, letterSpacing:"0.1em", marginBottom:3 },
  val:   { fontSize:15, fontWeight:700, color:"#E6EFF8" },
  anom:  { background:"#050C18", border:"1px solid #0E1E33", borderRadius:7, padding:"10px 14px", marginBottom:6 },
};

export default function EmployeesPage() {
  const { result } = useApp();
  const router     = useRouter();
  const [selId, setSelId]   = useState<string | null>(null);
  const [deptF, setDeptF]   = useState("All");

  if (!result) return <NoData router={router}/>;

  const { scored_expenses: scored, employee_summary: empSum, duplicates: dups, anomalies } = result;

  const depts = Array.from(new Set(empSum.map(e => e.department))).sort();
  const data  = deptF === "All" ? empSum : empSum.filter(e => e.department === deptF);
  const sel   = selId ? empSum.find(e => e.employeeId === selId) : null;

  const empScored = sel ? scored.filter(e => e.employeeId === sel.employeeId) : [];
  const empDups   = sel ? dups.filter(d => d.employeeId === sel.employeeId) : [];
  const empAnom   = sel
    ? Object.values(anomalies).flat().filter(a => a.employeeId === sel.employeeId)
    : [];

  return (
    <div style={S.wrap}>
      <div className="eyebrow" style={{ marginBottom:4 }}>Employee Risk Intelligence</div>
      <h1 style={{ fontSize:22, fontWeight:800, color:"#E6EFF8", letterSpacing:"-0.025em", marginBottom:4 }}>
        Employee Risk Profiles
      </h1>
      <p style={{ fontSize:13, color:"#3D5975", marginBottom:20 }}>
        Individual spending intelligence, anomaly history, and review priority.
      </p>

      {/* Filter */}
      <select value={deptF} onChange={e => setDeptF(e.target.value)}
        style={{ padding:"7px 12px", borderRadius:8, background:"#070E1C", border:"1px solid #0E1E33", color:"#9BB8D8", fontSize:13, marginBottom:16, outline:"none" }}>
        <option>All</option>
        {depts.map(d => <option key={d}>{d}</option>)}
      </select>

      <div style={S.grid}>
        {/* Roster */}
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:10 }}>
            Roster — By Risk Score
          </div>
          {data.map(emp => {
            const rc  = riskColor(emp.avg_risk_score);
            const sel = selId === emp.employeeId;
            return (
              <div key={emp.employeeId}
                style={{ ...S.card, borderColor: sel ? "#1659F5" : "#0E1E33", background: sel ? "rgba(22,89,245,0.05)" : "#080F1E" }}
                onClick={() => setSelId(emp.employeeId)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#E6EFF8" }}>{emp.employeeName}</div>
                    <div style={{ fontSize:10, color:"#3D5975", marginTop:2 }}>
                      {emp.department} · {emp.total_expenses} reports
                    </div>
                    <ProgressBar value={emp.avg_risk_score} color={rc}/>
                  </div>
                  <div style={{ textAlign:"right", marginLeft:12, flexShrink:0 }}>
                    <div style={{ fontSize:18, fontWeight:800, color:rc, letterSpacing:"-0.02em" }}>{emp.avg_risk_score.toFixed(0)}</div>
                    <div style={{ fontSize:9, color:"#1A3A5E", textTransform:"uppercase", letterSpacing:"0.1em" }}>risk</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        {sel ? (
          <EmployeeDetail emp={sel} expenses={empScored} dups={empDups} anomalies={empAnom}/>
        ) : (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:280, color:"#1A3A5E", textAlign:"center" }}>
            <div>
              <div style={{ fontSize:32, marginBottom:12 }}>◎</div>
              <div style={{ fontSize:13, color:"#3D5975" }}>Select an employee to view their full risk profile.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmployeeDetail({ emp, expenses, dups, anomalies }: {
  emp: EmployeeSummary;
  expenses: ReturnType<typeof useApp>["result"] extends null ? never : NonNullable<ReturnType<typeof useApp>["result"]>["scored_expenses"];
  dups: NonNullable<ReturnType<typeof useApp>["result"]>["duplicates"];
  anomalies: NonNullable<ReturnType<typeof useApp>["result"]>["anomalies"][keyof NonNullable<ReturnType<typeof useApp>["result"]>["anomalies"]];
}) {
  const rc    = riskColor(emp.avg_risk_score);
  const level = rlevel(emp.avg_risk_score);

  const CHIP_MAP: Record<string, string> = {
    "Duplicate Claim":"chip-dup","Peer Outlier":"chip-peer",
    "High Spending Variance":"chip-var","Weekend Expense":"chip-wknd","Unusual Category":"chip-unu",
  };

  return (
    <div>
      {/* Profile header */}
      <div style={{ background:"#070E1C", border:"1px solid #0E1E33", borderTop:`3px solid ${rc}`, borderRadius:10, padding:"20px 22px", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"#E6EFF8", letterSpacing:"-0.02em" }}>{emp.employeeName}</div>
            <div style={{ fontSize:11, color:"#3D5975", marginTop:3 }}>{emp.department} · {emp.employeeId}</div>
          </div>
          <div style={{ textAlign:"center", background:"#030B18", border:"1px solid #0E1E33", borderRadius:8, padding:"10px 16px", flexShrink:0 }}>
            <div style={{ fontSize:26, fontWeight:800, color:rc, letterSpacing:"-0.02em" }}>{emp.avg_risk_score.toFixed(0)}</div>
            <div style={{ fontSize:9, color:"#1A3A5E", textTransform:"uppercase", letterSpacing:"0.1em" }}>Avg Risk</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:20, marginTop:16, flexWrap:"wrap" }}>
          {[
            ["Total Spend", usdf(emp.total_amount)],
            ["Reports",     String(emp.total_expenses)],
            ["Max Risk",    String(emp.max_risk_score)],
            ["High Risk",   String(emp.high_risk_count)],
            ["Priority",    level],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize:9, color:"#3D5975", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:14, fontWeight:700, color: label === "Priority" ? rc : label === "High Risk" ? "#C93636" : "#E6EFF8" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline chart */}
      <div style={{ background:"#080F1E", border:"1px solid #0E1E33", borderRadius:10, padding:16, marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#6A8BAD", marginBottom:10 }}>Expense Timeline</div>
        <EmployeeTimelineChart expenses={expenses}/>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>
            Anomaly History — {anomalies.length} findings
          </div>
          {anomalies.slice(0, 6).map((a, i) => (
            <div key={i} style={{ background:"#050C18", border:"1px solid #0E1E33", borderRadius:7, padding:"10px 14px", marginBottom:6 }}>
              <span className={`chip ${CHIP_MAP[a.anomalyType] ?? "chip-peer"}`}>{a.anomalyType}</span>
              <span style={{ color:"#3D5975", marginLeft:10, fontSize:11 }}>{a.expenseDate}</span>
              <span style={{ color:"#6A8BAD", marginLeft:8, fontSize:11 }}>— {a.vendor}</span>
              <span style={{ color:"#E6EFF8", marginLeft:8, fontSize:12, fontWeight:600 }}>{usdf(a.amount)}</span>
              <div style={{ color:"#3D5975", fontSize:11, marginTop:5, lineHeight:1.5 }}>{a.detail}</div>
            </div>
          ))}
        </div>
      )}

      {/* Duplicates */}
      {dups.length > 0 && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"#C93636", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>
            Duplicate Claims — {dups.length} pairs
          </div>
          {dups.map((d, i) => (
            <div key={i} style={{ background:"#050C18", border:"1px solid rgba(201,54,54,0.18)", borderRadius:7, padding:"10px 14px", marginBottom:6 }}>
              <span className="chip chip-dup">Duplicate</span>
              <span style={{ color:"#6A8BAD", marginLeft:10, fontSize:11 }}>{d.vendor}</span>
              <span style={{ color:"#FCA5A5", marginLeft:8, fontSize:12, fontWeight:600 }}>{usdf(d.amount)}</span>
              <span style={{ color:"#3D5975", marginLeft:8, fontSize:11 }}>
                {d.expenseDate_A} vs {d.expenseDate_B} ({d.daysBetween} days apart)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NoData({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div style={{ padding:32, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400, textAlign:"center" }}>
      <div style={{ fontSize:36, marginBottom:16 }}>◎</div>
      <div style={{ fontSize:18, fontWeight:700, color:"#E6EFF8", marginBottom:8 }}>No Analysis Loaded</div>
      <p style={{ fontSize:13, color:"#3D5975", marginBottom:24, maxWidth:400 }}>
        Load expense data and run analysis from the Executive Overview.
      </p>
      <button onClick={() => router.push("/dashboard")}
        style={{ padding:"9px 20px", borderRadius:8, background:"#1659F5", color:"#fff", fontSize:13, fontWeight:600, border:"none", cursor:"pointer" }}>
        ← Back to Overview
      </button>
    </div>
  );
}
