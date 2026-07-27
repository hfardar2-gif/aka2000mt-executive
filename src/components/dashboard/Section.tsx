import { useEffect, useRef, type ReactNode } from "react";
import report from "@/data/report.json";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

const planTitles = new Set(["Plan vs Actual Production", "计划与实际产量", "مقایسه برنامه با تولید واقعی"]);

const transportNotes: Record<string, string> = {
  Transport:
    "Under loading means the customer has not yet paid. After financial settlement, the customer's shipment will be dispatched.",
  运输: "装载中表示客户尚未付款；完成财务结算后，该客户的货物将安排发运。",
  "حمل‌ونقل":
    "در حال بارگیری یعنی هنوز مشتری وجه خود را پرداخت نکرده و پس از تسویهٔ مالی، محمولهٔ ایشان حمل می‌گردد.",
};

const sectionClass =
  "rounded-2xl border border-[#E2E7EC] bg-white p-6 dark:border-border dark:bg-card " +
  "[&_table]:w-full [&_table]:border-separate [&_table]:border-spacing-0 [&_table]:text-center " +
  "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-[#F4F6F8] dark:[&_thead]:bg-secondary " +
  "[&_th]:h-11 [&_th]:px-3 [&_th]:text-center [&_th]:align-middle [&_th]:text-xs [&_th]:font-medium [&_th]:text-[#66717E] " +
  "[&_td]:h-12 [&_td]:px-3 [&_td]:text-center [&_td]:align-middle [&_tbody_tr:nth-child(even)]:bg-[#FAFBFC] dark:[&_tbody_tr:nth-child(even)]:bg-secondary/15 " +
  "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[#F1F5F8] dark:[&_tbody_tr:hover]:bg-secondary/30 " +
  "[&_.recharts-cartesian-grid-horizontal_line]:stroke-[#DDE4EA] [&_.recharts-cartesian-grid-horizontal_line]:stroke-opacity-50 " +
  "[&_.recharts-cartesian-grid-vertical_line]:stroke-opacity-0";

const readNumber = (value: string) => {
  const normalized = value
    .replace(/[٬,]/g, "")
    .replace(/[٪%]/g, "")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const findValueElement = (labelElement?: HTMLParagraphElement) => {
  if (!labelElement) return null;
  const container = labelElement.parentElement;
  if (!container) return null;

  const candidates = Array.from(container.querySelectorAll<HTMLParagraphElement>("p"));
  return candidates.find((item) => item !== labelElement && /\d/.test(item.textContent ?? "")) ?? null;
};

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

    const updateSummary = () => {
      const section = sectionRef.current;
      if (!section) return;

      const labels = Array.from(section.querySelectorAll<HTMLParagraphElement>("p"));
      const plannedLabel = labels.find((item) => /Total\s*planned|计划总量|مجموع برنامه/i.test(item.textContent ?? ""));
      const actualLabel = labels.find((item) => /Total\s*actual|实际总量|مجموع واقعی/i.test(item.textContent ?? ""));
      const achievementLabel = labels.find((item) => /Achievement|完成率|درصد تحقق/i.test(item.textContent ?? ""));

      const plannedValue = findValueElement(plannedLabel);
      const actualValue = findValueElement(actualLabel);
      const achievementValue = findValueElement(achievementLabel);

      const planned = readNumber(plannedValue?.textContent ?? "");
      const actual = Number(report.totals.galvanized) || 0;
      const achievement = planned > 0 ? (actual / planned) * 100 : 0;
      const unit = title === "计划与实际产量" ? "吨" : title === "مقایسه برنامه با تولید واقعی" ? "تن" : "ton";

      if (actualValue) {
        actualValue.textContent = `${actual.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${unit}`;
      }

      if (achievementValue) {
        achievementValue.textContent = `${achievement.toLocaleString("en-US", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} %`;
      }
    };

    const frame = window.requestAnimationFrame(updateSummary);
    const timer = window.setTimeout(updateSummary, 250);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [title]);

  return (
    <section ref={sectionRef} className={sectionClass}>
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#17365D] dark:text-foreground">{title}</h2>
          {subtitle && <p className="mt-1 max-w-[70ch] text-sm leading-6 text-[#66717E] dark:text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
      {transportNotes[title] ? (
        <p className="mt-4 rounded-xl bg-[#F4F6F8] px-4 py-3 text-xs leading-6 text-[#66717E] dark:bg-secondary/20 dark:text-muted-foreground">
          {transportNotes[title]}
        </p>
      ) : null}
    </section>
  );
}
