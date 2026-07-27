import { useEffect } from "react";

const iconSvg: Record<string, string> = {
  factory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V10l5 3V9l5 3V5h4v16"/><path d="M8 17h.01M12 17h.01M16 17h.01"/></svg>',
  trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/></svg>',
  warehouse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-6 9 6"/><path d="M5 9v11h14V9"/><path d="M8 13h8v7H8z"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v11H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  coil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M20 12h2"/></svg>',
  droplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11z"/></svg>',
  rollers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="4"/><circle cx="16" cy="16" r="4"/><path d="M11 11 13 13"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 5h11l-2 4 2 4H5"/></svg>',
  ratio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/><path d="m6 18 12-12"/></svg>',
};

const rules: Array<{ labels: string[]; icon: keyof typeof iconSvg; color: string }> = [
  { labels: ["Production progress", "پیشرفت تولید", "生产进度"], icon: "factory", color: "#3B82F6" },
  { labels: ["Sales conversion", "نرخ تبدیل تولید به فروش", "销售转化率"], icon: "trend", color: "#10B981" },
  { labels: ["Finished-goods inventory", "موجودی محصول نهایی", "成品库存"], icon: "warehouse", color: "#F59E0B" },
  { labels: ["Ready for shipment", "آمادهٔ ارسال", "待发运"], icon: "truck", color: "#8B5CF6" },
  { labels: ["HRC input", "ورق گرم ورودی", "热轧卷投入"], icon: "coil", color: "#3B82F6" },
  { labels: ["Pickling", "اسیدشویی", "酸洗"], icon: "droplet", color: "#14B8A6" },
  { labels: ["Rolling", "نورد", "轧制"], icon: "rollers", color: "#F97316" },
  { labels: ["Galvanized", "گالوانیزه", "镀锌"], icon: "shield", color: "#3B82F6" },
  { labels: ["Sales reservation", "رزرو فروش", "销售预留"], icon: "clock", color: "#F59E0B" },
  { labels: ["Completed sales", "فروش قطعی", "已完成销售"], icon: "check", color: "#10B981" },
  { labels: ["Overall project status", "وضعیت کلی پروژه", "项目总体状态"], icon: "dashboard", color: "#3B82F6" },
  { labels: ["Production status", "وضعیت تولید", "生产状态"], icon: "factory", color: "#3B82F6" },
  { labels: ["Sales status", "وضعیت فروش", "销售状态"], icon: "trend", color: "#10B981" },
  { labels: ["Inventory status", "وضعیت موجودی", "库存状态"], icon: "warehouse", color: "#F59E0B" },
  { labels: ["Required management action", "اقدام مدیریتی موردنیاز", "所需管理行动"], icon: "flag", color: "#EF4444" },
  { labels: ["Production disposition", "تعیین تکلیف تولید", "产量去向", "Input commercialization", "تجاری‌سازی ورودی پروژه", "投入商业化"], icon: "ratio", color: "#8B5CF6" },
];

export function VisualIconEnhancer() {
  useEffect(() => {
    const decorate = () => {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>("p, h2, h3"));
      for (const rule of rules) {
        const node = candidates.find((item) => rule.labels.includes(item.textContent?.trim() ?? ""));
        if (!node || node.dataset.visualIcon === "true") continue;

        node.dataset.visualIcon = "true";
        node.classList.add("flex", "items-center", "gap-2");
        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        icon.className = "inline-flex h-5 w-5 shrink-0 items-center justify-center";
        icon.style.color = rule.color;
        icon.innerHTML = iconSvg[rule.icon];
        const svg = icon.querySelector("svg");
        if (svg) {
          svg.setAttribute("width", "20");
          svg.setAttribute("height", "20");
        }
        node.prepend(icon);
      }
    };

    const frame = window.requestAnimationFrame(decorate);
    const timeout = window.setTimeout(decorate, 250);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}
