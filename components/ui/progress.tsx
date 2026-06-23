export function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width:`${Math.min(Math.max(value,0),100)}%`, background:color }}/>
    </div>
  );
}
