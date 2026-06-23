import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskLevel, AccentColor, ScoredExpense, DepartmentMetrics,
              RiskDistributionDatum, MonthlySpendDatum, CategorySpendDatum,
              DeptScatterDatum } from "@/types";

// ─── Class merging ────────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency formatting ──────────────────────────────────────────────────────
export function usd(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export function usdf(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2
  }).format(v);
}

// ─── Risk helpers ─────────────────────────────────────────────────────────────
export function riskColor(score: number): string {
  if (score >= 61) return "#C93636";
  if (score >= 31) return "#C97D10";
  return "#0C8A5C";
}

export function riskLevel(score: number): RiskLevel {
  if (score >= 61) return "High";
  if (score >= 31) return "Medium";
  return "Low";
}

export function riskBgClass(level: RiskLevel): string {
  return {
    High:   "bg-risk-high-bg text-red-300 border border-red-900/30",
    Medium: "bg-risk-medium-bg text-amber-300 border border-amber-900/30",
    Low:    "bg-risk-low-bg text-emerald-300 border border-emerald-900/30",
  }[level];
}

export function accentBorderClass(level: RiskLevel): string {
  return {
    High:   "border-l-risk-high",
    Medium: "border-l-risk-medium",
    Low:    "border-l-risk-low",
  }[level];
}

// ─── Flag chip config ────────────────────────────────────────────────────────
export const FLAG_CONFIG: Record<string, { cls: string; label: string }> = {
  "Duplicate":        { cls: "bg-red-950/50 text-red-300 border border-red-900/30",    label: "Duplicate" },
  "Peer Outlier":     { cls: "bg-amber-950/50 text-amber-300 border border-amber-900/30", label: "Peer Outlier" },
  "High Variance":    { cls: "bg-violet-950/50 text-violet-300 border border-violet-900/30", label: "High Variance" },
  "Weekend":          { cls: "bg-blue-950/50 text-blue-300 border border-blue-900/30",  label: "Weekend" },
  "Unusual Category": { cls: "bg-emerald-950/50 text-emerald-300 border border-emerald-900/30", label: "Unusual" },
};

export function parseFlags(flagsStr: string): string[] {
  if (!flagsStr || flagsStr === "None") return [];
  return flagsStr.split(", ").map(f => f.trim()).filter(Boolean);
}

// ─── KPI accent map ──────────────────────────────────────────────────────────
export const ACCENT_MAP: Record<AccentColor, { bar: string; text: string }> = {
  cobalt:  { bar: "bg-brand-500",  text: "text-brand-400"  },
  crimson: { bar: "bg-risk-high",  text: "text-red-400"    },
  amber:   { bar: "bg-risk-medium",text: "text-amber-400"  },
  emerald: { bar: "bg-risk-low",   text: "text-emerald-400"},
  violet:  { bar: "bg-violet-500", text: "text-violet-400" },
};

// ─── Chart data transformers ─────────────────────────────────────────────────
export function toRiskDistribution(expenses: ScoredExpense[]): RiskDistributionDatum[] {
  const counts = { High: 0, Medium: 0, Low: 0 };
  expenses.forEach(e => { counts[e.risk_level]++; });
  return [
    { name: "High",   value: counts.High,   color: "#C93636" },
    { name: "Medium", value: counts.Medium, color: "#C97D10" },
    { name: "Low",    value: counts.Low,    color: "#0C8A5C" },
  ];
}

export function toMonthlySpend(expenses: ScoredExpense[]): MonthlySpendDatum[] {
  const map: Record<string, number> = {};
  expenses.forEach(e => {
    const m = e.expenseDate.substring(0, 7);
    map[m] = (map[m] || 0) + e.amount;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));
}

export function toCategorySpend(expenses: ScoredExpense[]): CategorySpendDatum[] {
  const map: Record<string, number> = {};
  expenses.forEach(e => { map[e.expenseType] = (map[e.expenseType] || 0) + e.amount; });
  return Object.entries(map)
    .sort(([,a], [,b]) => b - a)
    .map(([category, amount]) => ({ category, amount }));
}

export function toDeptScatter(expenses: ScoredExpense[]): DeptScatterDatum[] {
  const map: Record<string, { spend: number; risk: number; count: number }> = {};
  expenses.forEach(e => {
    if (!map[e.department]) map[e.department] = { spend: 0, risk: 0, count: 0 };
    map[e.department].spend += e.amount;
    map[e.department].risk  += e.risk_score;
    map[e.department].count++;
  });
  return Object.entries(map).map(([department, d]) => ({
    department,
    spend: d.spend,
    risk:  d.risk / d.count,
    count: d.count,
  }));
}

export function toDepartmentMetrics(expenses: ScoredExpense[]): DepartmentMetrics[] {
  const map: Record<string, DepartmentMetrics> = {};
  expenses.forEach(e => {
    if (!map[e.department]) {
      map[e.department] = {
        department: e.department, total_spend: 0, avg_risk: 0,
        total_reports: 0, high_risk: 0, med_risk: 0, employees: 0, compliance: 0,
      };
    }
    const d = map[e.department];
    d.total_spend   += e.amount;
    d.avg_risk      += e.risk_score;
    d.total_reports++;
    if (e.risk_level === "High")   d.high_risk++;
    if (e.risk_level === "Medium") d.med_risk++;
  });

  // unique employees
  const empByDept: Record<string, Set<string>> = {};
  expenses.forEach(e => {
    if (!empByDept[e.department]) empByDept[e.department] = new Set();
    empByDept[e.department].add(e.employeeId);
  });

  return Object.values(map)
    .map(d => ({
      ...d,
      avg_risk:  d.avg_risk / d.total_reports,
      employees: empByDept[d.department]?.size || 0,
      compliance: Math.max(0, 100 - d.avg_risk / d.total_reports),
    }))
    .sort((a, b) => b.avg_risk - a.avg_risk);
}

// ─── Recommended action logic ────────────────────────────────────────────────
export function getRecommendedAction(flags: string): string {
  if (flags.includes("Duplicate"))
    return "Cross-reference with the original approved report. Request employee confirmation and initiate recovery procedures if confirmed. Freeze subsequent reimbursements pending review.";
  if (flags.includes("Peer Outlier"))
    return "Request itemized receipts and written business justification. Validate against approved per-diem limits for this department. Escalate to department head if over 2× peer average.";
  if (flags.includes("High Variance"))
    return "Compare against the employee's prior 6-month submissions for this expense type. Confirm pricing is consistent with market rates. Require manager co-sign before approval.";
  if (flags.includes("Weekend"))
    return "Obtain written business justification with manager counter-signature. Confirm travel was pre-approved under the applicable travel authorization.";
  return "Flag for inclusion in the next scheduled audit cycle. Request supporting receipts if not already attached in Concur.";
}

// ─── Number helpers ──────────────────────────────────────────────────────────
export function pct(value: number, total: number): string {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(0)}%`;
}

export function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v));
}

// Alias used by employee page
export const rlevel = riskLevel;
