// ─── Core data types ─────────────────────────────────────────────────────────

export type ApprovalStatus = "Approved" | "Pending" | "Rejected";
export type RiskLevel      = "High" | "Medium" | "Low";
export type Department     = "Sales" | "Marketing" | "Engineering" | "Finance";
export type ExpenseType    = "Hotel" | "Taxi" | "Flight" | "Meals" | "Client Entertainment";

export interface ExpenseRecord {
  reportId:       string;
  employeeId:     string;
  employeeName:   string;
  department:     Department;
  expenseDate:    string;
  expenseType:    ExpenseType;
  vendor:         string;
  amount:         number;
  currency:       string;
  city:           string;
  approvalStatus: ApprovalStatus;
}

export interface ScoredExpense extends ExpenseRecord {
  risk_score: number;
  risk_level: RiskLevel;
  risk_flags: string;
}

// ─── Anomaly types ────────────────────────────────────────────────────────────

export type AnomalyType =
  | "High Spending Variance"
  | "Peer Outlier"
  | "Weekend Expense"
  | "Unusual Category"
  | "Duplicate Claim";

export interface AnomalyFinding {
  reportId:     string;
  employeeId:   string;
  employeeName: string;
  department:   string;
  expenseType:  string;
  vendor:       string;
  amount:       number;
  expenseDate:  string;
  city:         string;
  anomalyType:  AnomalyType;
  detail:       string;
}

export interface DuplicateFinding {
  reportId_A:    string;
  reportId_B:    string;
  employeeId:    string;
  employeeName:  string;
  department:    string;
  vendor:        string;
  amount:        number;
  expenseDate_A: string;
  expenseDate_B: string;
  daysBetween:   number;
  expenseType:   string;
  city:          string;
  anomalyType:   "Duplicate Claim";
  detail:        string;
}

// ─── Risk engine outputs ──────────────────────────────────────────────────────

export interface AnomalySet {
  high_variance:      AnomalyFinding[];
  peer_outliers:      AnomalyFinding[];
  weekend_expenses:   AnomalyFinding[];
  unusual_categories: AnomalyFinding[];
}

export interface SummaryMetrics {
  total_reports:       number;
  high_risk:           number;
  medium_risk:         number;
  low_risk:            number;
  potential_duplicates: number;
  total_spend:         number;
  avg_risk_score:      number;
}

export interface EmployeeSummary {
  employeeId:        string;
  employeeName:      string;
  department:        string;
  total_expenses:    number;
  total_amount:      number;
  avg_risk_score:    number;
  max_risk_score:    number;
  high_risk_count:   number;
  medium_risk_count: number;
}

export interface AIInsight {
  risk_level:     RiskLevel;
  reason:         string;
  recommendation: string;
  source:         string;
  raw?:           string;
}

export interface ScoredExpenseWithInsight extends ScoredExpense {
  ai_insight: AIInsight;
}

// ─── Full pipeline result ────────────────────────────────────────────────────

export interface AnalysisResult {
  scored_expenses:  ScoredExpense[];
  anomalies:        AnomalySet;
  duplicates:       DuplicateFinding[];
  employee_summary: EmployeeSummary[];
  ai_insights:      ScoredExpenseWithInsight[];
  executive_summary: string;
  summary_metrics:  SummaryMetrics;
  error?:           string;
}

// ─── Department aggregates ────────────────────────────────────────────────────

export interface DepartmentMetrics {
  department:    string;
  total_spend:   number;
  avg_risk:      number;
  total_reports: number;
  high_risk:     number;
  med_risk:      number;
  employees:     number;
  compliance:    number;
}

// ─── Chart data types ─────────────────────────────────────────────────────────

export interface RiskDistributionDatum {
  name:  RiskLevel;
  value: number;
  color: string;
}

export interface MonthlySpendDatum {
  month:  string;
  amount: number;
}

export interface CategorySpendDatum {
  category: string;
  amount:   number;
}

export interface DeptScatterDatum {
  department: string;
  spend:      number;
  risk:       number;
  count:      number;
}

// ─── UI state types ───────────────────────────────────────────────────────────

export interface NavItem {
  id:      string;
  label:   string;
  href:    string;
  icon:    string;
  section: "ANALYSIS" | "REPORTING" | "SYSTEM";
  badge?:  number;
}

export type AccentColor = "cobalt" | "crimson" | "amber" | "emerald" | "violet";
