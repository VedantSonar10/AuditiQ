"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { useApp } from "@/lib/store";
import { KpiCard } from "@/components/ui/kpi-card";
import { usdf, usd } from "@/lib/utils";

const TABS = ["Duplicate Claims","Expense Ledger","All Anomalies","PDF Export"] as const;
type Tab = typeof TABS[number];

const TH = { fontSize:9, fontWeight:700, color:"#1A3A5E", textTransform:"uppercase" as const, letterSpacing:"0.1em", padding:"8px 12px", borderBottom:"1px solid #0E1E33", textAlign:"left" as const };
const TD = { color:"#6A8BAD", padding:"9px 12px", borderBottom:"1px solid #070E1C", fontSize:12 };

export default function CompliancePage() {
  const { result } = useApp();
  const router = useRouter();
  const [tab, setTab]       = useState<Tab>("Duplicate Claims");
  const [empF, setEmpF]     = useState("All");
  const [riskF, setRiskF]   = useState("All");
  const [search, setSearch] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl]         = useState<string|null>(null);

  if (!result) {
    return (
      <div style={{ padding:32, textAlign:"center", paddingTop:80 }}>
        <div style={{ fontSize:32, marginBottom:16 }}>☰</div>
        <div style={{ fontSize:18, fontWeight:700, color:"#E6EFF8", marginBottom:8 }}>No Analysis Loaded</div>
        <p style={{ fontSize:13, color:"#3D5975", marginBottom:24 }}>Load expense data from the Executive Overview first.</p>
        <button onClick={() => router.push("/dashboard")}
          style={{ padding:"9px 20px", borderRadius:8, background:"#1659F5", color:"#fff", fontSize:13, fontWeight:600, border:"none", cursor:"pointer" }}>
          ← Back to Overview
        </button>
      </div>
    );
  }

  const { scored_expenses: scored, duplicates: dups, anomalies, summary_metrics: metrics } = result;
  const dupVal   = dups.reduce((s,d) => s+d.amount, 0);
  const allAnom  = Object.values(anomalies).flat();
  const emps     = Array.from(new Set(scored.map(e => e.employeeName))).sort();

  // Filtered ledger
  let ledger = [...scored];
  if (empF !== "All")  ledger = ledger.filter(e => e.employeeName === empF);
  if (riskF !== "All") ledger = ledger.filter(e => e.risk_level === riskF);
  if (search) {
    const s = search.toLowerCase();
    ledger = ledger.filter(e => e.vendor.toLowerCase().includes(s) || e.city.toLowerCase().includes(s));
  }

  async function generatePdf() {
    setPdfLoading(true);
    try {
      const resp = await fetch("/api/pdf", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ summary_metrics: metrics, duplicates: dups }),
      });
      if (!resp.ok) throw new Error("PDF failed");
      const blob = await resp.blob();
      const url  = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (e) { console.error(e); }
    finally { setPdfLoading(false); }
  }

  const SEL = { padding:"7px 12px", borderRadius:8, background:"#070E1C", border:"1px solid #0E1E33", color:"#9BB8D8", fontSize:13, outline:"none" };
  const INP = { ...SEL, flex:1, minWidth:180 } as React.CSSProperties;

  return (
    <div style={{ padding:"32px 32px 48px" }}>
      <div className="eyebrow" style={{ marginBottom:4 }}>Compliance Reporting</div>
      <h1 style={{ fontSize:22, fontWeight:800, color:"#E6EFF8", letterSpacing:"-0.025em", marginBottom:4 }}>
        Audit Reports &amp; Compliance Exports
      </h1>
      <p style={{ fontSize:13, color:"#3D5975", marginBottom:20 }}>
        Export audit-grade PDF reports, review expense ledgers, and download filtered findings.
      </p>

      {/* Tab bar */}
      <div style={{ display:"flex", borderBottom:"1px solid #0E1E33", marginBottom:24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:"10px 18px", fontSize:13, fontWeight:500, background:"none", border:"none",
            cursor:"pointer", borderBottom:`2px solid ${tab===t?"#1659F5":"transparent"}`,
            color: tab===t ? "#E6EFF8" : "#3D5975",
          }}>{t}</button>
        ))}
      </div>

      {/* ── Duplicates ── */}
      {tab === "Duplicate Claims" && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"#C93636", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:12 }}>
            Potential Duplicate Reimbursements
          </div>
          {dups.length > 0 ? (
            <>
              <div className="alert-bar danger" style={{ marginBottom:16 }}>
                ⚑ <strong>{dups.length} duplicate pairs</strong> detected — total exposure <strong>{usdf(dupVal)}</strong>. Initiate recovery procedures for confirmed cases.
              </div>
              <div style={{ background:"#080F1E", border:"1px solid #0E1E33", borderRadius:10, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {["Employee","Department","Vendor","Amount","Date A","Date B","Days Apart","Detail"].map(h => (
                        <th key={h} style={TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dups.map((d,i) => (
                      <tr key={i} style={{ background: i%2===0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                        <td style={TD}>{d.employeeName}</td>
                        <td style={TD}>{d.department}</td>
                        <td style={TD}>{d.vendor}</td>
                        <td style={{ ...TD, color:"#FCA5A5", fontWeight:600 }}>{usdf(d.amount)}</td>
                        <td style={TD}>{d.expenseDate_A}</td>
                        <td style={TD}>{d.expenseDate_B}</td>
                        <td style={{ ...TD, textAlign:"center" }}>{d.daysBetween}</td>
                        <td style={{ ...TD, maxWidth:260, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="alert-bar success">✓ No duplicate claims detected in this dataset.</div>
          )}
        </div>
      )}

      {/* ── Ledger ── */}
      {tab === "Expense Ledger" && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:12 }}>
            Complete Expense Ledger with Risk Scores
          </div>
          <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
            <select value={empF} onChange={e=>setEmpF(e.target.value)} style={SEL}>
              <option>All</option>{emps.map(e=><option key={e}>{e}</option>)}
            </select>
            <select value={riskF} onChange={e=>setRiskF(e.target.value)} style={SEL}>
              <option>All</option><option>High</option><option>Medium</option><option>Low</option>
            </select>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search vendor or city…" style={INP}/>
          </div>
          <div style={{ fontSize:11, color:"#3D5975", marginBottom:10 }}>
            {ledger.length} records · {usdf(ledger.reduce((s,e)=>s+e.amount,0))} total
          </div>
          <div style={{ background:"#080F1E", border:"1px solid #0E1E33", borderRadius:10, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["Report ID","Employee","Dept","Date","Type","Vendor","Amount","City","Status","Risk","Level","Flags"].map(h=>(
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledger.slice(0,100).map((e,i) => {
                  const rc = e.risk_level==="High"?"#FCA5A5":e.risk_level==="Medium"?"#FCD34D":"#6EE7B7";
                  return (
                    <tr key={e.reportId} style={{ background: i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                      <td style={{ ...TD, fontSize:10, color:"#1A3A5E" }}>{e.reportId}</td>
                      <td style={TD}>{e.employeeName}</td>
                      <td style={TD}>{e.department}</td>
                      <td style={TD}>{e.expenseDate?.slice(0,10)}</td>
                      <td style={TD}>{e.expenseType}</td>
                      <td style={TD}>{e.vendor}</td>
                      <td style={{ ...TD, fontWeight:600, color:"#E6EFF8" }}>{usdf(e.amount)}</td>
                      <td style={TD}>{e.city}</td>
                      <td style={TD}>{e.approvalStatus}</td>
                      <td style={{ ...TD, textAlign:"center" }}>
                        <div style={{ height:3, background:"#0E1E33", borderRadius:2, width:60 }}>
                          <div style={{ height:"100%", width:`${Math.min(e.risk_score,100)}%`, background:rc, borderRadius:2 }}/>
                        </div>
                        <div style={{ fontSize:10, color:rc, marginTop:2 }}>{e.risk_score}</div>
                      </td>
                      <td style={{ ...TD, color:rc, fontWeight:600 }}>{e.risk_level}</td>
                      <td style={{ ...TD, fontSize:10 }}>{e.risk_flags}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {ledger.length > 100 && (
              <div style={{ padding:"10px 14px", fontSize:11, color:"#3D5975", borderTop:"1px solid #0E1E33" }}>
                Showing first 100 of {ledger.length} records.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── All Anomalies ── */}
      {tab === "All Anomalies" && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"#C97D10", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:12 }}>
            All Detected Anomalies — {allAnom.length} findings
          </div>
          {allAnom.length > 0 ? (
            <div style={{ background:"#080F1E", border:"1px solid #0E1E33", borderRadius:10, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    {["Employee","Department","Date","Type","Vendor","Amount","Anomaly Type","Detail"].map(h=>(
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allAnom.map((a,i) => (
                    <tr key={i} style={{ background: i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                      <td style={TD}>{a.employeeName}</td>
                      <td style={TD}>{a.department}</td>
                      <td style={TD}>{a.expenseDate}</td>
                      <td style={TD}>{a.expenseType}</td>
                      <td style={TD}>{a.vendor}</td>
                      <td style={{ ...TD, color:"#E6EFF8", fontWeight:600 }}>{usdf(a.amount)}</td>
                      <td style={TD}><span className="chip chip-peer" style={{fontSize:10}}>{a.anomalyType}</span></td>
                      <td style={{ ...TD, fontSize:11, maxWidth:300 }}>{a.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert-bar success">No anomalies detected.</div>
          )}
        </div>
      )}

      {/* ── PDF Export ── */}
      {tab === "PDF Export" && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:16 }}>
            Generate Audit PDF Report
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
            <KpiCard label="Total Reports" value={String(metrics.total_reports)} accent="cobalt"/>
            <KpiCard label="High Risk"     value={String(metrics.high_risk)}     accent="crimson"/>
            <KpiCard label="Duplicates"    value={String(metrics.potential_duplicates)} accent="amber"/>
            <KpiCard label="Total Spend"   value={usd(metrics.total_spend)}      accent="emerald"/>
          </div>
          <div className="alert-bar info" style={{ marginBottom:20 }}>
            The PDF includes: Executive Summary, Risk Assessment, Duplicate Findings, Top Risk Employees, and Audit Recommendations. Suitable for audit committee presentation.
          </div>
          <button onClick={generatePdf} disabled={pdfLoading}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 24px", borderRadius:8, background:"#1659F5", color:"#fff", fontSize:13, fontWeight:600, border:"none", cursor:pdfLoading?"not-allowed":"pointer", opacity:pdfLoading?0.6:1 }}>
            <Download size={14}/> {pdfLoading ? "Generating…" : "Generate PDF Audit Report"}
          </button>
          {pdfUrl && (
            <div style={{ marginTop:16 }}>
              <div className="alert-bar success" style={{ marginBottom:10 }}>✓ Report generated successfully.</div>
              <a href={pdfUrl} download="AuditIQ_Report.pdf"
                style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 20px", borderRadius:8, background:"#0A1628", border:"1px solid #0E1E33", color:"#9BB8D8", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                <Download size={13}/> Download AuditIQ_Report.pdf
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
