import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  Factory,
  Languages,
  PackageCheck,
  Printer,
  Ship,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import rawReport from "@/data/report.json";
import { reportChecks, sum, type AKAProjectReport, type ReportLanguage } from "@/lib/report-model";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AKA Project Management Report | AKA 项目管理报告" },
      {
        name: "description",
        content:
          "Executive production, inventory, sales and financial report for the AKA galvanizing project.",
      },
    ],
  }),
  component: Index,
});

const report = rawReport as AKAProjectReport;
const fmt = (value: number, digits = 3) =>
  value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const fmtRial = (value: number) => value.toLocaleString("en-US");
const COLORS = ["#0f6f8f", "#2aa37a", "#f0a23b", "#cf4d5c"];

const labels: Record<string, Record<ReportLanguage, string>> = {
  executiveReport: {
    zh: "管理层执行报告",
    en: "Executive Management Report",
    fa: "گزارش اجرایی مدیریت",
  },
  reportDate: { zh: "报告日期", en: "Report Date", fa: "تاریخ گزارش" },
  version: { zh: "版本", en: "Version", fa: "نسخه" },
  managementFocus: { zh: "管理重点", en: "Management Focus", fa: "تمرکز مدیریتی" },
  focusText: {
    zh: "成品仓库已满，销售与发运速度已成为完成剩余生产计划的关键约束。",
    en: "Finished-goods storage is full; sales and dispatch speed are now the key constraints on completing the remaining production plan.",
    fa: "انبار محصول نهایی پر است و سرعت فروش و ارسال، محدودیت اصلی تکمیل برنامه تولید باقی‌مانده است.",
  },
  production: { zh: "生产概览", en: "Production Overview", fa: "نمای کلی تولید" },
  productionHrc: { zh: "镀锌产量 / HRC", en: "Production (GLV/HRC)", fa: "تولید GLV/HRC" },
  saleHrc: { zh: "销售 / HRC", en: "Sale (Sale/HRC)", fa: "فروش/HRC" },
  saleGlv: { zh: "销售 / GLV", en: "Sale (Sale/GLV)", fa: "فروش/GLV" },
  galvanizingScrap: {
    zh: "镀锌线废料",
    en: "Scrap in Galvanizing Line",
    fa: "ضایعات خط گالوانیزه",
  },
  hotRollScrap: { zh: "热轧线废料", en: "Scrap in Hot Roll Line", fa: "ضایعات خط نورد گرم" },
  productSold: { zh: "产品销售率", en: "Product Sold", fa: "نرخ فروش محصول" },
  inputCoilsTon: { zh: "入厂卷材吨位", en: "Input Coils in Factory", fa: "تناژ کویل ورودی" },
  inputCoilsQty: { zh: "入厂卷材数量", en: "Input Coil Quantity", fa: "تعداد کویل ورودی" },
  pickling: { zh: "酸洗", en: "Pickling", fa: "اسیدشویی" },
  rolling: { zh: "冷轧", en: "Rolling", fa: "نورد" },
  galvanized: { zh: "镀锌", en: "Galvanized", fa: "گالوانیزه" },
  sold: { zh: "已售", en: "Sold", fa: "فروش" },
  warehouseWip: { zh: "仓库与在制品", en: "Warehouse & WIP", fa: "انبار و کالای در جریان" },
  scrap: { zh: "废料与边丝", en: "Spira & Scrap", fa: "اسپیرا و ضایعات" },
  materialBalance: { zh: "物料平衡", en: "Material Balance", fa: "بالانس مواد" },
  finishedGoods: { zh: "成品状态", en: "Finished Goods Status", fa: "وضعیت محصول نهایی" },
  yields: { zh: "工序良率", en: "Process Yields", fa: "راندمان فرآیند" },
  productionFlow: { zh: "生产流程（吨）", en: "Production Flow (Ton)", fa: "جریان تولید (تن)" },
  dailyTrend: { zh: "每日生产趋势", en: "Daily Production Trend", fa: "روند تولید روزانه" },
  coating: {
    zh: "按厚度统计的锌耗明细",
    en: "Zinc Consumption by Thickness",
    fa: "مصرف روی به تفکیک ضخامت",
  },
  massBalance: { zh: "锌质量平衡", en: "Zinc Mass Balance", fa: "بالانس جرم روی" },
  salesTransport: { zh: "销售与运输", en: "Sales & Transportation", fa: "فروش و حمل" },
  financial: { zh: "财务汇总", en: "Financial Summary", fa: "خلاصه مالی" },
  transfers: {
    zh: "汇款与美元转账",
    en: "Transfers & USD Remittances",
    fa: "حواله‌ها و انتقال دلار",
  },
  productionPlan: { zh: "生产计划", en: "Production Plan", fa: "برنامه تولید" },
  inventory: { zh: "成品库存", en: "Finished Goods Inventory", fa: "موجودی محصول نهایی" },
  dailyProduction: { zh: "每日生产明细", en: "Daily Production Detail", fa: "جزئیات تولید روزانه" },
  notes: { zh: "管理说明", en: "Management Notes", fa: "یادداشت‌های مدیریتی" },
  unpickled: { zh: "未酸洗", en: "Unpickled", fa: "اسیدشویی نشده" },
  pickled: { zh: "已酸洗", en: "Pickled", fa: "اسیدشویی شده" },
  rolled: { zh: "已轧制", en: "Rolled", fa: "نورد شده" },
  galvanizing: { zh: "镀锌线", en: "Galvanizing", fa: "خط گالوانیزه" },
  factoryInput: { zh: "工厂投入", en: "Factory Input", fa: "ورودی کارخانه" },
  finalGalvanizedProduct: {
    zh: "最终镀锌产品",
    en: "Final Galvanized Product",
    fa: "محصول نهایی گالوانیزه",
  },
  wip: { zh: "在制品", en: "Work in Progress", fa: "کالای در جریان" },
  totalScrap: { zh: "废料总计", en: "Total Scrap", fa: "کل ضایعات" },
  balanceDifference: { zh: "平衡差异", en: "Balance Difference", fa: "اختلاف بالانس" },
  finalGalvanizedProduction: {
    zh: "镀锌成品产量",
    en: "Final Galvanized Production",
    fa: "تولید نهایی گالوانیزه",
  },
  finishedGoodsWarehouse: {
    zh: "成品仓库",
    en: "Finished Goods Warehouse",
    fa: "انبار محصول نهایی",
  },
  picklingYield: { zh: "酸洗良率", en: "Pickling Yield", fa: "راندمان اسیدشویی" },
  rollingYield: { zh: "轧制良率", en: "Rolling Yield", fa: "راندمان نورد" },
  galvanizingYield: { zh: "镀锌良率", en: "Galvanizing Yield", fa: "راندمان گالوانیزه" },
  coilToCoilYield: { zh: "卷到卷良率", en: "Coil-to-Coil Yield", fa: "راندمان کویل به کویل" },
  totalSteelProduction: { zh: "钢材总产量", en: "Total Steel Production", fa: "کل تولید فولاد" },
  theoreticalZinc: { zh: "理论锌耗", en: "Theoretical Zinc", fa: "روی نظری" },
  actualZinc: { zh: "钢材实际镀锌量", en: "Actual Zinc on Steel", fa: "روی واقعی روی محصول" },
  drossLoss: { zh: "锌渣损耗", en: "Dross Loss", fa: "تلفات سرباره" },
  zincEfficiency: { zh: "锌利用率", en: "Zinc Efficiency", fa: "بازده روی" },
  totalSalesCollected: {
    zh: "销售回款总额",
    en: "Total Sales / Collected",
    fa: "کل فروش / دریافتی",
  },
  projectCosts: {
    zh: "项目采购与费用",
    en: "Zinc, Zamak, Customs & Other Costs",
    fa: "هزینه روی، زاماک، گمرک و سایر",
  },
  transferChinaOffice: {
    zh: "转入中国办公室",
    en: "Transfer to China Office",
    fa: "انتقال به دفتر چین",
  },
  paidMrFardar: { zh: "支付Fardar先生", en: "Paid to Mr. Fardar", fa: "پرداخت به آقای فاردار" },
  remaining: { zh: "余额", en: "Remaining", fa: "باقیمانده" },
};

