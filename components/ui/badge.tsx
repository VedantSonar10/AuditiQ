import type { RiskLevel } from "@/types";

const RISK_STYLES: Record<RiskLevel, React.CSSProperties> = {
  High:   { background:"rgba(201,54,54,0.12)",  color:"#FCA5A5", border:"1px solid rgba(201,54,54,0.25)" },
  Medium: { background:"rgba(201,125,16,0.12)", color:"#FCD34D", border:"1px solid rgba(201,125,16,0.25)" },
  Low:    { background:"rgba(12,138,92,0.12)",  color:"#6EE7B7", border:"1px solid rgba(12,138,92,0.25)" },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span style={{
      ...RISK_STYLES[level],
      display:"inline-flex", alignItems:"center",
      padding:"2px 8px", borderRadius:9999, fontSize:11, fontWeight:600,
    }}>{level}</span>
  );
}

export function AiBadge() {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px",
      borderRadius:4, fontSize:9, fontWeight:700, color:"#4D8EFF",
      background:"rgba(22,89,245,0.1)", border:"1px solid rgba(22,89,245,0.2)",
      textTransform:"uppercase", letterSpacing:"0.14em",
    }}>◆ AuditIQ</span>
  );
}

export function FlagChip({ label, variant }: { label: string; variant: string }) {
  return <span className={`chip ${variant}`} style={{ fontSize:11 }}>{label}</span>;
}
