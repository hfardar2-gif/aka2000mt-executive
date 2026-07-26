import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Factory,
  Languages,
  PackageCheck,
  Printer,
  ShoppingCart,
  Truck,
  Warehouse,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import report from "@/data/report.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AKA Hot-Rolled Coil Conversion and Sales Project" },
      {
        name: "description",
        content:
          "Executive overview of material processing, galvanized production, inventory, sales and shipment.",
      },
    ],
  }),
  component: ExecutiveDashboard,
});

type Lang = "zh" | "en" | "fa";
type LocalizedText = string | Partial<Record<Lang, string>>;

const copy = {
  zh: {
    badge: "管理层项目报告",
    title: "AKA热轧卷加工、镀锌及销售项目",
    subtitle: "材料加工、镀锌生产、库存、销售及发运执行概览",
    reportDate: "报告日期",
    projectProgress: "生产计划完成率",
    galvanized: "镀锌产量",
    sold: "已完成销售",
    inventory: "成品库存",
    reserved: "已预留待发",
    input: "热轧卷投入",
    pickling: "酸洗",
    rolling: "轧制",
    available: "可销售库存",
    mainIssue: "核心管理问题",
    issueText: "生产进度明显快于销售进度。成品库存正在占用仓储容量，并影响剩余生产计划的完成。",
    requiredAction: "建议管理行动",
    actionText: "优先完成已预留货物的收款、装运和发运，同时为剩余库存制定客户、数量和日期明确的销售计划。",
    projectFlow: "项目全流程",
    projectFlowSub: "从热轧卷投入到销售及发运的管理视图",
    planActual: "生产计划与实际完成",
    planActualSub: "已完成批次、剩余计划及总体完成率",
    plan: "计划",
    actual: "实际",
    totalPlan: "计划总量",
    totalActual: "实际完成",
    remaining: "剩余生产",
    salesBalance: "生产、销售与库存结构",
    salesBalanceSub: "识别销售转化差距和仓储压力",
    production: "已生产",
    soldLabel: "已售",
    reservedLabel: "已预留",
    freeStock: "可销售",
    commercial: "商务与发运状态",
    paymentPending: "待收款及最终称重",
    warehousePressure: "仓储容量受限",
    productionConstraint: "继续生产受到库存空间限制",
    ownerMap: "执行责任",
    factory: "Foolad Dashtestan：酸洗、轧制、镀锌及装运",
    tehran: "德黑兰办公室：客户、销售、收款及交付协调",
    aka: "AKA：项目监督、进口材料及管理决策",
    ton: "吨",
    status: "需要重点关注",
    print: "打印",
  },
  en: {
    badge: "Executive Project Report",
    title: "AKA Hot-Rolled Coil Conversion and Sales Project",
    subtitle: "Executive overview of processing, galvanized production, inventory, sales and shipment",
    reportDate: "Report date",
    projectProgress: "Production plan completion",
    galvanized: "Galvanized output",
    sold: "Completed sales",
    inventory: "Finished-goods inventory",
    reserved: "Reserved for shipment",
    input: "Hot-rolled coil input",
    pickling: "Pickling",
    rolling: "Rolling",
    available: "Available for sale",
    mainIssue: "Key management issue",
    issueText:
      "Production is materially ahead of completed sales. Finished-goods inventory is consuming warehouse capacity and affecting completion of the remaining production plan.",
    requiredAction: "Required management action",
    actionText:
      "Prioritize collection, loading and dispatch of reserved cargo, then assign the remaining inventory to named customers with quantities and target delivery dates.",
    projectFlow: "End-to-end project flow",
    projectFlowSub: "Management view from imported hot-rolled coil to sales and shipment",
    planActual: "Production plan vs actual",
    planActualSub: "Completed tranches, remaining plan and total achievement",
    plan: "Plan",
    actual: "Actual",
    totalPlan: "Total planned",
    totalActual: "Actual completed",
    remaining: "Remaining production",
    salesBalance: "Production, sales and inventory balance",
    salesBalanceSub: "Sales-conversion gap and warehouse pressure",
    production: "Produced",
    soldLabel: "Sold",
    reservedLabel: "Reserved",
    freeStock: "Available",
    commercial: "Commercial and shipment status",
    paymentPending: "Payment and final weighing pending",
    warehousePressure: "Warehouse capacity constrained",
    productionConstraint: "Further production depends on releasing storage space",
    ownerMap: "Execution responsibility",
    factory: "Foolad Dashtestan: pickling, rolling, galvanizing and loading",
    tehran: "Tehran office: customers, sales, collection and delivery coordination",
    aka: "AKA: project oversight, imported material and management decisions",
    ton: "ton",
    status: "Needs attention",
    print: "Print",
  },
  fa: {
    badge: "گزارش اجرایی پروژه",
    title: "پروژهٔ تبدیل ورق گرم، گالوانیزه‌سازی و فروش آکا",
    subtitle: "نمای مدیریتی فرآوری مواد، تولید گالوانیزه، موجودی، فروش و ارسال",
    reportDate: "تاریخ گزارش",
    projectProgress: "تحقق برنامهٔ تولید",
    galvanized: "تولید گالوانیزه",
    sold: "فروش قطعی",
    inventory: "موجودی محصول نهایی",
    reserved: "رزروشده برای ارسال",
    input: "ورق گرم ورودی",
    pickling: "اسیدشویی",
    rolling: "نورد",
    available: "آمادهٔ فروش",
    mainIssue: "مسئلهٔ اصلی مدیریتی",
    issueText:
      "تولید به‌طور محسوسی از فروش قطعی جلوتر است. موجودی محصول نهایی ظرفیت انبار را اشغال کرده و تکمیل باقی‌ماندهٔ برنامهٔ تولید را تحت تأثیر قرار داده است.",
    requiredAction: "اقدام مدیریتی موردنیاز",
    actionText:
      "وصول وجه، بارگیری و ارسال محموله‌های رزروشده در اولویت قرار گیرد؛ سپس موجودی باقی‌مانده با مقدار و تاریخ تحویل مشخص به مشتریان هدف تخصیص یابد.",
    projectFlow: "جریان کامل پروژه",
    projectFlowSub: "از ورود ورق گرم تا فروش و ارسال",
    planActual: "برنامهٔ تولید در برابر عملکرد",
    planActualSub: "بخش‌های تکمیل‌شده، برنامهٔ باقی‌مانده و درصد تحقق",
    plan: "برنامه",
    actual: "عملکرد",
    totalPlan: "کل برنامه",
    totalActual: "عملکرد واقعی",
    remaining: "تولید باقی‌مانده",
    salesBalance: "توازن تولید، فروش و موجودی",
    salesBalanceSub: "شکاف تبدیل فروش و فشار ظرفیت انبار",
    production: "تولیدشده",
    soldLabel: "فروش‌رفته",
    reservedLabel: "رزروشده",
    freeStock: "آمادهٔ فروش",
    commercial: "وضعیت تجاری و ارسال",
    paymentPending: "در انتظار پرداخت و تأیید وزن نهایی",
    warehousePressure: "ظرفیت انبار محدود شده است",
    productionConstraint: "ادامهٔ تولید به آزادسازی فضای انبار وابسته است",
    ownerMap: "مسئولیت اجرا",
    factory: "فولاد دشتستان: اسیدشویی، نورد، گالوانیزه و بارگیری",
    tehran: "دفتر تهران: مشتری، فروش، وصول و هماهنگی تحویل",
    aka: "آکا: نظارت پروژه، مواد وارداتی و تصمیم‌های مدیریتی",
    ton: "تن",
    status: "نیازمند توجه",
    print: "چاپ",
  },
} as const;

