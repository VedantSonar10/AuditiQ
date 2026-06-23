import type { AccentColor } from "@/types";

const ACCENT_COLORS: Record<AccentColor, string> = {
  cobalt:  "#1659F5",
  crimson: "#C93636",
  amber:   "#C97D10",
  emerald: "#0C8A5C",
  violet:  "#7C3AED",
};

interface KpiCardProps {
  label:   string;
  value:   string;
  sub?:    string;
  accent?: AccentColor;
}

export function KpiCard({ label, value, sub, accent = "cobalt" }: KpiCardProps) {
  return (
    <div className="kpi-card" style={{ "--accent": ACCENT_COLORS[accent] } as React.CSSProperties}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:ACCENT_COLORS[accent] }}/>
      <p style={{ fontSize:10, fontWeight:600, color:"#3D5975", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>
        {label}
      </p>
      <p style={{ fontSize: value.length > 8 ? 17 : 21, fontWeight:800, color:"#E6EFF8", lineHeight:1, letterSpacing:"-0.02em" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize:11, color:"#3D5975", marginTop:5 }}>{sub}</p>}
    </div>
  );
}
