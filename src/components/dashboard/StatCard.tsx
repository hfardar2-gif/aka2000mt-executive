import type { ReactNode } from "react";
import report from "@/data/report.json";
import { ExecutiveOverview } from "@/components/dashboard/ExecutiveOverview";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  icon?: ReactNode;
  accent?: "primary" | "accent" | "chart-2" | "chart-4";
}

const inputLabels = {
  en: "Input Coil Tonnage",
  zh: "输入卷材吨位",
  fa: "تناژ کویل‌های ورودی",
} as const;

export function StatCard({ label, value, unit, hint, icon, accent = "primary" }: StatCardProps) {
  const accentColor = {
    primary: "text-primary",
    accent: "text-accent",
    "chart-2": "text-[var(--color-chart-2)]",
    "chart-4": "text-[var(--color-chart-4)]",
  }[accent];

  const lang = (Object.entries(inputLabels).find(([, translatedLabel]) => translatedLabel === label)?.[0] ??
    null) as "en" | "zh" | "fa" | null;

  const data = report as unknown as {
    totals?: Array<{ galvanized?: number; sold?: number }>;
    plan?: Array<{ tons?: number | string; status?: unknown }>;
    transport?: { readyWarehouse?: number };
  };

  const totals = data.totals?.[0];
  const plan = data.plan ?? [];
  const totalPlanned = plan.reduce((sum, item) => sum + (Number(item.tons) || 0), 0);
  const completedPlan = plan.reduce((sum, item) => {
    const status =
      typeof item.status === "string"
        ? item.status
        : item.status && typeof item.status === "object"
          ? Object.values(item.status as Record<string, unknown>).join(" ")
          : "";
    return /complete|completed|done|finished/i.test(status) ? sum + (Number(item.tons) || 0) : sum;
  }, 0);
  const galvanized = Number(totals?.galvanized) || 0;
  const totalActual = completedPlan > 0 ? completedPlan : galvanized;

  const card = (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-3xl font-semibold tabular-nums ${accentColor}`}>{value}</span>
            {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className={`rounded-lg border border-border bg-secondary/40 p-2 ${accentColor}`}>{icon}</div>
        )}
      </div>
    </div>
  );

  if (!lang) return card;

  return (
    <>
      <div className="col-span-full mb-2">
        <ExecutiveOverview
          lang={lang}
          totalPlanned={totalPlanned}
          totalActual={totalActual}
          galvanized={galvanized}
          sold={Number(totals?.sold) || 0}
          readyToShip={Number(data.transport?.readyWarehouse) || 0}
          tonLabel={unit ?? (lang === "zh" ? "吨" : lang === "fa" ? "تن" : "ton")}
        />
      </div>
      {card}
    </>
  );
}
