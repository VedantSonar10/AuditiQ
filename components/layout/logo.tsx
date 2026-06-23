import { cn } from "@/lib/utils";

export function AuditIQLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="7" fill="#1659F5"/>
      <path d="M7 24L16 8l9 16" stroke="white" strokeWidth="2.4"
            strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 18.5h11" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  );
}

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-[30px] h-[30px] rounded-[7px] bg-brand-500 flex items-center justify-center flex-shrink-0">
        <AuditIQLogo size={16}/>
      </div>
      {!collapsed && (
        <div>
          <div className="text-[15px] font-extrabold text-ink-primary tracking-tight leading-none">
            AuditIQ
          </div>
          <div className="text-[9px] font-medium text-brand-500/70 uppercase tracking-widest mt-0.5">
            Risk Intelligence
          </div>
        </div>
      )}
    </div>
  );
}
