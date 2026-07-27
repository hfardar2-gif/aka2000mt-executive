import { useEffect, useRef, type ReactNode } from "react";
import report from "@/data/report.json";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

const dailyTitles = new Set(["Daily Production", "每日产量", "تولید روزانه"]);
const planTitles = new Set(["Plan vs Actual Production", "计划与实际产量", "مقایسه برنامه با تولید واقعی"]);

const transportNotes: Record<string, string> = {
  Transport:
    "Under loading means the customer has not yet paid. After financial settlement, the customer's shipment will be dispatched.",
  运输: "装载中表示客户尚未付款；完成财务结算后，该客户的货物将安排发运。",
  "حمل‌ونقل":
    "در حال بارگیری یعنی هنوز مشتری وجه خود را پرداخت نکرده و پس از تسویهٔ مالی، محمولهٔ ایشان حمل می‌گردد.",
};

const sectionClass =
  "rounded-2xl border border-[#D9E0E8] bg-white p-6 shadow-sm dark:border-border dark:bg-card " +
  "[&_table]:border-separate [&_table]:border-spacing-0 " +
  "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-[#F5F7FA] dark:[&_thead]:bg-secondary " +
  "[&_th]:h-11 [&_th]:px-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:text-[#66717E] " +
  "[&_td]:h-12 [&_td]:px-3 [&_tbody_tr:nth-child(even)]:bg-[#F8FAFC] dark:[&_tbody_tr:nth-child(even)]:bg-secondary/20 " +
  "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[#EEF3F8] dark:[&_tbody_tr:hover]:bg-secondary/40";

const readNumber = (value: string) => Number(value.replace(/[^\d.-]/g, "")) || 0;

export function Section({ title, subtitle, children, action }: SectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const logo = document.querySelector<HTMLImageElement>('header img[alt="AKA"]');
      const metadata = logo?.closest<HTMLElement>(".flex.items-center.gap-6.text-sm");
      const parent = metadata?.parentElement;
      if (!logo || !metadata || !parent || parent.querySelector("[data-aka-logo-meta]")) return;

      const wrapper = document.createElement("div");
      wrapper.dataset.akaLogoMeta = "true";
      wrapper.className = "flex flex-col items-end gap-3";
      parent.insertBefore(wrapper, metadata);
      wrapper.appendChild(logo);
      wrapper.appendChild(metadata);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!planTitles.has(title) || !sectionRef.current) return;

    const section = sectionRef.current;
    const labels = Array.from(section.querySelectorAll("p"));
    const plannedLabel = labels.find((item) => /Total planned|计划总量|مجموع برنامه/i.test(item.textContent ?? ""));
    const actualLabel = labels.find((item) => /Total actual|实际总量|مجموع واقعی/i.test(item.textContent ?? ""));
    const achievementLabel = labels.find((item) => /Achievement|完成率|درصد تحقق/i.test(item.textContent ?? ""));

    const plannedValue = plannedLabel?.parentElement?.querySelector("p:nth-child(2)");
    const actualValue = actualLabel?.parentElement?.querySelector("p:nth-child(2)");
    const achievementValue = achievementLabel?.parentElement?.querySelector("p:nth-child(2)");
    const planned = readNumber(plannedValue?.textContent ?? "");
    const actual = Number(report.totals.galvanized) || 0;
    const unit = title === "计划与实际产量" ? "吨" : title === "مقایسه برنامه با تولید واقعی" ? "تن" : "ton";

    if (actualValue) actualValue.textContent = `${actual.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${unit}`;
    if (achievementValue) {
      achievementValue.textContent = `${(planned > 0 ? (actual / planned) * 100 : 0).toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} %`;
    }
  }, [title]);

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
    <section ref={sectionRef} className={sectionClass}>
      {header}
      {children}
      {transportNotes[title] ? (
        <p className="mt-4 rounded-xl border border-[#D9E0E8] bg-[#F5F7FA] px-4 py-3 text-xs leading-6 text-[#66717E] dark:border-border dark:bg-secondary/20 dark:text-muted-foreground">
          {transportNotes[title]}
        </p>
      ) : null}
    </section>
  );
}
