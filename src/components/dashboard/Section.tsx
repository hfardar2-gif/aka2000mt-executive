import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

const dailyTitles = new Set(["Daily Production", "每日产量", "تولید روزانه"]);

const sectionClass =
  "rounded-2xl border border-[#D9E0E8] bg-white p-6 shadow-sm dark:border-border dark:bg-card " +
  "[&_table]:border-separate [&_table]:border-spacing-0 " +
  "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-[#F5F7FA] dark:[&_thead]:bg-secondary " +
  "[&_th]:h-11 [&_th]:px-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:text-[#66717E] " +
  "[&_td]:h-12 [&_td]:px-3 [&_tbody_tr:nth-child(even)]:bg-[#F8FAFC] dark:[&_tbody_tr:nth-child(even)]:bg-secondary/20 " +
  "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[#EEF3F8] dark:[&_tbody_tr:hover]:bg-secondary/40";

export function Section({ title, subtitle, children, action }: SectionProps) {
  const header = (
    <header className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-[#17365D] dark:text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm leading-6 text-[#66717E] dark:text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );

  if (dailyTitles.has(title)) {
    return (
      <details className={`${sectionClass} group`}>
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#17365D] dark:text-foreground">{title}</h2>
              {subtitle && <p className="mt-1 text-sm leading-6 text-[#66717E] dark:text-muted-foreground">{subtitle}</p>}
            </div>
            <span className="rounded-full border border-[#D9E0E8] bg-[#F5F7FA] px-3 py-1.5 text-xs font-semibold text-[#245A8D] transition-transform group-open:rotate-180 dark:border-border dark:bg-secondary/30">
              ↓
            </span>
          </div>
        </summary>
        <div className="mt-6 border-t border-[#D9E0E8] pt-6 dark:border-border">{children}</div>
      </details>
    );
  }

  return (
    <section className={sectionClass}>
      {header}
      {children}
    </section>
  );
}
