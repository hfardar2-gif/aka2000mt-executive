import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Factory,
  PackageCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import report from "@/data/report.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AKA 2000MT — Executive Dashboard" },
      { name: "description", content: "Executive production, sales and inventory dashboard." },
    ],
  }),
  component: ExecutiveDashboard,
});

type Lang = "zh" | "en" | "fa";

const copy = {
  zh: {
    title: "AKA 2000吨项目管理驾驶舱",
    subtitle: "生产、销售、库存与交付的管理层摘要",
    executive: "管理层摘要",
    updated: "报告日期",
    progress: "项目完成率",
    galvanized: "镀锌产量",
    sold: "销售量",
    conversion: "销售转化率",
    inventory: "成品库存",
    trucks: "预计所需卡车",
    ton: "吨",
    vehicles: "辆",
    risk: "主要风险",
    riskText:
      "成品库存较高，而销售转化率偏低。建议将新增订单、客户回款及发运安排列为本周最高优先级。",
    action: "建议行动",
    actionText: "制定库存清理计划，明确每日装车目标，并按客户跟踪销量、回款和交付日期。",
    cumulative: "累计计划与实际产量",
    cumulativeSub: "用于识别项目进度偏差和预计完工趋势",
    plan: "计划",
    actual: "实际",
    daily: "各工序日产量",
    dailySub: "分组显示酸洗、轧制和镀锌，以便识别瓶颈",
    pickling: "酸洗",
    rolling: "轧制",
    salesInventory: "产量、销售与库存",
    salesInventorySub: "从产成品到销售和待发库存的管理视图",
    produced: "已生产",
    ready: "待发库存",
    operations: "交付与运营状态",
    loading: "正在装车",
    zinc: "剩余锌及锌合金",
    yield: "镀锌工序良率",
    status: "项目状态",
    attention: "需要重点关注",
    details: "详细数据",
    detailsHint: "技术明细保留在原仪表板中，本页面仅展示管理决策所需信息。",
  },
  en: {
    title: "AKA 2000MT Executive Dashboard",
    subtitle: "Management summary of production, sales, inventory and delivery",
    executive: "Executive summary",
    updated: "Report date",
    progress: "Project completion",
    galvanized: "Galvanized output",
    sold: "Sales volume",
    conversion: "Sales conversion",
    inventory: "Finished inventory",
    trucks: "Estimated trucks",
    ton: "ton",
    vehicles: "trucks",
    risk: "Main risk",
    riskText:
      "Finished inventory is high while sales conversion remains low. New orders, collection and shipment should be this week's highest priority.",
    action: "Recommended action",
    actionText:
      "Set an inventory clearance plan, define a daily truck target, and track sales, collection and delivery dates by customer.",
    cumulative: "Cumulative plan vs actual",
    cumulativeSub: "Progress variance and projected completion trend",
    plan: "Plan",
    actual: "Actual",
    daily: "Daily output by process",
    dailySub: "Grouped stages make production bottlenecks visible",
    pickling: "Pickling",
    rolling: "Rolling",
    salesInventory: "Production, sales and inventory",
    salesInventorySub: "Management view from finished output to sold and ready stock",
    produced: "Produced",
    ready: "Ready stock",
    operations: "Delivery and operational status",
    loading: "Under loading",
    zinc: "Zinc & Zamak remaining",
    yield: "Galvanizing yield",
    status: "Project status",
    attention: "Needs attention",
    details: "Detailed data",
    detailsHint:
      "Technical detail remains available in the original dashboard; this view is limited to management decisions.",
  },
  fa: {
    title: "داشبورد اجرایی پروژه ۲۰۰۰ تن آکا",
    subtitle: "خلاصه مدیریتی تولید، فروش، موجودی و تحویل",
    executive: "خلاصه مدیریتی",
    updated: "تاریخ گزارش",
    progress: "پیشرفت پروژه",
    galvanized: "تولید گالوانیزه",
    sold: "مقدار فروش",
    conversion: "نرخ تبدیل فروش",
    inventory: "موجودی محصول",
    trucks: "کامیون موردنیاز",
    ton: "تن",
    vehicles: "دستگاه",
    risk: "ریسک اصلی",
    riskText:
      "موجودی محصول نهایی بالاست و نرخ تبدیل فروش پایین مانده است. سفارش‌گیری، وصول و برنامه حمل باید اولویت اصلی این هفته باشد.",
    action: "اقدام پیشنهادی",
    actionText:
      "برنامه تخلیه موجودی، هدف روزانه بارگیری و پیگیری فروش، وصول و تاریخ تحویل هر مشتری تعیین شود.",
    cumulative: "برنامه تجمعی در برابر عملکرد",
    cumulativeSub: "نمایش انحراف پیشرفت و روند تکمیل پروژه",
    plan: "برنامه",
    actual: "واقعی",
    daily: "تولید روزانه مراحل",
    dailySub: "نمایش گروهی مراحل برای شناسایی گلوگاه",
    pickling: "اسیدشویی",
    rolling: "نورد",
    salesInventory: "تولید، فروش و موجودی",
    salesInventorySub: "نمای مدیریتی از محصول تولیدشده تا فروش و موجودی آماده",
    produced: "تولیدشده",
    ready: "آماده ارسال",
    operations: "وضعیت تحویل و عملیات",
    loading: "در حال بارگیری",
    zinc: "روی و زاماک باقیمانده",
    yield: "راندمان گالوانیزه",
    status: "وضعیت پروژه",
    attention: "نیازمند توجه",
    details: "اطلاعات تفصیلی",
    detailsHint:
      "جزئیات فنی در داشبورد اصلی حفظ شده و این صفحه فقط اطلاعات تصمیم‌گیری مدیریت را نمایش می‌دهد.",
  },
} as const;

