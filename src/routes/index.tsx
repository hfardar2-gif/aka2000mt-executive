import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
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
        content: "Executive and operational overview of the AKA galvanizing project.",
      },
    ],
  }),
  component: ExecutiveDashboard,
});

type Lang = "zh" | "en" | "fa";
type AnyRow = Record<string, any>;

const copy = {
  zh: {
    badge: "管理层项目报告",
    title: "AKA热轧卷加工、镀锌及销售项目",
    subtitle: "材料加工、生产、库存、销售及发运综合报告",
    reportDate: "报告日期",
    progress: "生产计划完成率",
    galvanized: "镀锌产量",
    sold: "已完成销售",
    inventory: "成品库存",
    mainIssue: "核心管理问题",
    issueText: "生产进度快于销售进度，成品库存正在占用仓储容量。",
    action: "建议管理行动",
    actionText: "优先完成回款和发运，并为剩余库存制定明确的销售计划。",
    planActual: "生产计划与实际完成",
    planActualSub: "已完成批次、剩余计划及总体完成率",
    plan: "计划",
    actual: "实际",
    materialBalance: "物料平衡",
    materialBalanceSub: "投入、产出、库存、在制品及废料的平衡视图",
    warehouse: "各阶段库存",
    warehouseSub: "酸洗前、酸洗后、轧制后及镀锌成品库存",
    yields: "工序良率",
    yieldsSub: "各生产阶段的转换效率",
    scrap: "废料情况",
    scrapSub: "轧制与镀锌工序废料",
    daily: "每日生产",
    dailySub: "酸洗、轧制和镀锌的日产量",
    commercial: "商务与发运状态",
    reserved: "已预留待发",
    ready: "可发运库存",
    ownerMap: "执行责任",
    ton: "吨",
    print: "打印",
    factory: "Foolad Dashtestan：酸洗、轧制、镀锌及装运",
    tehran: "德黑兰办公室：销售、回款及交付协调",
    aka: "AKA：项目监督、进口材料及管理决策",
  },
  en: {
    badge: "Executive Project Report",
    title: "AKA Hot-Rolled Coil Conversion and Sales Project",
    subtitle: "Integrated report on processing, production, inventory, sales and shipment",
    reportDate: "Report date",
    progress: "Production plan completion",
    galvanized: "Galvanized output",
    sold: "Completed sales",
    inventory: "Finished-goods inventory",
    mainIssue: "Key management issue",
    issueText: "Production is ahead of completed sales and finished-goods stock is consuming warehouse capacity.",
    action: "Required management action",
    actionText: "Prioritize collection and shipment, then assign the remaining inventory to a clear sales plan.",
    planActual: "Production plan vs actual",
    planActualSub: "Completed tranches, remaining plan and total achievement",
    plan: "Plan",
    actual: "Actual",
    materialBalance: "Material Balance",
    materialBalanceSub: "Balance of factory input, final product, warehouse, WIP and scrap",
    warehouse: "Inventory by Process Stage",
    warehouseSub: "Unpickled, pickled, rolled and galvanized stock",
    yields: "Process Yields",
    yieldsSub: "Conversion efficiency across production stages",
    scrap: "Scrap Summary",
    scrapSub: "Scrap generated in rolling and galvanizing",
    daily: "Daily Production",
    dailySub: "Daily pickling, rolling and galvanizing output",
    commercial: "Commercial and Shipment Status",
    reserved: "Reserved for shipment",
    ready: "Ready to ship",
    ownerMap: "Execution Responsibility",
    ton: "ton",
    print: "Print",
    factory: "Foolad Dashtestan: pickling, rolling, galvanizing and loading",
    tehran: "Tehran office: sales, collection and delivery coordination",
    aka: "AKA: project oversight, imported material and management decisions",
  },
  fa: {
    badge: "گزارش اجرایی پروژه",
    title: "پروژهٔ تبدیل ورق گرم، گالوانیزه‌سازی و فروش آکا",
    subtitle: "گزارش یکپارچهٔ فرآوری، تولید، موجودی، فروش و ارسال",
    reportDate: "تاریخ گزارش",
    progress: "تحقق برنامهٔ تولید",
    galvanized: "تولید گالوانیزه",
    sold: "فروش قطعی",
    inventory: "موجودی محصول نهایی",
    mainIssue: "مسئلهٔ اصلی مدیریتی",
    issueText: "تولید از فروش قطعی جلوتر است و موجودی محصول نهایی ظرفیت انبار را اشغال کرده است.",
    action: "اقدام مدیریتی موردنیاز",
    actionText: "وصول وجه و ارسال در اولویت قرار گیرد و برای موجودی باقی‌مانده برنامهٔ فروش مشخص تدوین شود.",
    planActual: "برنامهٔ تولید در برابر عملکرد",
    planActualSub: "بخش‌های تکمیل‌شده، برنامهٔ باقی‌مانده و درصد تحقق",
    plan: "برنامه",
    actual: "عملکرد",
    materialBalance: "بالانس متریال",
    materialBalanceSub: "توازن ورودی کارخانه، محصول نهایی، انبار، کالای در جریان و ضایعات",
    warehouse: "موجودی مراحل فرایند",
    warehouseSub: "موجودی اسیدشویی‌نشده، اسیدشویی‌شده، نوردشده و گالوانیزه",
    yields: "راندمان فرایندها",
    yieldsSub: "بازده تبدیل در مراحل مختلف تولید",
    scrap: "خلاصهٔ ضایعات",
    scrapSub: "ضایعات ایجادشده در نورد و گالوانیزه",
    daily: "تولید روزانه",
    dailySub: "مقدار روزانهٔ اسیدشویی، نورد و گالوانیزه",
    commercial: "وضعیت تجاری و ارسال",
    reserved: "رزروشده برای ارسال",
    ready: "آمادهٔ ارسال",
    ownerMap: "مسئولیت اجرا",
    ton: "تن",
    print: "چاپ",
    factory: "فولاد دشتستان: اسیدشویی، نورد، گالوانیزه و بارگیری",
    tehran: "دفتر تهران: فروش، وصول و هماهنگی تحویل",
    aka: "آکا: نظارت پروژه، مواد وارداتی و تصمیم‌های مدیریتی",
  },
} as const;

