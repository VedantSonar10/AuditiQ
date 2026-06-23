"use client";
import { useApp } from "@/lib/store";
import { OnboardingPanel } from "@/components/dashboard/onboarding";
import { CommandCenter }  from "@/components/dashboard/command-center";

export default function DashboardPage() {
  const { result, loading } = useApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full
                          animate-spin mx-auto mb-4"/>
          <div className="text-[14px] font-semibold text-ink-primary">Running AuditIQ Analysis</div>
          <div className="text-[12px] text-ink-muted mt-1">
            Detecting anomalies, duplicates, and risk patterns…
          </div>
        </div>
      </div>
    );
  }

  return result ? <CommandCenter/> : <OnboardingPanel/>;
}
