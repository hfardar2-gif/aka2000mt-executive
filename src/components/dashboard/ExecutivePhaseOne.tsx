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
const clampPct = (value: number) => Math.max(0, Math.min(value, 100));

const planSectionTitles: Record<Lang, string> = {
  en: "Plan vs Actual Production",
  zh: "计划与实际产量",
  fa: "مقایسه برنامه با تولید واقعی",
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
  const unshippedSales = Number(report.transport.underLoading) || 0;
  const totalSold = totals.sold + unshippedSales;
  const finishedInventory = Math.max(totals.galvanized - totalSold, 0);
  const salesConversion = totals.galvanized > 0 ? (totalSold / totals.galvanized) * 100 : 0;
  const productionProgress = totals.inputCoilsTon > 0 ? (totals.galvanized / totals.inputCoilsTon) * 100 : 0;
  const remainingInput = Math.max(totals.inputCoilsTon - totals.galvanized, 0);
  const unsoldShare = totals.galvanized > 0 ? (finishedInventory / totals.galvanized) * 100 : 0;

  useEffect(() => {
    const header = Array.from(document.querySelectorAll("header")).find((item) => item.querySelector("h1"));
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
      eyebrow: "Project executive summary",
      progress: "Production progress",
      progressHint: "Galvanized output versus project input",
      sales: "Sales conversion",
      salesHint: "Total sold tonnage versus galvanized output",
      inventory: "Finished-goods inventory",
      inventoryHint: "Produced but not yet sold",
      shipment: "Ready for shipment",
      shipmentHint: "Subject to commercial and loading status",
      issue: "Key management issue",
      issueHeadline: `${number(finishedInventory)} tons remain unsold`,
      issueText: `${pct(unsoldShare)} of galvanized output remains outside total sales after including sold-but-unshipped tonnage.`,
      flow: "Project flow",
      flowSub: "Material conversion from imported hot-rolled coil to total sales",
      input: "HRC input",
      pickling: "Pickling",
      rolling: "Rolling",
      galvanized: "Galvanized",
      unshipped: "Not shipped",
      sold: "Total sold",
      soldLegend: "Total sold: shipped and unshipped sold tonnage",
      unshippedLegend: "Not shipped: sold tonnage awaiting shipment",
      responsibility: "Execution responsibility",
      combined: "AKA and Tehran Office — supply, project ownership, sales, payment follow-up and shipment coordination",
      factory: "Foolad Dashtestan — pickling, rolling and galvanizing",
      balance: "Production, sales and inventory balance",
      balanceInsight: `${pct(unsoldShare)} of galvanized output remains unsold`,
      soldPart: "Total sold",
      stockPart: "Finished inventory",
      remaining: "Remaining conversion",
      analysis: "Management analysis",
      overall: "Overall project status",
      overallText: `The project has converted ${pct(productionProgress)} of imported input into galvanized output.`,
      production: "Production status",
      productionText: `${number(totals.galvanized)} tons of galvanized product have been produced from ${number(totals.inputCoilsTon)} tons of input.`,
      salesStatus: "Sales status",
      salesText: `${number(totalSold)} tons have been sold, including ${number(unshippedSales)} tons not yet shipped, equal to ${pct(salesConversion)} of galvanized output.`,
      inventoryStatus: "Inventory status",
      inventoryText: `${number(finishedInventory)} tons remain as finished-goods inventory after including unshipped sold tonnage in total sales.`,
      action: "Required management action",
      actionText: "Prioritize shipment of sold-but-unshipped tonnage and continued sales conversion to reduce finished-goods inventory and protect production continuity.",
      ton: "t",
    },
    zh: {
      eyebrow: "项目管理摘要",
      progress: "生产进度",
      progressHint: "镀锌产量占项目投入量",
      sales: "销售转化率",
      salesHint: "总销售量占镀锌产量",
      inventory: "成品库存",
      inventoryHint: "已生产但尚未销售",
      shipment: "待发运",
      shipmentHint: "取决于商务及装运状态",
      issue: "核心管理问题",
      issueHeadline: `${number(finishedInventory)}吨成品尚未销售`,
      issueText: `计入已售未发运吨位后，镀锌产量的${pct(unsoldShare)}仍未销售。`,
      flow: "项目流程",
      flowSub: "从进口热轧卷到总销售量的材料转化",
      input: "热轧卷投入",
      pickling: "酸洗",
      rolling: "轧制",
      galvanized: "镀锌",
      unshipped: "未发运",
      sold: "销售总量",
      soldLegend: "销售总量：已发运及未发运的已售吨位",
      unshippedLegend: "未发运：已售但尚待发运的吨位",
      responsibility: "执行责任",
      combined: "AKA及德黑兰办公室——供应、项目管理、销售、收款跟进及发运协调",
      factory: "Foolad Dashtestan——酸洗、轧制及镀锌",
      balance: "生产、销售及库存平衡",
      balanceInsight: `镀锌产量的${pct(unsoldShare)}仍未销售`,
      soldPart: "销售总量",
      stockPart: "成品库存",
      remaining: "待转化投入",
      analysis: "管理分析",
      overall: "项目总体状态",
      overallText: `项目已将进口投入的${pct(productionProgress)}转化为镀锌成品。`,
      production: "生产状态",
      productionText: `累计投入${number(totals.inputCoilsTon)}吨，已生产镀锌产品${number(totals.galvanized)}吨。`,
      salesStatus: "销售状态",
      salesText: `已销售${number(totalSold)}吨，其中${number(unshippedSales)}吨尚未发运，占镀锌产量的${pct(salesConversion)}。`,
      inventoryStatus: "库存状态",
      inventoryText: `计入已售未发运吨位后，目前仍有${number(finishedInventory)}吨成品库存。`,
      action: "所需管理行动",
      actionText: "优先发运已售未发运吨位，并继续推进销售转化，以降低成品库存并保障生产连续性。",
      ton: "吨",
    },
    fa: {
      eyebrow: "خلاصهٔ مدیریتی پروژه",
      progress: "پیشرفت تولید",
      progressHint: "نسبت محصول گالوانیزه به ورودی پروژه",
      sales: "نرخ تبدیل تولید به فروش",
      salesHint: "کل تناژ فروش‌رفته نسبت به محصول گالوانیزه",
      inventory: "موجودی محصول نهایی",
      inventoryHint: "تولیدشده و هنوز فروش‌نرفته",
      shipment: "آمادهٔ ارسال",
      shipmentHint: "وابسته به وضعیت تجاری و بارگیری",
      issue: "مسئلهٔ اصلی مدیریتی",
      issueHeadline: `${number(finishedInventory)} تن محصول نهایی هنوز فروش نرفته است`,
      issueText: `با احتساب تناژ فروش‌رفتهٔ حمل‌نشده، ${pct(unsoldShare)} از محصول گالوانیزه همچنان فروش نرفته است.`,
      flow: "جریان پروژه",
      flowSub: "تبدیل ورق گرم وارداتی تا کل فروش محصول",
      input: "ورق گرم ورودی",
      pickling: "اسیدشویی",
      rolling: "نورد",
      galvanized: "گالوانیزه",
      unshipped: "حمل‌نشده",
      sold: "کل فروش‌رفته",
      soldLegend: "کل فروش‌رفته: مجموع تناژ حمل‌شده و حمل‌نشده",
      unshippedLegend: "حمل‌نشده: تناژ فروش‌رفته‌ای که هنوز ارسال نشده است",
      responsibility: "مسئولیت اجرا",
      combined: "آکا و دفتر تهران — تأمین، راهبری پروژه، فروش، پیگیری وصول و هماهنگی ارسال",
      factory: "فولاد دشتستان — اسیدشویی، نورد و گالوانیزه",
      balance: "توازن تولید، فروش و موجودی",
      balanceInsight: `${pct(unsoldShare)} از تولید گالوانیزه هنوز فروش نرفته است`,
      soldPart: "کل فروش‌رفته",
      stockPart: "موجودی محصول نهایی",
      remaining: "ورودی باقی‌مانده برای تبدیل",
      analysis: "تحلیل مدیریتی",
      overall: "وضعیت کلی پروژه",
      overallText: `تاکنون ${pct(productionProgress)} از ورودی پروژه به محصول گالوانیزه تبدیل شده است.`,
      production: "وضعیت تولید",
      productionText: `از ${number(totals.inputCoilsTon)} تن ورودی، ${number(totals.galvanized)} تن محصول گالوانیزه تولید شده است.`,
      salesStatus: "وضعیت فروش",
      salesText: `${number(totalSold)} تن فروش ثبت شده که ${number(unshippedSales)} تن آن حمل نشده و مجموعاً معادل ${pct(salesConversion)} از تولید گالوانیزه است.`,
      inventoryStatus: "وضعیت موجودی",
      inventoryText: `با احتساب تناژ فروش‌رفتهٔ حمل‌نشده، ${number(finishedInventory)} تن محصول نهایی در موجودی باقی مانده است.`,
      action: "اقدام مدیریتی موردنیاز",
      actionText: "ارسال تناژ فروش‌رفتهٔ حمل‌نشده و ادامهٔ فروش در اولویت قرار گیرد تا موجودی نهایی کاهش یابد و تداوم تولید حفظ شود.",
      ton: "تن",
    },
  }[lang];

  const kpis = [
    { label: text.progress, value: pct(productionProgress), hint: text.progressHint, tone: "text-[#245A8D]", progress: productionProgress, bar: "bg-[#245A8D]" },
    { label: text.sales, value: pct(salesConversion), hint: text.salesHint, tone: "text-[#2E7D5B]", progress: salesConversion, bar: "bg-[#2E7D5B]" },
    { label: text.inventory, value: number(finishedInventory), hint: text.inventoryHint, tone: "text-[#C98316]", unit: text.ton, progress: unsoldShare, bar: "bg-[#C98316]" },
    { label: text.shipment, value: number(report.transport.readyWarehouse), hint: text.shipmentHint, tone: "text-[#B5443C]", unit: text.ton, progress: totals.galvanized > 0 ? (Number(report.transport.readyWarehouse) / totals.galvanized) * 100 : 0, bar: "bg-[#B5443C]" },
  ];

  const productionFlow = [
    { label: text.input, value: totals.inputCoilsTon },
    { label: text.pickling, value: totals.pickling },
    { label: text.rolling, value: totals.rolling },
    { label: text.galvanized, value: totals.galvanized },
  ];

  const analysis = [
    [text.overall, text.overallText],
    [text.production, text.productionText],
    [text.salesStatus, text.salesText],
    [text.inventoryStatus, text.inventoryText],
    [text.action, text.actionText],
  ];

  const producedBase = Math.max(totals.galvanized, 1);
  const soldShare = Math.min((totalSold / producedBase) * 100, 100);
  const inventoryShare = Math.min((finishedInventory / producedBase) * 100, 100);
  const remainingShare = Math.min((remainingInput / Math.max(totals.inputCoilsTon, 1)) * 100, 100);

  return (
    <div className="order-first col-span-full space-y-8" dir={lang === "fa" ? "rtl" : "ltr"}>
      {logoTarget
        ? createPortal(
            <img src="/aka-logo.svg" alt="AKA" className="h-14 w-auto rounded-lg bg-white px-2 py-1 print:h-12" />,
            logoTarget,
          )
        : null}

      <section className="overflow-hidden rounded-2xl border border-[#E2E7EC] bg-white dark:border-border dark:bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8EDF2] px-6 py-4 dark:border-border">
          <p className="text-sm font-semibold text-[#17365D] dark:text-primary">{text.eyebrow}</p>
          <span className="rounded-full bg-[#F4F6F8] px-3 py-1.5 text-xs text-[#66717E] dark:bg-secondary/30 dark:text-muted-foreground">{report.reportDate}</span>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <article key={item.label} className="min-h-[146px] rounded-xl border border-[#E2E7EC] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(23,54,93,0.08)] dark:border-border dark:bg-card">
              <p className="text-[13px] font-medium text-[#66717E] dark:text-muted-foreground">{item.label}</p>
              <p className={`mt-4 text-[40px] font-semibold leading-none tabular-nums ${item.tone}`}>
                {item.value}{item.unit ? <span className="ms-2 text-sm font-medium text-[#66717E]">{item.unit}</span> : null}
              </p>
              <p className="mt-3 text-xs leading-5 text-[#66717E] dark:text-muted-foreground">{item.hint}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EEF2F5] dark:bg-secondary/40">
                <div className={`h-full rounded-full transition-[width] duration-700 ${item.bar}`} style={{ width: `${clampPct(item.progress)}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#F0D7A9] bg-[#FFF9ED] px-6 py-5 dark:border-amber-500/30 dark:bg-amber-500/10">
        <p className="text-xs font-semibold text-[#B5443C]">{text.issue}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-[#17212B] dark:text-foreground">{text.issueHeadline}</p>
        <p className="mt-2 max-w-[70ch] text-sm leading-7 text-[#66717E] dark:text-muted-foreground">{text.issueText}</p>
      </section>

      <section className="rounded-2xl border border-[#E2E7EC] bg-white p-6 dark:border-border dark:bg-card">
        <h2 className="text-xl font-semibold text-[#17365D] dark:text-foreground">{text.flow}</h2>
        <p className="mt-1 text-sm text-[#66717E] dark:text-muted-foreground">{text.flowSub}</p>

        <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-stretch">
          {productionFlow.map((item, index) => {
            const previous = index === 0 ? item.value : productionFlow[index - 1].value;
            const conversion = previous > 0 ? (item.value / previous) * 100 : 0;
            return (
              <div key={item.label} className="contents">
                <div className="flex-1 rounded-xl border border-[#E2E7EC] bg-[#F7F9FB] p-4 text-center dark:border-border dark:bg-secondary/20">
                  <p className="text-xs font-medium text-[#66717E] dark:text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-[#245A8D]">{number(item.value)}</p>
                  <p className="mt-1 text-xs text-[#66717E]">{text.ton}</p>
                  {index > 0 ? <span className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#17365D] dark:bg-card dark:text-primary">{pct(conversion)}</span> : null}
                </div>
                {index < productionFlow.length - 1 ? <div className="flex items-center justify-center text-xl text-[#A7B3BF] xl:px-1">→</div> : null}
              </div>
            );
          })}

          <div className="flex items-center justify-center text-xl text-[#A7B3BF] xl:px-1">→</div>
          <div className="grid flex-[1.5] gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#BFDCCF] bg-[#F1F8F4] p-4 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <p className="text-xs font-medium text-[#2E7D5B]">{text.sold}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[#2E7D5B]">{number(totalSold)}</p>
              <p className="mt-1 text-xs text-[#66717E]">{text.ton}</p>
              <span className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2E7D5B] dark:bg-card">{pct(salesConversion)}</span>
            </div>
            <div className="rounded-xl border border-[#F0D7A9] bg-[#FFF9ED] p-4 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="text-xs font-medium text-[#C98316]">{text.unshipped}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[#C98316]">{number(unshippedSales)}</p>
              <p className="mt-1 text-xs text-[#66717E]">{text.ton}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-xs leading-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F1F8F4] px-3 py-1.5 text-[#2E7D5B]"><span className="h-2 w-2 rounded-full bg-[#2E7D5B]" />{text.soldLegend}</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF9ED] px-3 py-1.5 text-[#A66A0B]"><span className="h-2 w-2 rounded-full bg-[#C98316]" />{text.unshippedLegend}</span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-2xl border border-[#E2E7EC] bg-white p-6 dark:border-border dark:bg-card">
          <p className="text-xs font-medium text-[#66717E] dark:text-muted-foreground">{text.balance}</p>
          <h2 className="mt-1 text-xl font-semibold text-[#17365D] dark:text-foreground">{text.balanceInsight}</h2>
          <div className="mt-6 space-y-5">
            <div><div className="mb-2 flex justify-between text-xs"><span>{text.soldPart}</span><strong>{number(totalSold)} {text.ton}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-[#EAF5EF]"><div className="h-full rounded-full bg-[#2E7D5B] transition-[width] duration-700" style={{ width: `${soldShare}%` }} /></div></div>
            <div><div className="mb-2 flex justify-between text-xs"><span>{text.stockPart}</span><strong>{number(finishedInventory)} {text.ton}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-[#FFF5DF]"><div className="h-full rounded-full bg-[#C98316] transition-[width] duration-700" style={{ width: `${inventoryShare}%` }} /></div></div>
            <div><div className="mb-2 flex justify-between text-xs"><span>{text.remaining}</span><strong>{number(remainingInput)} {text.ton}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-[#E8EEF5]"><div className="h-full rounded-full bg-[#245A8D] transition-[width] duration-700" style={{ width: `${remainingShare}%` }} /></div></div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E2E7EC] bg-white p-6 dark:border-border dark:bg-card">
          <h2 className="text-xl font-semibold text-[#17365D] dark:text-foreground">{text.responsibility}</h2>
          <div className="mt-5 space-y-3 text-sm leading-6">
            {[text.combined, text.factory].map((item, index) => (
              <div key={item} className="flex gap-3 rounded-xl bg-[#F7F9FB] p-4 dark:bg-secondary/20">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#17365D] text-xs font-semibold text-white">{index + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#E2E7EC] bg-white p-6 dark:border-border dark:bg-card">
        <h2 className="text-xl font-semibold text-[#17365D] dark:text-foreground">{text.analysis}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analysis.slice(0, 4).map(([title, body]) => (
            <article key={title} className="rounded-xl bg-[#F7F9FB] p-4 dark:bg-secondary/20">
              <h3 className="text-sm font-semibold text-[#17365D] dark:text-foreground">{title}</h3>
              <p className="mt-2 text-xs leading-6 text-[#66717E] dark:text-muted-foreground">{body}</p>
            </article>
          ))}
          <article className="md:col-span-2 xl:col-span-4 rounded-xl border border-[#F0D7A9] bg-[#FFF9ED] p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <h3 className="text-sm font-semibold text-[#A66A0B]">{analysis[4][0]}</h3>
            <p className="mt-2 max-w-[70ch] text-sm leading-7 text-[#66717E] dark:text-muted-foreground">{analysis[4][1]}</p>
          </article>
        </div>
      </section>
    </div>
  );
}