const n0 = (value: number) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const n2 = (value: number) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

function ExecutiveDashboard() {
  const [lang, setLang] = useState<Lang>("zh");
  const t = copy[lang];
  const rtl = lang === "fa";
  const planRows = (report.plan ?? []) as AnyRow[];
  const totalPlanned = planRows.reduce((sum, row) => sum + Number(row.tons ?? 0), 0);
  const totalActual = planRows.reduce(
    (sum, row) => sum + (/complete/i.test(String(row.status ?? "")) ? Number(row.tons ?? 0) : 0),
    0,
  );
  const planBase = totalPlanned || Number(report.totals.inputCoilsTon || 1);
  const achieved = totalActual || Number(report.totals.galvanized || 0);
  const progress = (achieved / Math.max(planBase, 1)) * 100;
  const inventory = Math.max(Number(report.totals.galvanized) - Number(report.totals.sold), 0);
  const reserved = Number((report as AnyRow).transport?.reserved ?? 0);
  const readyWarehouse = Number((report as AnyRow).transport?.readyWarehouse ?? inventory);

  const planChart = useMemo(
    () => planRows.map((row) => ({
      date: row.date,
      planned: Number(row.tons ?? 0),
      actual: /complete/i.test(String(row.status ?? "")) ? Number(row.tons ?? 0) : 0,
    })),
    [planRows],
  );

  const dailyChart = useMemo(
    () => ((report.daily ?? []) as AnyRow[]).slice(-18).map((row) => ({
      date: String(row.date ?? "").slice(5),
      pickling: Number(row.pickling ?? 0),
      rolling: Number(row.rolling ?? 0),
      galvanized: Number(row.galv ?? 0),
    })),
    [],
  );

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
                  <button key={code} onClick={() => setLang(code)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${lang === code ? "bg-white text-[#17365d]" : "text-white/75"}`}>
                    {code === "zh" ? "中文" : code === "en" ? "EN" : "فارسی"}
                  </button>
                ))}
              </div>
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#17365d]">
                <Printer className="h-4 w-4" /> {t.print}
              </button>
            </div>
          </div>
          <div className="mt-6 flex gap-3 border-t border-white/15 pt-4 text-sm">
            <span className="text-white/65">{t.reportDate}</span>
            <strong>{report.reportDate}</strong>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-6 py-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi label={t.progress} value={`${progress.toFixed(1)}%`} note={`${n0(achieved)} / ${n0(planBase)} ${t.ton}`} icon={Factory} />
          <Kpi label={t.galvanized} value={n0(report.totals.galvanized)} note={t.ton} icon={PackageCheck} />
          <Kpi label={t.sold} value={n0(report.totals.sold)} note={t.ton} icon={ShoppingCart} />
          <Kpi label={t.inventory} value={n0(inventory)} note={t.ton} icon={Warehouse} warning />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Notice title={t.mainIssue} text={t.issueText} warning />
          <Notice title={t.action} text={t.actionText} />
        </section>

        <Panel title={t.planActual} subtitle={t.planActualSub}>
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

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel title={t.materialBalance} subtitle={t.materialBalanceSub}>
            <DataTable rows={(report.materialBalance ?? []) as AnyRow[]} labelKey="k" valueKey="v" unit={t.ton} />
          </Panel>
          <Panel title={t.warehouse} subtitle={t.warehouseSub}>
            <DataTable rows={(report.warehouse ?? []) as AnyRow[]} labelKey="name" valueKey="ton" unit={t.ton} />
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel title={t.yields} subtitle={t.yieldsSub}>
            <div className="grid gap-3 sm:grid-cols-2">
              {((report.yields ?? []) as AnyRow[]).map((item) => (
                <article key={item.process} className="rounded-xl border border-[#d9e0e8] bg-[#f7f9fb] p-4">
                  <p className="text-sm font-semibold text-[#17365d]">{item.process}</p>
                  <p className="mt-1 text-xs leading-5 text-[#66717e]">{item.formula}</p>
                  <p className="mt-4 text-2xl font-semibold text-[#2e7d5b]">{(Number(item.value) * 100).toFixed(2)}%</p>
                </article>
              ))}
            </div>
          </Panel>
          <Panel title={t.scrap} subtitle={t.scrapSub}>
            <DataTable rows={(report.scrap ?? []) as AnyRow[]} labelKey="line" valueKey="ton" unit={t.ton} />
          </Panel>
        </section>

        <Panel title={t.daily} subtitle={t.dailySub}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChart}>
                <CartesianGrid stroke="#e2e7ec" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={10} stroke="#66717e" />
                <YAxis fontSize={11} stroke="#66717e" />
                <Tooltip />
                <Legend />
                <Bar dataKey="pickling" name={copy[lang].warehouse === "各阶段库存" ? "酸洗" : lang === "fa" ? "اسیدشویی" : "Pickling"} fill="#4c8ca8" />
                <Bar dataKey="rolling" name={lang === "fa" ? "نورد" : lang === "zh" ? "轧制" : "Rolling"} fill="#7b8ea3" />
                <Bar dataKey="galvanized" name={t.galvanized} fill="#245a8d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title={t.commercial} subtitle={t.ready}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Status label={t.reserved} value={`${n0(reserved)} ${t.ton}`} icon={Truck} />
              <Status label={t.ready} value={`${n0(readyWarehouse)} ${t.ton}`} icon={Warehouse} />
            </div>
          </Panel>
          <Panel title={t.ownerMap} subtitle={t.subtitle}>
            <div className="space-y-3 text-sm leading-6 text-[#4f5c69]">
              <p className="rounded-xl bg-[#f4f7fa] px-4 py-3">{t.aka}</p>
              <p className="rounded-xl bg-[#f4f7fa] px-4 py-3">{t.factory}</p>
              <p className="rounded-xl bg-[#f4f7fa] px-4 py-3">{t.tehran}</p>
            </div>
          </Panel>
        </section>
      </main>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-[#d9e0e8] bg-white p-5 shadow-sm md:p-6"><h2 className="text-lg font-semibold text-[#17365d]">{title}</h2><p className="mt-1 mb-5 text-sm text-[#66717e]">{subtitle}</p>{children}</section>;
}

function Kpi({ label, value, note, icon: Icon, warning = false }: { label: string; value: string; note: string; icon: typeof Factory; warning?: boolean }) {
  return <article className="rounded-2xl border border-[#d9e0e8] bg-white p-5 shadow-sm"><div className="flex justify-between gap-4"><div><p className="text-sm text-[#66717e]">{label}</p><p className={`mt-4 text-3xl font-semibold ${warning ? "text-[#b26f00]" : "text-[#17365d]"}`}>{value}</p><p className="mt-1 text-xs text-[#66717e]">{note}</p></div><Icon className="h-5 w-5 text-[#245a8d]" /></div></article>;
}

function Notice({ title, text, warning = false }: { title: string; text: string; warning?: boolean }) {
  return <article className={`rounded-2xl border p-5 ${warning ? "border-[#ead6a8] bg-[#fff8e8]" : "border-[#cfe2d7] bg-[#eef8f2]"}`}><div className="flex gap-3">{warning ? <AlertTriangle className="h-5 w-5 text-[#b26f00]" /> : <CheckCircle2 className="h-5 w-5 text-[#2e7d5b]" />}<div><h2 className="font-semibold text-[#17365d]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#4f5c69]">{text}</p></div></div></article>;
}

function DataTable({ rows, labelKey, valueKey, unit }: { rows: AnyRow[]; labelKey: string; valueKey: string; unit: string }) {
  return <div className="overflow-hidden rounded-xl border border-[#d9e0e8]">{rows.map((row, index) => <div key={`${row[labelKey]}-${index}`} className="flex items-center justify-between gap-4 border-b border-[#e7ecf1] px-4 py-3 last:border-0"><span className="text-sm text-[#4f5c69]">{row[labelKey]}</span><strong className="text-sm tabular-nums text-[#17365d]">{n2(row[valueKey])} {unit}</strong></div>)}</div>;
}

function Status({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Truck }) {
  return <div className="rounded-xl border border-[#d9e0e8] bg-[#f7f9fb] p-4"><Icon className="h-5 w-5 text-[#245a8d]" /><p className="mt-4 text-xs text-[#66717e]">{label}</p><p className="mt-1 font-semibold text-[#17365d]">{value}</p></div>;
}
