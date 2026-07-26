import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  icon?: ReactNode;
  accent?: "primary" | "accent" | "chart-2" | "chart-4";
}

export function StatCard({ label, value, unit, hint, icon, accent = "primary" }: StatCardProps) {
  const accentColor = {
    primary: "text-primary",
    accent: "text-accent",
    "chart-2": "text-[var(--color-chart-2)]",
    "chart-4": "text-[var(--color-chart-4)]",
  }[accent];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40">
      <div
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-3xl font-semibold tabular-nums ${accentColor}`}>{value}</span>
            {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className={`rounded-lg border border-border bg-secondary/40 p-2 ${accentColor}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
