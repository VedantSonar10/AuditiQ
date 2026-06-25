"use client";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { useApp } from "@/lib/store";

export function Header() {
  const pathname = usePathname();
  const { result } = useApp();
  const current = NAV_ITEMS.find(i =>
    pathname === `/${i.id}` || (pathname === "/" && i.id === "dashboard")
  );
  const hasData = Boolean(result);

  return (
    <header style={{
      height:48,
      borderBottom:"1px solid rgba(255,255,255,0.05)",
      background:"rgba(5,13,26,0.96)",
      backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", padding:"0 24px", gap:16,
      position:"sticky", top:0, zIndex:30,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <span style={{ fontSize:14, fontWeight:600, color:"#E6EFF8", letterSpacing:"-0.01em" }}>
          {current?.label ?? "Dashboard"}
        </span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{
          display:"inline-flex", alignItems:"center", gap:5,
          fontSize:11, color:"#3D5975", padding:"3px 8px",
          border:"1px solid rgba(255,255,255,0.05)", borderRadius:5,
        }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#2A4A6A", display:"inline-block" }}/>
          Local
        </span>
        <span style={{
          display:"inline-flex", alignItems:"center", gap:5,
          fontSize:11, padding:"3px 8px",
          border:`1px solid ${hasData ? "rgba(12,138,92,0.2)" : "rgba(255,255,255,0.05)"}`,
          borderRadius:5,
          color: hasData ? "#6EE7B7" : "#3D5975",
          background: hasData ? "rgba(12,138,92,0.06)" : "transparent",
        }}>
          <span style={{
            width:5, height:5, borderRadius:"50%",
            background: hasData ? "#6EE7B7" : "#2A4A6A",
            display:"inline-block",
            animation: hasData ? "pulseDot 2s ease-in-out infinite" : "none",
          }}/>
          {hasData
            ? `${result!.summary_metrics.total_reports} reports · ${(result!.summary_metrics.total_spend/1000).toFixed(0)}K analyzed`
            : "No data loaded"}
        </span>
      </div>
    </header>
  );
}