function Index() {
  const [lang, setLang] = useState<ReportLanguage>("zh");
  const t = (key: string) => labels[key]?.[lang] ?? key;
  const title = report.title[lang] ?? report.title.en;
  const checks = useMemo(() => reportChecks(report), []);
  const chartDaily = report.dailyProduction.map((r) => ({
    date: r.date.slice(5),
    pickling: r.pickling,
    rolling: r.rolling,
    galvanized: r.galvanized,
  }));
  const flow = [
    { name: t("factoryInput"), value: report.totals.inputCoilsTon },
    { name: t("pickling"), value: report.totals.pickling },
    { name: t("rolling"), value: report.totals.rolling },
    { name: t("galvanized"), value: report.totals.galvanized },
    { name: t("sold"), value: report.totals.sold },
  ];
  const financialTotal = sum(report.transfers, (r) => r.rialAmount);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-slate-900">
      <div className="no-print sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1480px] items-center justify-end gap-2 px-4 py-2">
          <Languages className="h-4 w-4 text-slate-400" />
          {(["zh", "en", "fa"] as ReportLanguage[]).map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${lang === code ? "bg-[#123b57] text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {code === "zh" ? "中文" : code === "en" ? "EN" : "فارسی"}
            </button>
          ))}
          <button
            onClick={() => window.print()}
            className="ml-2 inline-flex items-center gap-2 rounded-md bg-[#b52532] px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Printer className="h-4 w-4" />
            {lang === "zh" ? "打印 / PDF" : "Print / PDF"}
          </button>
        </div>
      </div>

      <header className="bg-[#102f46] text-white">
        <div className="mx-auto max-w-[1480px] px-5 py-9">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                {t("executiveReport")}
              </p>
              <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
              <p className="mt-2 text-sm text-slate-300">
                Galvanizing Project · Production · Inventory · Sales · Finance
              </p>
            </div>
            <div className="flex gap-3">
              <HeaderMeta
                label={t("reportDate")}
                value={report.reportDate}
                icon={<CalendarDays />}
              />
              <HeaderMeta label={t("version")} value={`V${report.version}`} icon={<BarChart3 />} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] space-y-7 px-4 py-7 md:px-6">
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-amber-900">{t("managementFocus")}</h2>
              <p className="mt-1 text-sm leading-6 text-amber-800">{t("focusText")}</p>
            </div>
          </div>
        </section>

        <ReportSection title={t("production")} icon={<Factory />}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {report.productionKpis.map((kpi) => (
              <Kpi
                key={kpi.key}
                label={t(kpi.key)}
                value={`${kpi.value.toFixed(kpi.value < 10 ? 2 : 1)}%`}
              />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Metric label={t("inputCoilsTon")} value={fmt(report.totals.inputCoilsTon)} unit="t" />
            <Metric
              label={t("inputCoilsQty")}
              value={fmt(report.totals.inputCoilsQty, 0)}
              unit="coils"
            />
            <Metric label={t("pickling")} value={fmt(report.totals.pickling)} unit="t" />
            <Metric label={t("rolling")} value={fmt(report.totals.rolling)} unit="t" />
            <Metric
              label={t("galvanized")}
              value={fmt(report.totals.galvanized)}
              unit="t"
              highlight
            />
            <Metric label={t("sold")} value={fmt(report.totals.sold)} unit="t" />
          </div>
        </ReportSection>

        <div className="grid gap-6 xl:grid-cols-2">
          <ReportSection title={t("productionFlow")} icon={<TrendingUp />}>
            <Chart height={300}>
              <BarChart data={flow} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${fmt(Number(v))} t`} />
                <Bar dataKey="value" fill="#0f6f8f" radius={[0, 6, 6, 0]} />
              </BarChart>
            </Chart>
          </ReportSection>
          <ReportSection title={t("dailyTrend")} icon={<BarChart3 />}>
            <Chart height={300}>
              <LineChart data={chartDaily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  dataKey="pickling"
                  stroke="#0f6f8f"
                  strokeWidth={2}
                  dot={false}
                  name={t("pickling")}
                />
                <Line
                  dataKey="rolling"
                  stroke="#f0a23b"
                  strokeWidth={2}
                  dot={false}
                  name={t("rolling")}
                />
                <Line
                  dataKey="galvanized"
                  stroke="#2aa37a"
                  strokeWidth={2.5}
                  dot={false}
                  name={t("galvanized")}
                />
              </LineChart>
            </Chart>
          </ReportSection>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          <SimpleData
            title={t("warehouseWip")}
            rows={report.warehouse.map((r) => [t(r.key), fmt(r.ton)])}
          />
          <SimpleData title={t("scrap")} rows={report.scrap.map((r) => [t(r.key), fmt(r.ton)])} />
          <SimpleData
            title={t("materialBalance")}
            rows={report.materialBalance.map((r) => [t(r.key), fmt(r.ton)])}
            good={Math.abs(checks.materialBalanceDifference) < 0.01}
          />
          <SimpleData
            title={t("finishedGoods")}
            rows={report.finishedGoods.map((r) => [t(r.key), fmt(r.ton)])}
          />
        </div>

        <ReportSection title={t("yields")} icon={<TrendingUp />}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {report.yields.map((row) => (
              <div key={row.key} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">{t(row.key)}</p>
                <p className="mt-1 min-h-8 text-[11px] text-slate-500">{row.formula}</p>
                <p className="mt-3 text-3xl font-bold text-[#0f6f8f]">{row.value.toFixed(1)}%</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#2aa37a]"
                    style={{ width: `${Math.min(row.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ReportSection>

        <ReportSection title={t("massBalance")} icon={<Factory />}>
          <div className="grid gap-3 md:grid-cols-5">
            {report.massBalance.map((r) => (
              <Metric
                key={r.key}
                label={t(r.key)}
                value={fmt(r.value, r.unit === "%" ? 1 : 3)}
                unit={r.unit}
                highlight={r.key === "zincEfficiency"}
              />
            ))}
          </div>
        </ReportSection>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <ReportSection title={t("salesTransport")} icon={<Ship />}>
            <DataTable
              headers={["Date", "Buyer", "Tonnage (t)", "Amount (IRR)"]}
              rows={report.sales.map((r) => [
                r.date,
                r.buyer,
                fmt(r.tonnage),
                fmtRial(r.amountRial),
              ])}
              total={[
                "Total",
                "",
                fmt(sum(report.sales, (r) => r.tonnage)),
                fmtRial(sum(report.sales, (r) => r.amountRial)),
              ]}
            />
          </ReportSection>
          <ReportSection
            title={lang === "zh" ? "运输状态" : "Transport Status"}
            icon={<PackageCheck />}
          >
            <div className="grid gap-4">
              <Metric
                label={lang === "zh" ? "装载中" : "Under Loading"}
                value={fmt(report.transport.underLoading)}
                unit="t"
              />
              <Metric
                label={lang === "zh" ? "仓库待发" : "Ready in Warehouse"}
                value={fmt(report.transport.readyInWarehouse)}
                unit="t"
                highlight
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              {lang === "zh"
                ? "装载量至少达到25吨后方可向买方发运。"
                : "Under-loading capacity must reach at least 25 tons before delivery."}
            </p>
          </ReportSection>
        </div>

        <ReportSection title={t("financial")} icon={<CircleDollarSign />}>
          <DataTable
            headers={[
              lang === "zh" ? "项目" : "Item",
              "Amount (IRR)",
              lang === "zh" ? "说明" : "Notes",
            ]}
            rows={report.financial.map((r) => [t(r.key), fmtRial(r.amountRial), r.note ?? "—"])}
          />
        </ReportSection>
        <ReportSection title={t("transfers")} icon={<CircleDollarSign />}>
          <DataTable
            headers={["Date", "Rial Amount", "USD Rate", "USD Amount", "Status", "Notes"]}
            rows={report.transfers.map((r) => [
              r.date,
              fmtRial(r.rialAmount),
              fmtRial(r.usdRate),
              fmt(r.usdAmount, 2),
              r.status,
              r.notes ?? "—",
            ])}
            total={[
              "Total",
              fmtRial(financialTotal),
              "",
              fmt(
                sum(report.transfers, (r) => r.usdAmount),
                2,
              ),
              "",
              "",
            ]}
          />
        </ReportSection>

        <ReportSection title={t("productionPlan")} icon={<CalendarDays />}>
          <DataTable
            headers={["Date", "Thickness (mm)", "Width (mm)", "Tons", "Status"]}
            rows={report.productionPlan.map((r) => [
              r.date,
              r.thickness,
              r.width,
              fmt(r.tons, 0),
              r.status,
            ])}
          />
        </ReportSection>

        <ReportSection title={t("inventory")} icon={<Boxes />}>
          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <DataTable
              headers={[
                "Thickness (mm)",
                "Width (mm)",
                "Grade A (kg)",
                "Grade B/C (kg)",
                "Total (kg)",
              ]}
              rows={report.inventory.map((r) => [
                r.thickness,
                r.width,
                fmt(r.gradeAKg, 0),
                fmt(r.gradeBCKg, 0),
                fmt(r.totalKg, 0),
              ])}
              total={[
                "Total",
                "",
                fmt(
                  sum(report.inventory, (r) => r.gradeAKg),
                  0,
                ),
                fmt(
                  sum(report.inventory, (r) => r.gradeBCKg),
                  0,
                ),
                fmt(
                  sum(report.inventory, (r) => r.totalKg),
                  0,
                ),
              ]}
            />
            <Chart height={300}>
              <BarChart data={report.inventory.filter((r) => r.totalKg > 0)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${v / 1000}t`} />
                <YAxis dataKey="thickness" type="category" width={45} />
                <Tooltip formatter={(v) => `${fmt(Number(v) / 1000)} t`} />
                <Legend />
                <Bar dataKey="gradeAKg" stackId="a" fill="#0f6f8f" name="Grade A" />
                <Bar dataKey="gradeBCKg" stackId="a" fill="#f0a23b" name="Grade B/C" />
              </BarChart>
            </Chart>
          </div>
        </ReportSection>

        <ReportSection title={t("dailyProduction")} icon={<BarChart3 />}>
          <DataTable
            headers={[
              "Persian Date",
              "Date",
              "Input Ton",
              "Input Qty",
              "Pickling",
              "Rolling",
              "Galvanized",
            ]}
            rows={report.dailyProduction.map((r) => [
              r.persianDate,
              r.date,
              fmt(r.inputCoilsTon),
              fmt(r.inputCoilsQty, 0),
              fmt(r.pickling),
              fmt(r.rolling),
              fmt(r.galvanized),
            ])}
            total={[
              "Cumulative total",
              "",
              "",
              "",
              fmt(report.totals.pickling),
              fmt(report.totals.rolling),
              fmt(report.totals.galvanized),
            ]}
          />
          <p className="mt-3 text-[11px] leading-5 text-slate-500">
            {lang === "zh"
              ? "注：累计总量采用报告首页核准值。每日明细的四舍五入差异将在下一次数据录入时核对。"
              : "Note: cumulative totals use the approved values shown on the report cover. Rounding variances in daily detail will be reconciled in the next data-entry phase."}
          </p>
        </ReportSection>

        <ReportSection title={t("notes")} icon={<AlertTriangle />}>
          <ol className="grid gap-3 lg:grid-cols-2">
            {report.notes.map((note, index) => (
              <li
                key={index}
                className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#123b57] text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span>{note[lang] ?? note.en}</span>
              </li>
            ))}
          </ol>
        </ReportSection>
        <footer className="border-t border-slate-300 py-7 text-center">
          <p className="text-xs uppercase tracking-[.2em] text-slate-500">
            {report.signature.role[lang] ?? report.signature.role.en}
          </p>
          <p className="mt-2 font-semibold">{report.signature.name}</p>
        </footer>
      </main>
    </div>
  );
}

function HeaderMeta({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex min-w-36 items-center gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-3">
      <span className="[&>svg]:h-5 [&>svg]:w-5 text-cyan-200">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-300">{label}</p>
        <p className="font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
function ReportSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <span className="[&>svg]:h-4 [&>svg]:w-4 text-[#0f6f8f]">{icon}</span>
        <h2 className="text-sm font-bold tracking-wide text-[#123b57]">{title}</h2>
      </header>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}
function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 text-center">
      <p className="min-h-9 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#123b57]">{value}</p>
    </div>
  );
}
function Metric({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${highlight ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
    >
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`text-xl font-bold tabular-nums ${highlight ? "text-emerald-700" : "text-[#123b57]"}`}
        >
          {value}
        </span>
        <span className="text-[10px] text-slate-400">{unit}</span>
      </div>
    </div>
  );
}
function SimpleData({
  title,
  rows,
  good,
}: {
  title: string;
  rows: (string | number)[][];
  good?: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#123b57]">{title}</h3>
        {good !== undefined && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${good ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
          >
            {good ? "BALANCED" : "CHECK"}
          </span>
        )}
      </div>
      <div>
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex justify-between gap-3 border-t border-slate-100 py-2 text-xs first:border-0"
          >
            <span className="text-slate-500">{r[0]}</span>
            <strong className="tabular-nums">{r[1]} t</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
function Chart({ height, children }: { height: number; children: ReactNode }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}
function DataTable({
  headers,
  rows,
  total,
}: {
  headers: string[];
  rows: (string | number)[][];
  total?: (string | number)[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-xs">
        <thead>
          <tr className="bg-[#123b57] text-white">
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/70">
              {r.map((v, j) => (
                <td
                  key={j}
                  className={`whitespace-nowrap px-3 py-2.5 tabular-nums ${j === 0 ? "font-medium" : ""}`}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
          {total && (
            <tr className="bg-slate-100 font-bold text-[#123b57]">
              {total.map((v, j) => (
                <td key={j} className="px-3 py-2.5 tabular-nums">
                  {v}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