const n0 = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 0 });
const n1 = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });

function ExecutiveDashboard() {
  const [lang, setLang] = useState<Lang>("zh");
  const t = copy[lang];
  const rtl = lang === "fa";
  const projectTarget = 2000;
  const progress = (report.totals.galvanized / projectTarget) * 100;
  const conversion = (report.totals.sold / report.totals.galvanized) * 100;
  const trucks = Math.ceil(report.transport.readyWarehouse / 25);
  const galvYield = report.yields.find((item) => item.process === "Galvanizing Yield")?.value ?? 0;

  const daily = useMemo(
    () =>
      report.daily.slice(-18).map((row) => ({
        date: row.date.slice(5),
        pickling: typeof row.pickling === "number" ? row.pickling : 0,
        rolling: typeof row.rolling === "number" ? row.rolling : 0,
        galvanized: typeof row.galv === "number" ? row.galv : 0,
      })),
    [],
  );

  const cumulative = useMemo(() => {
    const rows = report.cumulative;
    return rows.map((row, index) => ({
      date: row.date.slice(5),
      actual: typeof row.galv === "number" ? row.galv : 0,
      plan: Math.min(projectTarget, ((index + 1) / rows.length) * projectTarget),
    }));
  }, []);

  const flow = [
    { name: t.produced, value: report.totals.galvanized, fill: "var(--color-chart-2)" },
    { name: t.sold, value: report.totals.sold, fill: "var(--color-chart-4)" },
    { name: t.ready, value: report.transport.readyWarehouse, fill: "var(--color-chart-1)" },
  ];

  const cards = [
    { label: t.progress, value: `${n1(progress)}%`, icon: Factory, tone: "text-chart-2" },
    {
      label: t.galvanized,
      value: n0(report.totals.galvanized),
      unit: t.ton,
      icon: PackageCheck,
      tone: "text-primary",
    },
    {
      label: t.sold,
      value: n0(report.totals.sold),
      unit: t.ton,
      icon: ShoppingCart,
      tone: "text-chart-4",
    },
    {
      label: t.conversion,
      value: `${n1(conversion)}%`,
      icon: AlertTriangle,
      tone: "text-destructive",
    },
    {
      label: t.inventory,
      value: n0(report.transport.readyWarehouse),
      unit: t.ton,
      icon: PackageCheck,
      tone: "text-accent",
    },
    { label: t.trucks, value: n0(trucks), unit: t.vehicles, icon: Truck, tone: "text-chart-2" },
  ];

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      dir={rtl ? "rtl" : "ltr"}
      lang={lang}
    >
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-7">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" /> {t.executive}
            </div>
            <h1 className="text-2xl font-semibold md:text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">{t.updated}</p>
              <p className="mt-0.5 font-semibold tabular-nums" dir="ltr">
                {report.reportDate}
              </p>
            </div>
            <div className="flex rounded-lg border border-border bg-secondary/40 p-1">
              {(["zh", "en", "fa"] as Lang[]).map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${lang === code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {code === "zh" ? "中文" : code === "en" ? "EN" : "فارسی"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {cards.map(({ label, value, unit, icon: Icon, tone }) => (
            <article
              key={label}
              className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className={`h-4 w-4 shrink-0 ${tone}`} />
              </div>
              <p className={`mt-3 text-2xl font-semibold tabular-nums ${tone}`} dir="ltr">
                {value}
              </p>
              {unit && <p className="mt-1 text-xs text-muted-foreground">{unit}</p>}
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <h2 className="font-semibold text-destructive">{t.risk}</h2>
                <p className="mt-2 text-sm leading-6 text-foreground">{t.riskText}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-semibold text-primary">{t.action}</h2>
                <p className="mt-2 text-sm leading-6 text-foreground">{t.actionText}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-semibold">{t.cumulative}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t.cumulativeSub}</p>
          <div className="mt-5 h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulative}>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis dataKey="date" fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--color-muted-foreground)" />
                <Tooltip />
                <Legend />
                <Line
                  dataKey="plan"
                  name={t.plan}
                  stroke="var(--color-muted-foreground)"
                  strokeDasharray="6 4"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  dataKey="actual"
                  name={t.actual}
                  stroke="var(--color-chart-1)"
                  dot={false}
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-semibold">{t.daily}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.dailySub}</p>
            <div className="mt-5 h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily}>
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis dataKey="date" fontSize={10} stroke="var(--color-muted-foreground)" />
                  <YAxis fontSize={11} stroke="var(--color-muted-foreground)" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="pickling"
                    name={t.pickling}
                    fill="var(--color-chart-2)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="rolling"
                    name={t.rolling}
                    fill="var(--color-chart-4)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="galvanized"
                    name={t.galvanized}
                    fill="var(--color-chart-1)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-semibold">{t.salesInventory}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.salesInventorySub}</p>
            <div className="mt-5 h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flow} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis type="number" fontSize={11} stroke="var(--color-muted-foreground)" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    fontSize={11}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip />
                  <Bar dataKey="value" name={t.ton} radius={[0, 6, 6, 0]}>
                    {flow.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{t.operations}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t.detailsHint}</p>
            </div>
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              {t.status}: {t.attention}
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Metric label={t.loading} value={`${n1(report.transport.underLoading)} ${t.ton}`} />
            <Metric label={t.zinc} value={`${n1(report.zincRemaining)} ${t.ton}`} />
            <Metric label={t.yield} value={`${n1(galvYield * 100)}%`} />
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums" dir="ltr">
        {value}
      </p>
    </div>
  );
}
