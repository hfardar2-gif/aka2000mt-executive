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
    "chart-2": "text-[#6B7C8F]",
    "chart-4": "text-[#17365D]",
  }[accent];

  const lang = (Object.entries(inputLabels).find(([, translatedLabel]) => translatedLabel === label)?.[0] ??
    null) as "en" | "zh" | "fa" | null;

  const card = (
    <div className="order-2 group min-h-[98px] rounded-xl border border-[#E2E7EC] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#B8C6D4] hover:shadow-[0_8px_24px_rgba(23,54,93,0.06)] dark:border-border dark:bg-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-[#66717E] dark:text-muted-foreground">{label}</p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-[27px] font-semibold leading-none tabular-nums ${accentColor}`}>{value}</span>
            {unit && <span className="text-xs font-medium text-[#66717E] dark:text-muted-foreground">{unit}</span>}
          </p>
          {hint && <p className="mt-1 text-xs text-[#66717E] dark:text-muted-foreground">{hint}</p>}
        </div>
        {icon && <div className={`rounded-lg bg-[#F4F6F8] p-2 dark:bg-secondary/30 ${accentColor}`}>{icon}</div>}
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
