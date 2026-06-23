type AlertVariant = "info" | "danger" | "success" | "warn";
export function Alert({ variant = "info", children, className }: {
  variant?: AlertVariant; children: React.ReactNode; className?: string
}) {
  return <div className={`alert-bar ${variant}${className ? " " + className : ""}`}>{children}</div>;
}
