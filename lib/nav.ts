import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",    label: "Executive Overview",     href: "/dashboard",    icon: "LayoutDashboard", section: "ANALYSIS"   },
  { id: "investigation",label: "Risk Investigation",      href: "/investigation", icon: "ShieldAlert",     section: "ANALYSIS"   },
  { id: "employees",    label: "Employee Profiles",       href: "/employees",    icon: "Users",           section: "ANALYSIS"   },
  { id: "departments",  label: "Department Intelligence", href: "/departments",  icon: "Building2",       section: "ANALYSIS"   },
  { id: "ai-insights",  label: "AI Audit Insights",       href: "/ai-insights",  icon: "Sparkles",        section: "ANALYSIS"   },
  { id: "compliance",   label: "Compliance Reports",      href: "/compliance",   icon: "FileText",        section: "REPORTING"  },
  { id: "settings",     label: "Settings",                href: "/settings",     icon: "Settings",        section: "SYSTEM"     },
];
