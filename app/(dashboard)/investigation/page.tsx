"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { RiskBadge, FlagChip } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { riskColor, usdf, parseFlags, FLAG_CONFIG, getRecommendedAction } from "@/lib/utils";
import type { ScoredExpense } from "@/types";

export default function InvestigationPage() {
  const { result } = useApp();
  const router = useRouter();
  const [riskF, setRiskF] = useState("All");
  const [deptF, setDeptF] = useState("All");
  const [typeF, setTypeF] = useState("All");
  const [search, setSearch] = useState("");

  if (!result) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-[32px] mb-4">⚑</div>
        <div className="text-[18px] font-bold text-ink-primary mb-2">No Analysis Loaded</div>
        <p className="text-[13px] text-ink-muted mb-6 max-w-md">
          Load expense data and run the AI analysis from the Executive Overview to see this section.
        </p>
        <button onClick={() => router.push("/dashboard")}
          className="px-4 py-2 rounded-md bg-brand-500 text-white text-[13px] font-semibold hover:bg-brand-600 transition-colors">
          ← Back to Overview
        </button>
      </div>
    );
  }

  const { scored_expenses: scored, anomalies, duplicates: dups } = result;

  // Build detail maps
  const dupDet:  Record<string, string> = {};
  const peerDet: Record<string, string> = {};
  const varDet:  Record<string, string> = {};
  const wkndDet: Record<string, string> = {};
  dups.forEach(d => {
    [d.reportId_A, d.reportId_B].forEach(rid => { dupDet[rid] = d.detail; });
  });
  anomalies.peer_outliers.forEach(r    => { peerDet[r.reportId] = r.detail; });
  anomalies.high_variance.forEach(r    => { varDet[r.reportId]  = r.detail; });
  anomalies.weekend_expenses.forEach(r => { wkndDet[r.reportId] = r.detail; });

  let flagged = scored.filter(e => e.risk_score > 0)
    .sort((a, b) => b.risk_score - a.risk_score);

  if (riskF !== "All") flagged = flagged.filter(e => e.risk_level === riskF);
  if (deptF !== "All") flagged = flagged.filter(e => e.department === deptF);
  if (typeF !== "All") flagged = flagged.filter(e => e.expenseType === typeF);
  if (search) {
    const s = search.toLowerCase();
    flagged = flagged.filter(e =>
      e.employeeName.toLowerCase().includes(s) || e.vendor.toLowerCase().includes(s)
    );
  }

  const expTotal = flagged.reduce((s, e) => s + e.amount, 0);
  const depts    = Array.from(new Set(scored.map(e => e.department))).sort();
  const types    = Array.from(new Set(scored.map(e => e.expenseType))).sort();

  const SelectClass = "bg-surface border border-surface-border rounded-md px-3 py-2 text-[13px] text-ink-secondary focus:outline-none focus:border-brand-500/50 h-9";

  return (
    <div className="p-8 space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <div className="eyebrow mb-1">Risk Investigation Center</div>
        <h1 className="text-[22px] font-extrabold text-ink-primary tracking-tight">
          Flagged Reports — Prioritized for Audit
        </h1>
        <p className="text-[13px] text-ink-muted mt-1">
          Every card shows exactly why a report was flagged, the financial exposure, and the recommended audit action.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={riskF} onChange={e => setRiskF(e.target.value)} className={SelectClass}>
          <option>All</option><option>High</option><option>Medium</option><option>Low</option>
        </select>
        <select value={deptF} onChange={e => setDeptF(e.target.value)} className={SelectClass}>
          <option>All</option>
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={typeF} onChange={e => setTypeF(e.target.value)} className={SelectClass}>
          <option>All</option>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search employee or vendor…"
          className="flex-1 min-w-48 bg-surface border border-surface-border rounded-md px-3 py-2
                     text-[13px] text-ink-secondary placeholder:text-ink-faint
                     focus:outline-none focus:border-brand-500/50 h-9"
        />
      </div>

      {/* Summary */}
      <Alert variant={riskF === "High" ? "danger" : riskF === "Medium" ? "warn" : "info"}>
        <strong>{flagged.length}</strong> flagged reports ·{" "}
        Financial exposure: <strong>{usdf(expTotal)}</strong> · Sorted by risk score
      </Alert>

      {/* Investigation cards */}
      <div className="space-y-3">
        {flagged.map(row => {
          const score  = Math.round(row.risk_score);
          const rc     = riskColor(score);
          const flags  = parseFlags(row.risk_flags);
          const dateStr = row.expenseDate.slice(0, 10);

          const reasons: string[] = [];
          if (dupDet[row.reportId])  reasons.push(dupDet[row.reportId]);
          if (peerDet[row.reportId]) reasons.push(peerDet[row.reportId]);
          if (varDet[row.reportId])  reasons.push(varDet[row.reportId]);
          if (wkndDet[row.reportId]) reasons.push(wkndDet[row.reportId]);
          if (!reasons.length) reasons.push("Elevated composite risk score based on spending pattern.");

          return (
            <div key={row.reportId}
              className={`inv-card border-l-[3px]`}
              style={{ borderLeftColor: rc }}>

              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="text-[15px] font-bold text-ink-primary">{row.employeeName}</div>
                  <div className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                    {row.department} · {row.expenseType} · {row.vendor} · {dateStr}
                    <span className="text-ink-faint ml-2">{row.reportId}</span>
                  </div>
                </div>
                <div className="risk-badge flex-shrink-0">
                  <div className="text-[26px] font-extrabold leading-none" style={{ color: rc }}>
                    {score}
                  </div>
                  <div className="text-[9px] font-bold text-ink-muted uppercase tracking-wider mt-0.5">
                    Risk Score
                  </div>
                </div>
              </div>

              {/* Flag chips */}
              {flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {flags.map(f => {
                    const cfg = FLAG_CONFIG[f];
                    return cfg ? (
                      <FlagChip key={f} label={cfg.label} variant={cfg.cls}/>
                    ) : null;
                  })}
                </div>
              )}

              {/* Financial details */}
              <div className="flex gap-6 flex-wrap bg-canvas rounded-md px-4 py-2.5 mb-3">
                {[
                  ["Claim Amount", usdf(row.amount)],
                  ["Currency",     row.currency],
                  ["City",         row.city],
                  ["Status",       row.approvalStatus],
                  ["Risk Level",   row.risk_level],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-[9px] font-semibold text-ink-muted uppercase tracking-widest mb-0.5">
                      {label}
                    </div>
                    <div className="text-[13px] font-bold text-ink-primary"
                         style={label === "Risk Level" ? { color: rc } : undefined}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Why flagged */}
              <div className="bg-amber-950/20 border border-amber-900/20 rounded-md p-3 mb-2">
                <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">
                  Why Flagged
                </div>
                <ul className="space-y-0.5">
                  {reasons.map((r, i) => (
                    <li key={i} className="text-[12px] text-ink-tertiary leading-relaxed">
                      • {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended action */}
              <div className="bg-brand-500/5 border border-brand-500/12 rounded-md p-3">
                <div className="text-[9px] font-bold text-brand-400 uppercase tracking-widest mb-1.5">
                  Recommended Audit Action
                </div>
                <p className="text-[12px] text-ink-tertiary leading-relaxed">
                  {getRecommendedAction(row.risk_flags)}
                </p>
              </div>
            </div>
          );
        })}

        {flagged.length === 0 && (
          <Alert variant="success">No flagged reports match the current filters.</Alert>
        )}
      </div>
    </div>
  );
}
