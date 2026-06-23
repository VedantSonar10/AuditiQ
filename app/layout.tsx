import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/layout/provider";
import { Sidebar }    from "@/components/layout/sidebar";
import { Header }     from "@/components/layout/header";

export const metadata: Metadata = {
  title: "AuditIQ — Expense Risk Intelligence",
  description: "AI-powered SAP Concur expense audit platform for CFOs and Internal Auditors",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin:0, background:"#030B18", color:"#E6EFF8", fontFamily:"Inter,-apple-system,BlinkMacSystemFont,sans-serif" }}>
        <AppProvider>
          <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
            <Sidebar/>
            <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, marginLeft:220 }}>
              <Header/>
              <main style={{ flex:1, overflowY:"auto", background:"#030B18" }}>
                {children}
              </main>
            </div>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
