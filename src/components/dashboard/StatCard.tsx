import type { ReactNode } from "react";
import { ExecutivePhaseOne } from "@/components/dashboard/ExecutivePhaseOne";

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
    primary: "text-[#245A8D]",
    accent: "text-[#2E7D5B]",
    "chart-2": "text-[#C98316]",
    "chart-4": "text-[#17365D]",
  }[accent];

  const lang = (Object.entries(inputLabels).find(([, translatedLabel]) => translatedLabel === label)?.[0] ??
    null) as "en" | "zh" | "fa" | null;

  const card = (
    <div className="order-2 group relative min-h-[108px] overflow-hidden rounded-2xl border border-[#D9E0E8] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#245A8D]/40 hover:shadow-md dark:border-border dark:bg-card">
      <div
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-25"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[12px] font-semibold text-[#66717E] dark:text-muted-foreground">{label}</p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-[28px] font-bold leading-none tabular-nums ${accentColor}`}>{value}</span>
            {unit && <span className="text-xs font-medium text-[#66717E] dark:text-muted-foreground">{unit}</span>}
          </p>
          {hint && <p className="mt-1 text-xs text-[#66717E] dark:text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className={`rounded-lg border border-[#D9E0E8] bg-[#F5F7FA] p-2 dark:border-border dark:bg-secondary/40 ${accentColor}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  if (!lang) return card;

  return (
    <>
      <ExecutivePhaseOne lang={lang} />
      {card}
    </>
  );
}
