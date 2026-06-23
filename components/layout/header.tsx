"use client";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { useApp } from "@/lib/store";

export function Header() {
  const pathname  = usePathname();
  const { result } = useApp();
  const current = NAV_ITEMS.find(i => pathname === `/${i.id}` || (pathname === "/" && i.id === "dashboard"));
  const hasData = Boolean(result);

  return (
    <header style={{
      height:56, borderBottom:"1px solid #0E1E33",
      background:"rgba(3,11,24,0.95)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", padding:"0 32px", gap:16,
      position:"sticky", top:0, zIndex:30,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <h1 style={{ fontSize:15, fontWeight:700, color:"#E6EFF8", letterSpacing:"-0.01em", lineHeight:1 }}>
          {current?.label ?? "Dashboard"}
        </h1>
        <p style={{ fontSize:10, color:"#3D5975", marginTop:2 }}>AuditIQ · Expense Risk Intelligence</p>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span className="status-pill idle"><span className="status-dot"/>Local</span>
        {hasData ? (
          <span className="status-pill ok">
            <span className="status-dot" style={{ animation:"pulseDot 2s ease-in-out infinite" }}/>
            Analysis active — {result!.summary_metrics.total_reports} reports
          </span>
        ) : (
          <span className="status-pill idle"><span className="status-dot"/>No analysis loaded</span>
        )}
      </div>
    </header>
  );
}
