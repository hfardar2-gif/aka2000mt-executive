type ExecutiveOverviewProps = {
  lang: "en" | "zh" | "fa";
  totalPlanned: number;
  totalActual: number;
  galvanized: number;
  sold: number;
  readyToShip: number;
  tonLabel: string;
};

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—";

export function ExecutiveOverview({
  lang,
  totalPlanned,
  totalActual,
  galvanized,
  sold,
  readyToShip,
  tonLabel,
}: ExecutiveOverviewProps) {
  const achievement = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
  const finishedInventory = Math.max(galvanized - sold, 0);

  const copy = {
    en: {
      title: "Executive Project Snapshot",
      subtitle: "A concise view of production completion, commercialization and shipment readiness.",
      achievement: "Production plan completion",
      galvanized: "Galvanized output",
      sold: "Completed sales",
      ready: "Ready to ship",
      issue: "Key management issue",
      issueText:
        "Production is ahead of completed sales. Finished-goods inventory is consuming warehouse capacity and may constrain the remaining production plan.",
      inventory: "Estimated finished-goods inventory",
    },
    zh: {
      title: "项目管理概览",
      subtitle: "集中展示生产完成率、销售转化和发运准备情况。",
      achievement: "生产计划完成率",
      galvanized: "镀锌成品产量",
      sold: "已完成销售",
      ready: "待发运",
      issue: "核心管理问题",
      issueText: "生产进度明显快于已完成销售，成品库存正在占用仓储容量，并可能影响剩余生产计划。",
      inventory: "预计成品库存",
    },
    fa: {
      title: "نمای کلی مدیریتی پروژه",
      subtitle: "خلاصه‌ای متمرکز از تحقق تولید، تبدیل تولید به فروش و آمادگی ارسال.",
      achievement: "تحقق برنامهٔ تولید",
      galvanized: "محصول گالوانیزه",
      sold: "فروش قطعی",
      ready: "آمادهٔ ارسال",
      issue: "مسئلهٔ اصلی مدیریتی",
      issueText:
        "تولید از فروش قطعی جلوتر است و موجودی محصول نهایی با اشغال ظرفیت انبار، ممکن است ادامهٔ برنامهٔ تولید را محدود کند.",
      inventory: "موجودی برآوردی محصول نهایی",
    },
  }[lang];

  const cards = [
    { label: copy.achievement, value: `${achievement.toFixed(1)}%`, detail: `${formatNumber(totalActual)} / ${formatNumber(totalPlanned)} ${tonLabel}` },
    { label: copy.galvanized, value: formatNumber(galvanized), detail: tonLabel },
    { label: copy.sold, value: formatNumber(sold), detail: tonLabel },
    { label: copy.ready, value: formatNumber(readyToShip), detail: tonLabel },
  ];

  return (
    <section className="space-y-4" aria-labelledby="executive-overview-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="executive-overview-title" className="text-xl font-semibold tracking-tight md:text-2xl">
            {copy.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
        <div className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          {copy.inventory}: <strong className="text-foreground">{formatNumber(finishedInventory)} {tonLabel}</strong>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <article
            key={card.label}
            className={`rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] ${
              index === 3 ? "border-amber-500/30" : "border-border"
            }`}
          >
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            <p className={`mt-3 text-3xl font-semibold tabular-nums ${index === 2 ? "text-emerald-600" : index === 3 ? "text-amber-600" : "text-primary"}`}>
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">{copy.issue}</p>
        <p className="mt-2 text-sm leading-7 text-foreground">{copy.issueText}</p>
      </div>
    </section>
  );
}