const n0 = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 0 });
const n1 = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });

const localized = (value: unknown, lang: Lang) => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const item = value as LocalizedText;
  return item[lang] ?? item.en ?? item.fa ?? item.zh ?? "";
};

function ExecutiveDashboard() {
  const [lang, setLang] = useState<Lang>("zh");
  const t = copy[lang];
  const rtl = lang === "fa";

  const planRows = report.plan ?? [];
  const totalPlanned = planRows.reduce((sum, row) => sum + Number(row.tons ?? 0), 0);
  const totalActual = planRows.reduce(
    (sum, row) => sum + (/complete/i.test(String(row.status ?? "")) ? Number(row.tons ?? 0) : 0),
    0,
  );
  const planBase = totalPlanned > 0 ? totalPlanned : Math.max(report.totals.inputCoilsTon, 1);
  const achieved = totalActual > 0 ? totalActual : report.totals.galvanized;
  const progress = (achieved / planBase) * 100;
  const inventory = Math.max(report.totals.galvanized - report.totals.sold, 0);
  const reserved = Number((report as any).transport?.reserved ?? 284);
  const readyWarehouse = Number((report as any).transport?.readyWarehouse ?? inventory);
  const available = Math.max(readyWarehouse - reserved, 0);

  const planChart = useMemo(
    () =>
      planRows.map((row) => ({
        date: row.date,
        planned: Number(row.tons ?? 0),
        actual: /complete/i.test(String(row.status ?? "")) ? Number(row.tons ?? 0) : 0,
      })),
    [planRows],
  );

  const stages = [
    { label: t.input, value: report.totals.inputCoilsTon, icon: PackageCheck },
    { label: t.pickling, value: report.totals.pickling, icon: Factory },
    { label: t.rolling, value: report.totals.rolling, icon: Factory },
    { label: t.galvanized, value: report.totals.galvanized, icon: PackageCheck },
    { label: t.sold, value: report.totals.sold, icon: ShoppingCart },
  ];

  const balance = [
    { name: t.production, value: report.totals.galvanized },
    { name: t.soldLabel, value: report.totals.sold },
    { name: t.reservedLabel, value: reserved },
    { name: t.freeStock, value: available },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-[#17212b]" dir={rtl ? "rtl" : "ltr"} lang={lang}>
      <header className="border-b border-[#d9e0e8] bg-[#17365d] text-white print:bg-white print:text-black">
        <div className="mx-auto max-w-7xl px-6 py-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4" /> {t.badge}
              </div>
              <h1 className="text-2xl font-semibold leading-tight md:text-4xl">{t.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">{t.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 print:hidden">
              <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 p-1">
                <Languages className="mx-1 h-4 w-4 text-white/70" />
                {(["zh", "en", "fa"] as Lang[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${lang === code ? "bg-white text-[#17365d]" : "text-white/75 hover:text-white"}`}
                  >
                    {code === "zh" ? "中文" : code === "en" ? "EN" : "فارسی"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#17365d]"
              >
                <Printer className="h-4 w-4" /> {t.print}
              </button>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/15 pt-4 text-sm">
            <span className="text-white/65">{t.reportDate}</span>
            <strong className="tabular-nums">{report.reportDate}</strong>
            <span className="rounded-full bg-[#c98316] px-3 py-1 text-xs font-semibold">{t.status}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-6 py-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label={t.projectProgress} value={`${n1(progress)}%`} note={`${n0(achieved)} / ${n0(planBase)} ${t.ton}`} icon={Factory} />
          <KpiCard label={t.galvanized} value={n0(report.totals.galvanized)} note={t.ton} icon={PackageCheck} />
          <KpiCard label={t.sold} value={n0(report.totals.sold)} note={`${n1((report.totals.sold / Math.max(report.totals.galvanized, 1)) * 100)}%`} icon={ShoppingCart} />
          <KpiCard label={t.inventory} value={n0(inventory)} note={t.ton} icon={Warehouse} warning />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#ead6a8] bg-[#fff8e8] p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#b26f00]" />
              <div>
                <h2 className="font-semibold text-[#7a4c00]">{t.mainIssue}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6c562f]">{t.issueText}</p>
              </div>
            </div>
          </article>
          <article className="rounded-2xl border border-[#cfe2d7] bg-[#eef8f2] p-5">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2e7d5b]" />
              <div>
                <h2 className="font-semibold text-[#245e47]">{t.requiredAction}</h2>
                <p className="mt-2 text-sm leading-6 text-[#476858]">{t.actionText}</p>
              </div>
            </div>
          </article>
        </section>

        <Panel title={t.projectFlow} subtitle={t.projectFlowSub}>
          <div className="grid gap-3 lg:grid-cols-5">
            {stages.map((stage, index) => {
              const previous = index === 0 ? stage.value : stages[index - 1].value;
              const ratio = previous > 0 ? (stage.value / previous) * 100 : 0;
              const Icon = stage.icon;
              return (
                <div key={stage.label} className="relative rounded-xl border border-[#d9e0e8] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="h-5 w-5 text-[#245a8d]" />
                    {index > 0 && <span className="text-xs font-semibold text-[#66717e]">{n1(ratio)}%</span>}
                  </div>
                  <p className="mt-5 text-xs font-medium text-[#66717e]">{stage.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-[#17365d]">{n0(stage.value)}</p>
                  <p className="text-xs text-[#66717e]">{t.ton}</p>
                  {index < stages.length - 1 && <ArrowDown className="mx-auto mt-3 h-4 w-4 text-[#9aa5b1] lg:hidden" />}
                </div>
              );
            })}
          </div>
        </Panel>

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel title={t.planActual} subtitle={t.planActualSub}>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <Summary label={t.totalPlan} value={`${n0(planBase)} ${t.ton}`} />
              <Summary label={t.totalActual} value={`${n0(achieved)} ${t.ton}`} highlight />
              <Summary label={t.remaining} value={`${n0(Math.max(planBase - achieved, 0))} ${t.ton}`} />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planChart}>
                  <CartesianGrid stroke="#e2e7ec" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" fontSize={11} stroke="#66717e" />
                  <YAxis fontSize={11} stroke="#66717e" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="planned" name={t.plan} fill="#9db3c8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name={t.actual} fill="#245a8d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={t.salesBalance} subtitle={t.salesBalanceSub}>
            <div className="space-y-4">
              {balance.map((item, index) => {
                const base = Math.max(report.totals.galvanized, 1);
                const width = Math.min((item.value / base) * 100, 100);
                return (
                  <div key={item.name}>
                    <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="font-semibold tabular-nums">{n0(item.value)} {t.ton}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#e7ecf1]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${width}%`, background: ["#17365d", "#2e7d5b", "#c98316", "#7b8ea3"][index] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title={t.commercial} subtitle={t.paymentPending}>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatusCard icon={Truck} label={t.reserved} value={`${n0(reserved)} ${t.ton}`} />
              <StatusCard icon={Warehouse} label={t.warehousePressure} value={`${n0(readyWarehouse)} ${t.ton}`} warning />
              <StatusCard icon={AlertTriangle} label={t.productionConstraint} value={t.status} warning />
            </div>
          </Panel>
          <Panel title={t.ownerMap} subtitle={t.subtitle}>
            <div className="space-y-3 text-sm leading-6 text-[#4f5c69]">
              <p className="rounded-xl bg-[#f4f7fa] px-4 py-3"><strong className="text-[#17365d]">AKA:</strong> {t.aka.replace(/^AKA:\s*/, "")}</p>
              <p className="rounded-xl bg-[#f4f7fa] px-4 py-3">{t.factory}</p>
              <p className="rounded-xl bg-[#f4f7fa] px-4 py-3">{t.tehran}</p>
            </div>
          </Panel>
        </section>

        {((report as any).projectAnalysis || (report as any).managementCommentary) && (
          <Panel title={localized((report as any).projectAnalysis, lang) ? t.mainIssue : t.requiredAction} subtitle={t.subtitle}>
            <div className="grid gap-4 lg:grid-cols-2">
              {localized((report as any).projectAnalysis, lang) && (
                <p className="rounded-xl bg-[#f4f7fa] p-5 text-sm leading-7 text-[#43515f]">
                  {localized((report as any).projectAnalysis, lang)}
                </p>
              )}
              {(report as any).managementCommentary?.keyNote && (
                <p className="rounded-xl border-s-4 border-[#c98316] bg-[#fff8e8] p-5 text-sm leading-7 text-[#5c4b2b]">
                  {localized((report as any).managementCommentary.keyNote, lang)}
                </p>
              )}
            </div>
          </Panel>
        )}
      </main>
    </div>
  );
}

function KpiCard({ label, value, note, icon: Icon, warning = false }: { label: string; value: string; note: string; icon: typeof Factory; warning?: boolean }) {
  return (
    <article className="rounded-2xl border border-[#d9e0e8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#66717e]">{label}</p>
          <p className={`mt-4 text-3xl font-semibold tabular-nums ${warning ? "text-[#b26f00]" : "text-[#17365d]"}`}>{value}</p>
          <p className="mt-1 text-xs text-[#66717e]">{note}</p>
        </div>
        <span className={`rounded-xl p-2.5 ${warning ? "bg-[#fff1d6] text-[#b26f00]" : "bg-[#eaf1f7] text-[#245a8d]"}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#d9e0e8] bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[#17365d]">{title}</h2>
        <p className="mt-1 text-sm text-[#66717e]">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Summary({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-[#eaf5ef]" : "bg-[#f4f7fa]"}`}>
      <p className="text-xs text-[#66717e]">{label}</p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${highlight ? "text-[#2e7d5b]" : "text-[#17365d]"}`}>{value}</p>
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, warning = false }: { icon: typeof Truck; label: string; value: string; warning?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${warning ? "border-[#ead6a8] bg-[#fff8e8]" : "border-[#d9e0e8] bg-[#f7f9fb]"}`}>
      <Icon className={`h-5 w-5 ${warning ? "text-[#b26f00]" : "text-[#245a8d]"}`} />
      <p className="mt-4 text-xs leading-5 text-[#66717e]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#17365d]">{value}</p>
    </div>
  );
}
