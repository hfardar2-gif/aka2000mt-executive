import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import report from "@/data/report.json";

type Lang = "en" | "zh" | "fa";

type ExecutivePhaseOneProps = {
  lang: Lang;
};

const number = (value: number, digits = 0) =>
  Number.isFinite(value)
    ? value.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—";

const pct = (value: number) => `${number(value, 1)}%`;

const planSectionTitles: Record<Lang, string> = {
  en: "Plan vs Actual Production",
  zh: "计划与实际产量",
  fa: "برنامه در برابر تولید واقعی",
};

const actualLabels: Record<Lang, string> = {
  en: "Total Actual",
  zh: "实际总量",
  fa: "مجموع واقعی",
};

const achievementLabels: Record<Lang, string> = {
  en: "Achievement",
  zh: "完成率",
  fa: "درصد تحقق",
};

export function ExecutivePhaseOne({ lang }: ExecutivePhaseOneProps) {
  const { totals } = report;
  const [logoTarget, setLogoTarget] = useState<Element | null>(null);
  const finishedInventory = Math.max(totals.galvanized - totals.sold, 0);
  const salesConversion = totals.galvanized > 0 ? (totals.sold / totals.galvanized) * 100 : 0;
  const productionProgress = totals.inputCoilsTon > 0 ? (totals.galvanized / totals.inputCoilsTon) * 100 : 0;
  const remainingInput = Math.max(totals.inputCoilsTon - totals.galvanized, 0);
  const reservedSales = Number(report.transport.underLoading) || 0;

  useEffect(() => {
    const header = Array.from(document.querySelectorAll("header")).find((item) =>
      item.querySelector("h1"),
    );
    const metadata = header?.querySelector(".flex.items-center.gap-6.text-sm");
    if (metadata) setLogoTarget(metadata);
  }, []);

  useEffect(() => {
    const updatePlanSummary = () => {
      const heading = Array.from(document.querySelectorAll("h2")).find(
        (item) => item.textContent?.trim() === planSectionTitles[lang],
      );
      const section = heading?.closest("section");
      if (!section) return;

      const plannedCard = Array.from(section.querySelectorAll("p")).find((item) =>
        /Total Planned|计划总量|مجموع برنامه/.test(item.textContent ?? ""),
      )?.parentElement;
      const plannedText = plannedCard?.querySelector("p:nth-child(2)")?.textContent ?? "";
      const planned = Number(plannedText.replace(/[^\d.-]/g, "")) || 0;

      const actualLabel = Array.from(section.querySelectorAll("p")).find(
        (item) => item.textContent?.trim() === actualLabels[lang],
      );
      const actualValue = actualLabel?.parentElement?.querySelector("p:nth-child(2)");
      if (actualValue) {
        const unit = lang === "zh" ? "吨" : lang === "fa" ? "تن" : "ton";
        actualValue.textContent = `${number(totals.galvanized)} ${unit}`;
      }

      const achievementLabel = Array.from(section.querySelectorAll("p")).find(
        (item) => item.textContent?.trim() === achievementLabels[lang],
      );
      const achievementValue = achievementLabel?.parentElement?.querySelector("p:nth-child(2)");
      if (achievementValue) {
        achievementValue.textContent = pct(planned > 0 ? (totals.galvanized / planned) * 100 : 0);
      }
    };

    const frame = window.requestAnimationFrame(updatePlanSummary);
    return () => window.cancelAnimationFrame(frame);
  }, [lang, totals.galvanized]);

  const text = {
    en: {
      eyebrow: "PROJECT EXECUTIVE SUMMARY",
      progress: "Production progress",
      progressHint: "Galvanized output versus project input",
      sales: "Sales conversion",
      salesHint: "Completed sales versus galvanized output",
      inventory: "Finished-goods inventory",
      inventoryHint: "Produced but not yet sold",
      shipment: "Ready for shipment",
      shipmentHint: "Subject to commercial and loading status",
      issue: "Key management issue",
      issueText: `${number(finishedInventory)} tons of finished galvanized product remain unsold. Production is ahead of commercialization, increasing pressure on warehouse capacity.`,
      flow: "Project flow",
      flowSub: "Material conversion from imported hot-rolled coil to completed sales",
      input: "HRC input",
      pickling: "Pickling",
      rolling: "Rolling",
      galvanized: "Galvanized",
      reserved: "Sales reservation",
      sold: "Completed sales",
      flowNote:
        "Completed sales means the customer's payment has been received in full. A reservation means the customer has not yet paid; after settlement, the shipment weight is transferred to completed-sales status.",
      responsibility: "Execution responsibility",
      combined: "AKA and Tehran Office — supply, project ownership, sales, payment follow-up and shipment coordination",
      factory: "Foolad Dashtestan — pickling, rolling and galvanizing",
      balance: "Production, sales and inventory balance",
      soldPart: "Completed sales",
      stockPart: "Finished inventory",
      remaining: "Remaining conversion",
      analysis: "Management analysis",
      overall: "Overall project status",
      overallText: `The project has converted ${pct(productionProgress)} of imported input into galvanized output.`,
      production: "Production status",
      productionText: `${number(totals.galvanized)} tons of galvanized product have been produced from ${number(totals.inputCoilsTon)} tons of input.`,
      salesStatus: "Sales status",
      salesText: `${number(totals.sold)} tons have been sold, equal to ${pct(salesConversion)} of galvanized output.`,
      inventoryStatus: "Inventory status",
      inventoryText: `${number(finishedInventory)} tons remain as finished-goods inventory and require commercialization or shipment.`,
      action: "Required management action",
      actionText: "Prioritize collection, sales conversion and shipment release to reduce finished-goods inventory and protect production continuity.",
      ton: "t",
    },
    zh: {
      eyebrow: "项目管理摘要",
      progress: "生产进度",
      progressHint: "镀锌产量占项目投入量",
      sales: "销售转化率",
      salesHint: "已完成销售占镀锌产量",
      inventory: "成品库存",
      inventoryHint: "已生产但尚未销售",
      shipment: "待发运",
      shipmentHint: "取决于商务及装运状态",
      issue: "核心管理问题",
      issueText: `目前仍有${number(finishedInventory)}吨镀锌成品尚未销售。生产进度快于商业转化，仓储压力正在上升。`,
      flow: "项目流程",
      flowSub: "从进口热轧卷到完成销售的材料转化",
      input: "热轧卷投入",
      pickling: "酸洗",
      rolling: "轧制",
      galvanized: "镀锌",
      reserved: "销售预留",
      sold: "已完成销售",
      flowNote:
        "已完成销售是指已收到客户全部款项；销售预留表示客户尚未付款。完成结算后，该客户的装运重量将转为已完成销售状态。",
      responsibility: "执行责任",
      combined: "AKA及德黑兰办公室——供应、项目管理、销售、收款跟进及发运协调",
      factory: "Foolad Dashtestan——酸洗、轧制及镀锌",
      balance: "生产、销售及库存平衡",
      soldPart: "已完成销售",
      stockPart: "成品库存",
      remaining: "待转化投入",
      analysis: "管理分析",
      overall: "项目总体状态",
      overallText: `项目已将进口投入的${pct(productionProgress)}转化为镀锌成品。`,
      production: "生产状态",
      productionText: `累计投入${number(totals.inputCoilsTon)}吨，已生产镀锌产品${number(totals.galvanized)}吨。`,
      salesStatus: "销售状态",
      salesText: `已销售${number(totals.sold)}吨，占镀锌产量的${pct(salesConversion)}。`,
      inventoryStatus: "库存状态",
      inventoryText: `目前仍有${number(finishedInventory)}吨成品库存，需要加快销售或发运。`,
      action: "所需管理行动",
      actionText: "优先推进回款、销售转化及发运放行，以降低成品库存并保障生产连续性。",
      ton: "吨",
    },
    fa: {
      eyebrow: "خلاصهٔ مدیریتی پروژه",
      progress: "پیشرفت تولید",
      progressHint: "نسبت محصول گالوانیزه به ورودی پروژه",
      sales: "نرخ تبدیل تولید به فروش",
      salesHint: "فروش قطعی نسبت به محصول گالوانیزه",
      inventory: "موجودی محصول نهایی",
      inventoryHint: "تولیدشده و هنوز فروش‌نرفته",
      shipment: "آمادهٔ ارسال",
      shipmentHint: "وابسته به وضعیت تجاری و بارگیری",
      issue: "مسئلهٔ اصلی مدیریتی",
      issueText: `${number(finishedInventory)} تن محصول گالوانیزه هنوز به فروش نرسیده است. تولید از تجاری‌سازی جلوتر است و فشار بر ظرفیت انبار افزایش یافته است.`,
      flow: "جریان پروژه",
      flowSub: "تبدیل ورق گرم وارداتی تا فروش قطعی محصول",
      input: "ورق گرم ورودی",
      pickling: "اسیدشویی",
      rolling: "نورد",
      galvanized: "گالوانیزه",
      reserved: "رزرو فروش",
      sold: "فروش قطعی",
      flowNote:
        "فروش قطعی به معنای دریافت وجه کامل از مشتری است و رزرو یعنی هنوز مشتری وجه خود را پرداخت نکرده و پس از تسویه، وزن محمولهٔ ایشان به وضعیت قطعی تبدیل می‌شود.",
      responsibility: "مسئولیت اجرا",
      combined: "آکا و دفتر تهران — تأمین، راهبری پروژه، فروش، پیگیری وصول و هماهنگی ارسال",
      factory: "فولاد دشتستان — اسیدشویی، نورد و گالوانیزه",
      balance: "توازن تولید، فروش و موجودی",
      soldPart: "فروش قطعی",
      stockPart: "موجودی محصول نهایی",
      remaining: "ورودی باقی‌مانده برای تبدیل",
      analysis: "تحلیل مدیریتی",
      overall: "وضعیت کلی پروژه",
      overallText: `تاکنون ${pct(productionProgress)} از ورودی پروژه به محصول گالوانیزه تبدیل شده است.`,
      production: "وضعیت تولید",
      productionText: `از ${number(totals.inputCoilsTon)} تن ورودی، ${number(totals.galvanized)} تن محصول گالوانیزه تولید شده است.`,
      salesStatus: "وضعیت فروش",
      salesText: `${number(totals.sold)} تن فروش قطعی ثبت شده که معادل ${pct(salesConversion)} از تولید گالوانیزه است.`,
      inventoryStatus: "وضعیت موجودی",
      inventoryText: `${number(finishedInventory)} تن محصول نهایی در موجودی باقی مانده و باید به فروش یا ارسال تبدیل شود.`,
      action: "اقدام مدیریتی موردنیاز",
      actionText: "وصول مطالبات، تبدیل رزروها به فروش قطعی و آزادسازی ارسال در اولویت قرار گیرد تا موجودی نهایی کاهش یابد و تداوم تولید حفظ شود.",
      ton: "تن",
    },
  }[lang];

  const kpis = [
    { label: text.progress, value: pct(productionProgress), hint: text.progressHint, tone: "text-[#245A8D]" },
    { label: text.sales, value: pct(salesConversion), hint: text.salesHint, tone: "text-[#2E7D5B]" },
    { label: text.inventory, value: number(finishedInventory), hint: text.inventoryHint, tone: "text-[#C98316]", unit: text.ton },
    { label: text.shipment, value: number(report.transport.readyWarehouse), hint: text.shipmentHint, tone: "text-[#B5443C]", unit: text.ton },
  ];

  const flow = [
    { label: text.input, value: totals.inputCoilsTon },
    { label: text.pickling, value: totals.pickling },
    { label: text.rolling, value: totals.rolling },
    { label: text.galvanized, value: totals.galvanized },
    { label: text.reserved, value: reservedSales, independent: true },
    { label: text.sold, value: totals.sold },
  ];

  const analysis = [
    [text.overall, text.overallText],
    [text.production, text.productionText],
    [text.salesStatus, text.salesText],
    [text.inventoryStatus, text.inventoryText],
    [text.action, text.actionText],
  ];

  const producedBase = Math.max(totals.galvanized, 1);
  const soldShare = Math.min((totals.sold / producedBase) * 100, 100);
  const inventoryShare = Math.min((finishedInventory / producedBase) * 100, 100);
  const remainingShare = Math.min((remainingInput / Math.max(totals.inputCoilsTon, 1)) * 100, 100);

  return (
    <div className="order-first col-span-full space-y-6" dir={lang === "fa" ? "rtl" : "ltr"}>
      {logoTarget
        ? createPortal(
            <img
              src="/aka-logo.svg"
              alt="AKA"
              className="h-16 w-auto rounded-xl bg-white px-3 py-2 shadow-sm print:h-12"
            />,
            logoTarget,
          )
        : null}

      <section className="overflow-hidden rounded-3xl border border-[#D9E0E8] bg-white shadow-sm dark:border-border dark:bg-card">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-[#D9E0E8] bg-[#F5F7FA] px-6 py-5 dark:border-border dark:bg-secondary/20">
          <p className="text-sm font-bold tracking-[0.12em] text-[#17365D] dark:text-primary">{text.eyebrow}</p>
          <div className="rounded-full border border-[#D9E0E8] bg-white px-4 py-2 text-xs text-[#66717E] dark:border-border dark:bg-card dark:text-muted-foreground">
            {report.reportDate}
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <article key={item.label} className="min-h-[145px] rounded-2xl border border-[#D9E0E8] bg-white p-5 shadow-sm dark:border-border dark:bg-card">
              <p className="text-[13px] font-semibold text-[#66717E] dark:text-muted-foreground">{item.label}</p>
              <p className={`mt-4 text-[38px] font-bold leading-none tabular-nums ${item.tone}`}>
                {item.value}{item.unit ? <span className="ms-2 text-sm font-medium text-[#66717E]">{item.unit}</span> : null}
              </p>
              <p className="mt-3 text-xs leading-5 text-[#66717E] dark:text-muted-foreground">{item.hint}</p>
            </article>
          ))}
        </div>

        <div className="mx-5 mb-5 rounded-2xl border-s-4 border-[#B5443C] bg-[#FFF5DF] px-5 py-4 dark:bg-amber-500/10">
          <p className="text-xs font-bold uppercase tracking-wider text-[#B5443C]">{text.issue}</p>
          <p className="mt-2 text-sm leading-7 text-[#17212B] dark:text-foreground">{text.issueText}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-[#D9E0E8] bg-white p-6 shadow-sm dark:border-border dark:bg-card">
        <h2 className="text-lg font-bold text-[#17365D] dark:text-foreground">{text.flow}</h2>
        <p className="mt-1 text-sm text-[#66717E] dark:text-muted-foreground">{text.flowSub}</p>
        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {flow.map((item, index) => {
            const previous = index === 0 ? item.value : flow[index - 1].value;
            const conversion = previous > 0 ? (item.value / previous) * 100 : 0;
            return (
              <div key={item.label} className={`relative rounded-2xl border p-4 text-center dark:border-border ${item.independent ? "border-[#C98316] bg-[#FFF5DF] dark:bg-amber-500/10" : "border-[#D9E0E8] bg-[#F5F7FA] dark:bg-secondary/20"}`}>
                <p className="text-xs font-semibold text-[#66717E] dark:text-muted-foreground">{item.label}</p>
                <p className={`mt-2 text-2xl font-bold tabular-nums ${item.independent ? "text-[#C98316]" : "text-[#245A8D]"}`}>{number(item.value)}</p>
                <p className="mt-1 text-xs text-[#66717E]">{text.ton}</p>
                {index > 0 && !item.independent && !flow[index - 1].independent ? <span className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#17365D] shadow-sm dark:bg-card dark:text-primary">{pct(conversion)}</span> : null}
              </div>
            );
          })}
        </div>
        <p className="mt-5 rounded-xl border border-[#D9E0E8] bg-[#F5F7FA] px-4 py-3 text-xs leading-6 text-[#66717E] dark:border-border dark:bg-secondary/20 dark:text-muted-foreground">
          {text.flowNote}
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-[#D9E0E8] bg-white p-6 shadow-sm dark:border-border dark:bg-card">
          <h2 className="text-lg font-bold text-[#17365D] dark:text-foreground">{text.balance}</h2>
          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-xs"><span>{text.soldPart}</span><strong>{number(totals.sold)} {text.ton}</strong></div>
              <div className="h-3 overflow-hidden rounded-full bg-[#EAF5EF]"><div className="h-full rounded-full bg-[#2E7D5B]" style={{ width: `${soldShare}%` }} /></div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs"><span>{text.stockPart}</span><strong>{number(finishedInventory)} {text.ton}</strong></div>
              <div className="h-3 overflow-hidden rounded-full bg-[#FFF5DF]"><div className="h-full rounded-full bg-[#C98316]" style={{ width: `${inventoryShare}%` }} /></div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs"><span>{text.remaining}</span><strong>{number(remainingInput)} {text.ton}</strong></div>
              <div className="h-3 overflow-hidden rounded-full bg-[#E8EEF5]"><div className="h-full rounded-full bg-[#245A8D]" style={{ width: `${remainingShare}%` }} /></div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#D9E0E8] bg-white p-6 shadow-sm dark:border-border dark:bg-card">
          <h2 className="text-lg font-bold text-[#17365D] dark:text-foreground">{text.responsibility}</h2>
          <div className="mt-5 space-y-3 text-sm leading-6">
            {[text.combined, text.factory].map((item, index) => (
              <div key={item} className="flex gap-3 rounded-xl bg-[#F5F7FA] p-3 dark:bg-secondary/20">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#17365D] text-xs font-bold text-white">{index + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-[#D9E0E8] bg-white p-6 shadow-sm dark:border-border dark:bg-card">
        <h2 className="text-lg font-bold text-[#17365D] dark:text-foreground">{text.analysis}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {analysis.map(([title, body], index) => (
            <article key={title} className={`rounded-2xl border p-4 ${index === 4 ? "border-[#C98316] bg-[#FFF5DF] dark:bg-amber-500/10" : "border-[#D9E0E8] bg-[#F5F7FA] dark:border-border dark:bg-secondary/20"}`}>
              <h3 className="text-sm font-bold text-[#17365D] dark:text-foreground">{title}</h3>
              <p className="mt-2 text-xs leading-6 text-[#66717E] dark:text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
