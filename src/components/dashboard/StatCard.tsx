import type { ReactNode } from "react";
import { ExecutivePhaseOne } from "@/components/dashboard/ExecutivePhaseOne";
import { SteelConversionRatios } from "@/components/dashboard/SteelConversionRatios";

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
    primary: "text-[#4E6575]",
    accent: "text-[#667986]",
    "chart-2": "text-[#8A5A33]",
    "chart-4": "text-[#303A41]",
  }[accent];

  const lang = (Object.entries(inputLabels).find(([, translatedLabel]) => translatedLabel === label)?.[0] ??
    null) as "en" | "zh" | "fa" | null;

  const card = (
    <div className="order-2 group min-h-[98px] rounded-lg border border-[#BCC3C8] bg-[#F4F5F5] p-4 transition-all hover:-translate-y-0.5 hover:border-[#7F8A91] hover:bg-white hover:shadow-[0_6px_18px_rgba(24,29,33,0.08)] dark:border-border dark:bg-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#687178] dark:text-muted-foreground">{label}</p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-[27px] font-semibold leading-none tabular-nums ${accentColor}`}>{value}</span>
            {unit && <span className="text-xs font-medium text-[#687178] dark:text-muted-foreground">{unit}</span>}
          </p>
          {hint && <p className="mt-1 text-xs text-[#687178] dark:text-muted-foreground">{hint}</p>}
        </div>
        {icon && <div className={`rounded-md border border-[#C8CDD0] bg-[#E5E8EA] p-2 dark:bg-secondary/30 ${accentColor}`}>{icon}</div>}
      </div>
    </div>
  );

  if (!lang) return card;

  return (
    <>
      <ExecutivePhaseOne lang={lang} />
      <SteelConversionRatios lang={lang} />
      {card}
    </>
  );
}
