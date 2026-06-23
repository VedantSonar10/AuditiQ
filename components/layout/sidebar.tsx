"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShieldAlert, Users, Building2,
  Sparkles, FileText, Settings,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { useApp } from "@/lib/store";

const ICON_MAP = {
  LayoutDashboard, ShieldAlert, Users, Building2, Sparkles, FileText, Settings,
} as const;

type IconName = keyof typeof ICON_MAP;

export function Sidebar() {
  const pathname = usePathname();
  const { result } = useApp();
  const highRisk = result?.summary_metrics?.high_risk ?? 0;
  const hasData  = Boolean(result);
  const sections = Array.from(new Set(NAV_ITEMS.map(i => i.section)));

  return (
    <aside style={{
      position:"fixed", left:0, top:0, height:"100vh", width:220,
      background:"#020B16", borderRight:"1px solid #0E1E33",
      display:"flex", flexDirection:"column", zIndex:40,
    }}>
      {/* Brand */}
      <div style={{ padding:"20px 18px 16px", borderBottom:"1px solid #0E1E33", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:7, background:"#1659F5",
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 20L12 4L20 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.5 14.5h9" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"#E6EFF8", letterSpacing:"-0.02em", lineHeight:1 }}>AuditIQ</div>
            <div style={{ fontSize:9, fontWeight:500, color:"rgba(22,89,245,0.7)", textTransform:"uppercase", letterSpacing:"0.12em", marginTop:3 }}>Risk Intelligence</div>
          </div>
        </div>
      </div>

      {/* Analysis status badge */}
      {hasData && (
        <div style={{ margin:"12px 12px 0", padding:"9px 12px", borderRadius:8,
                      background:"rgba(12,138,92,0.07)", border:"1px solid rgba(12,138,92,0.14)" }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#6EE7B7", textTransform:"uppercase", letterSpacing:"0.12em" }}>
            Analysis Active
          </div>
          <div style={{ fontSize:11, color:"#6A8BAD", marginTop:2 }}>
            {result!.summary_metrics.total_reports} reports · ${(result!.summary_metrics.total_spend / 1000).toFixed(0)}K analyzed
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex:1, overflowY:"auto", paddingTop:8, paddingBottom:64 }}>
        {sections.map(section => (
          <div key={section}>
            <div style={{ padding:"14px 18px 4px", fontSize:9, fontWeight:700,
                          color:"#1A3A5E", textTransform:"uppercase", letterSpacing:"0.18em" }}>
              {section}
            </div>
            {NAV_ITEMS.filter(item => item.section === section).map(item => {
              const Icon = ICON_MAP[item.icon as IconName];
              const isActive = pathname === `/${item.id}` || (pathname === "/" && item.id === "dashboard");
              const badge = item.id === "investigation" && highRisk > 0 ? highRisk : null;

              return (
                <Link key={item.id} href={item.href} style={{ textDecoration:"none" }}>
                  <div className={`nav-item${isActive ? " active" : ""}`}>
                    {Icon && <Icon size={14} style={{ flexShrink:0, opacity:0.8 }}/>}
                    <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {item.label}
                    </span>
                    {badge && (
                      <span style={{ fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:9999,
                                     background:"rgba(201,54,54,0.15)", color:"#FCA5A5",
                                     border:"1px solid rgba(201,54,54,0.3)" }}>
                        {badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 18px 18px",
                    borderTop:"1px solid #0E1E33", background:"#020B16" }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.12em" }}>
          Concur enforces policy
        </div>
        <div style={{ fontSize:10, color:"#1A3A5E", marginTop:2, lineHeight:1.4 }}>AI identifies risk</div>
      </div>
    </aside>
  );
}
