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
  const sections = Array.from(new Set(NAV_ITEMS.map(i => i.section)));

  return (
    <aside style={{
      position:"fixed", left:0, top:0, height:"100vh", width:200,
      background:"#050D1A", borderRight:"1px solid rgba(255,255,255,0.05)",
      display:"flex", flexDirection:"column", zIndex:40,
    }}>
      <Link href="/dashboard" style={{ textDecoration:"none" }}>
        <div style={{
          padding:"16px 16px 14px",
          borderBottom:"1px solid rgba(255,255,255,0.05)",
          display:"flex", alignItems:"center", gap:9, cursor:"pointer",
        }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect width="26" height="26" rx="6" fill="#1659F5"/>
            <path d="M6 20L13 6L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 15.5h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#F0F6FF", letterSpacing:"-0.02em", lineHeight:1 }}>
              AuditIQ
            </div>
            <div style={{ fontSize:9, color:"rgba(22,89,245,0.65)", letterSpacing:"0.08em", marginTop:2 }}>
              RISK INTELLIGENCE
            </div>
          </div>
        </div>
      </Link>

      <nav style={{ flex:1, overflowY:"auto", padding:"8px 0 48px" }}>
        {sections.map(section => (
          <div key={section}>
            <div style={{
              padding:"12px 16px 3px",
              fontSize:9, fontWeight:600, color:"#1E3D5A",
              textTransform:"uppercase", letterSpacing:"0.14em",
            }}>
              {section}
            </div>
            {NAV_ITEMS.filter(i => i.section === section).map(item => {
              const Icon = ICON_MAP[item.icon as IconName];
              const isActive = pathname === `/${item.id}` || (pathname === "/" && item.id === "dashboard");
              const badge = item.id === "investigation" && highRisk > 0 ? highRisk : null;

              return (
                <Link key={item.id} href={item.href} style={{ textDecoration:"none", display:"block" }}>
                  <div style={{
                    display:"flex", alignItems:"center", gap:8,
                    padding:"7px 16px",
                    fontSize:13, fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#E6EFF8" : "#4A6580",
                    background: isActive ? "rgba(22,89,245,0.08)" : "transparent",
                    borderLeft:`2px solid ${isActive ? "#1659F5" : "transparent"}`,
                    transition:"color 0.1s, background 0.1s",
                  }}>
                    {Icon && <Icon size={13} style={{ flexShrink:0, opacity: isActive ? 0.9 : 0.6 }}/>}
                    <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {item.label}
                    </span>
                    {badge && (
                      <span style={{
                        fontSize:10, fontWeight:700, padding:"1px 5px",
                        borderRadius:9999, background:"rgba(201,54,54,0.18)",
                        color:"#F28B8B", border:"1px solid rgba(201,54,54,0.25)",
                      }}>
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

      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        padding:"10px 16px 14px",
        borderTop:"1px solid rgba(255,255,255,0.04)",
        background:"#050D1A",
      }}>
        <div style={{ fontSize:9, fontWeight:600, color:"#1659F5", textTransform:"uppercase", letterSpacing:"0.1em" }}>
          Concur enforces policy
        </div>
        <div style={{ fontSize:9, color:"#1A3A5E", marginTop:1 }}>AI identifies risk</div>
      </div>
    </aside>
  );
}