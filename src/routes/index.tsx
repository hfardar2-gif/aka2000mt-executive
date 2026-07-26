import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { FileText, Languages, MessageSquare, Moon, Printer, Sun, X } from "lucide-react";
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
import report from "@/data/report.json";
import { StatCard } from "@/components/dashboard/StatCard";
import { Section } from "@/components/dashboard/Section";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AKA Project Report — Production Dashboard" },
      {
        name: "description",
        content:
          "Live management dashboard for the AKA galvanizing project: production, yields, inventory, sales and planning.",
      },
      { property: "og:title", content: "AKA Project Report" },
      {
        property: "og:description",
        content: "Production, yield, coil inventory, warehouse and sales overview for the AKA project.",
      },
    ],
  }),
  component: Index,
});

const fmt = (n: number | null | undefined, digits = 2) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—";

const fmt0 = (n: number | null | undefined) =>
  typeof n === "number" ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—";

const fmtRial = (value: unknown) => {
  const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(parsed) || parsed === 0) return "—";
  if (parsed >= 1e9) return `${(parsed / 1e9).toFixed(2)} B`;
  if (parsed >= 1e6) return `${(parsed / 1e6).toFixed(2)} M`;
  return parsed.toLocaleString("en-US");
};

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

type Lang = "en" | "zh" | "fa";
type CoilInventoryRow = {
  thickness: number | string;
  width: number | string;
  tonnage: number;
};
type LocalizedText = string | Partial<Record<Lang, string>> & { note?: string };

const localizedText = (value: unknown, lang: Lang) => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  const text = value as Partial<Record<Lang, unknown>> & { note?: unknown };
  const selected = text[lang];
  const fallback = text.en ?? text.fa ?? text.zh ?? text.note;
  return typeof selected === "string" ? selected : typeof fallback === "string" ? fallback : "";
};

const noteTranslations: Record<Exclude<Lang, "en">, string[]> = {
  fa: [
    "۱. هر کویل گالوانیزهٔ تولیدشده، بلافاصله در برنامهٔ فروش و ارسال قرار می‌گیرد.",
    "۲. هزینهٔ بارنامه‌های حمل از بندر تا کارخانه، بهای روی و زاماک، هزینهٔ ۲٫۵ درصدی انبار متروکه و باقی‌ماندهٔ حق‌العمل ترخیص‌کار، در برابر فاکتورهای رسمی و از محل فروش ۱۵۰ تن محصول گالوانیزه (HDG) توسط فولاد دشتستان تسویه خواهد شد. برای جزئیات به جدول گزارش فروش مورخ ۲۰۲۶-۰۵-۱۷ مراجعه شود.",
    "۳. به‌علت تکمیل ظرفیت انبار محصولات، برنامهٔ تولید تحت تأثیر قرار گرفته است. با آزادشدن هر میزان از فضای انبار، تولید گالوانیزه از سر گرفته خواهد شد.",
    "۴. پس از گفت‌وگوهای گسترده، پیگیری‌های مکرر و تأکید بر جداسازی کویل‌های تولیدی ما، بخشی اختصاصی از سالن تولید برش رسماً به‌عنوان انبار ویژهٔ کویل‌های تولیدی شرکت آکا تعیین شد.",
    "۵. برای تأمین ۱۴۰ میلیارد ریال هزینهٔ ترخیص و حمل ۴۶ کویل HRC موجود در گمرک، فولاد دشتستان در مجموع ۸۲ تن کویل گالوانیزه (GLC) فروخت و درآمد حاصل را به‌طور کامل صرف تسویهٔ هزینه‌های یادشده کرد.",
    "۶. با توجه به محدودیت ظرفیت انبار، برنامه‌ریزی تولید پروژهٔ آکا به‌صورت روزانه انجام می‌شود. تولید متناسب با فضای موجود، مرحله‌به‌مرحله پیش خواهد رفت و سرعت آن برای بهینه‌سازی موجودی، جلوگیری از ازدحام انبار و تداوم پایدار فعالیت‌های تولیدی پیوسته تنظیم خواهد شد.",
    "۷. مطابق پیش‌فاکتور فروش صادرشده، ۲۸۴ تن محصول برای شرکت گالوانیزه تهران رزرو و آمادهٔ ارسال است. ارسال پس از دریافت وجه انجام می‌شود. وزن دقیق محموله تا پایان بارگیری و تأیید باسکول، موقت تلقی می‌شود و ارقام نهایی بلافاصله پس از اتمام بارگیری ثبت و تأیید خواهد شد.",
  ],
  zh: [
    "1. 每卷生产完成的镀锌卷都会立即纳入销售和发运计划。",
    "2. 从港口到工厂的运输单费用、锌和扎马克合金费用、2.5%的弃置仓储费以及剩余报关代理费，将依据正式发票，通过Foolad Dashtestan销售150公吨镀锌产品（HDG）的款项结算。详情请参阅2026-05-17销售报告表。",
    "3. 由于产品仓库已满，生产计划受到影响。仓库一旦腾出任何空间，即恢复镀锌生产。",
    "4. 经过充分协商、多次跟进，并严格要求将我方生产卷材分区存放后，切割生产车间内的一处专用区域已正式划定为AKA公司生产卷材的独立仓库。",
    "5. 为支付海关存放的46卷HRC卷材所产生的报关及运输费用（共计1,400亿里亚尔），Foolad Dashtestan销售了82公吨镀锌卷（GLC）；销售收入已全部用于结清上述费用。",
    "6. 鉴于仓储容量受限，AKA项目将实行每日生产计划。生产将根据可用仓储空间逐步推进，并持续调节生产节奏，以优化库存、避免仓库拥堵并确保生产活动持续稳定。",
    "7. 根据已开具的销售形式发票，284公吨产品已为Tehran Galvanize Company预留并可随时发运。收到货款后安排发运。在装货及地磅核验全部完成前，准确货重均为暂定值；装货结束后将立即更新并确认最终数据。",
  ],
};

const noteText = (value: LocalizedText, index: number, lang: Lang) => {
  if (typeof value !== "string") return localizedText(value, lang);
  return lang === "en" ? value : noteTranslations[lang][index] ?? value;
};

const translations: Record<string, Record<Lang, string>> = {
  badge: { en: "Management Report", zh: "管理报告", fa: "گزارش مدیریتی" },
  title: { en: "AKA Project Report", zh: "AKA 项目报告", fa: "گزارش پروژه آکا" },
  subtitle: {
    en: "Cumulative production, yield, coil inventory, warehouse balance, sales and planning for the galvanizing line.",
    zh: "镀锌生产线的累计产量、良率、卷材库存、仓库、销售与计划。",
    fa: "تولید تجمعی، راندمان، موجودی کویل‌ها، موجودی انبار، فروش و برنامه‌ریزی خط گالوانیزه.",
  },
  reportDate: { en: "Report date", zh: "报告日期", fa: "تاریخ گزارش" },
  version: { en: "Version", zh: "版本", fa: "نسخه" },
  statusOk: { en: "Status: Success", zh: "状态：成功", fa: "وضعیت: موفق" },
  statusFail: { en: "Status: Failed", zh: "状态：失败", fa: "وضعیت: ناموفق" },
  lastUpdated: { en: "Last updated:", zh: "最后更新：", fa: "آخرین به‌روزرسانی:" },
  inputCoils: { en: "Input Coil Tonnage", zh: "输入卷材吨位", fa: "تناژ کویل‌های ورودی" },
  inputCoilCount: { en: "Input Coil Count", zh: "输入卷材数量", fa: "تعداد کویل‌های ورودی" },
  pickling: { en: "Pickling", zh: "酸洗", fa: "اسیدشویی" },
  rolling: { en: "Rolling", zh: "轧制", fa: "نورد" },
  galvanized: { en: "Galvanized", zh: "镀锌", fa: "گالوانیزه" },
  sold: { en: "Sold", zh: "已售", fa: "فروش رفته" },
  readyToShip: { en: "Ready to ship", zh: "待发货", fa: "آماده ارسال" },
  ton: { en: "ton", zh: "吨", fa: "تن" },
  coils: { en: "coils", zh: "卷", fa: "کویل" },
  coilInventory: { en: "Coil Inventory", zh: "卷材库存", fa: "موجودی کویل‌ها" },
  coilInventorySub: {
    en: "Available coils by thickness and width",
    zh: "按厚度和宽度统计的可用卷材",
    fa: "کویل‌های موجود به تفکیک ضخامت و عرض",
  },
  noCoilInventory: {
    en: "No coil inventory has been entered yet.",
    zh: "尚未录入卷材库存。",
    fa: "هنوز موجودی کویلی ثبت نشده است.",
  },
  thickness: { en: "Thickness (mm)", zh: "厚度（毫米）", fa: "ضخامت (میلی‌متر)" },
  width: { en: "Width (mm)", zh: "宽度（毫米）", fa: "عرض (میلی‌متر)" },
  availableTonnage: { en: "Available tonnage", zh: "可用吨位", fa: "تناژ موجود" },
  yields: { en: "Process Yields", zh: "工序良率", fa: "راندمان فرآیند" },
  yieldsSub: { en: "Efficiency across each stage of the line", zh: "各工序效率", fa: "بازده در هر مرحله از خط" },
  dailyProd: { en: "Daily Production", zh: "每日产量", fa: "تولید روزانه" },
  dailyProdSub: { en: "Ton per day by process", zh: "按工序每日吨数", fa: "تن در روز به تفکیک فرآیند" },
  cumProd: { en: "Cumulative Production", zh: "累计产量", fa: "تولید تجمعی" },
  cumProdSub: { en: "Running totals across the project", zh: "项目累计总量", fa: "مجموع تجمعی پروژه" },
  planVsActual: { en: "Plan vs Actual Production", zh: "计划与实际产量", fa: "مقایسه برنامه با تولید واقعی" },
  planVsActualSub: {
    en: "Planned tonnage versus delivered tonnage per plan entry",
    zh: "各计划项的计划吨位与实际完成对比",
    fa: "تناژ برنامه‌ریزی‌شده در برابر تناژ تحقق‌یافته برای هر ردیف برنامه",
  },
  planned: { en: "Planned", zh: "计划", fa: "برنامه‌ریزی‌شده" },
  actual: { en: "Actual", zh: "实际", fa: "واقعی" },
  delta: { en: "Variance", zh: "偏差", fa: "اختلاف" },
  totalPlanned: { en: "Total planned", zh: "计划总量", fa: "مجموع برنامه" },
  totalActual: { en: "Total actual", zh: "实际总量", fa: "مجموع واقعی" },
  achievement: { en: "Achievement", zh: "完成率", fa: "درصد تحقق" },
  warehouse: { en: "Warehouse & WIP", zh: "仓库与在制品", fa: "انبار و کالای در جریان" },
  warehouseSub: { en: "Stocks held in process", zh: "在产库存", fa: "موجودی در فرآیند" },
  matBal: { en: "Material Balance", zh: "物料平衡", fa: "بالانس مواد" },
  matBalSub: { en: "Factory input versus output, WIP and scrap", zh: "进料与出料、在制品和废料", fa: "ورودی کارخانه در برابر خروجی، WIP و ضایعات" },
  scrap: { en: "Scrap by Line", zh: "各线废料", fa: "ضایعات هر خط" },
  scrapSub: { en: "Spira and scrap totals", zh: "螺旋与废料合计", fa: "مجموع اسپیرا و ضایعات" },
  coating: { en: "Coating Weight Consumed (Zinc & Zamak)", zh: "镀层消耗（锌与扎马克）", fa: "وزن پوشش مصرفی (روی و زاماک)" },
  coatingSub: { en: "Theoretical versus actual coating", zh: "理论与实际镀层", fa: "پوشش نظری در برابر واقعی" },
  produced: { en: "Produced (ton)", zh: "产量（吨）", fa: "تولید (تن)" },
  theoZn: { en: "Theoretical Zn (kg)", zh: "理论锌（千克）", fa: "روی نظری (کیلوگرم)" },
  dross: { en: "Dross (kg)", zh: "渣损（千克）", fa: "سرباره (کیلوگرم)" },
  actualCoating: { en: "Actual coating (kg)", zh: "实际镀层（千克）", fa: "پوشش واقعی (کیلوگرم)" },
  zincPurchased: { en: "Zinc & Zamak purchased", zh: "已采购锌与扎马克", fa: "روی و زاماک خریداری‌شده" },
  remaining: { en: "Remaining", zh: "剩余", fa: "باقیمانده" },
  kpis: { en: "Zinc Performance KPIs", zh: "锌性能指标", fa: "شاخص‌های عملکرد روی" },
  kpisSub: { en: "Efficiency and productivity benchmarks", zh: "效率和生产力基准", fa: "معیارهای بازده و بهره‌وری" },
  category: { en: "Category", zh: "类别", fa: "دسته‌بندی" },
  kpi: { en: "KPI", zh: "指标", fa: "شاخص" },
  value: { en: "Value", zh: "数值", fa: "مقدار" },
  unit: { en: "Unit", zh: "单位", fa: "واحد" },
  industryStd: { en: "Industry Standard", zh: "行业标准", fa: "استاندارد صنعت" },
  catPerf: { en: "Performance", zh: "性能", fa: "عملکرد" },
  catProd: { en: "Productivity", zh: "生产力", fa: "بهره‌وری" },
  kpiZnEff: { en: "Zinc Efficiency", zh: "锌效率", fa: "بازده روی" },
  kpiZnLoss: { en: "Zinc Loss Rate", zh: "锌损失率", fa: "نرخ تلفات روی" },
  kpiZnInt: { en: "Zinc Intensity", zh: "锌强度", fa: "شدت مصرف روی" },
  kpiSteelPerZn: { en: "Steel Production per Zinc Consumption", zh: "单位锌消耗钢产量", fa: "تولید فولاد به ازای مصرف روی" },
  sales: { en: "Sales Report", zh: "销售报告", fa: "گزارش فروش" },
  salesSub: { en: "Buyer transactions", zh: "买方交易", fa: "تراکنش‌های خریداران" },
  date: { en: "Date", zh: "日期", fa: "تاریخ" },
  buyer: { en: "Buyer", zh: "买方", fa: "خریدار" },
  tonnage: { en: "Tonnage", zh: "吨位", fa: "تناژ" },
  amount: { en: "Amount (rial)", zh: "金额（里亚尔）", fa: "مبلغ (ریال)" },
  transport: { en: "Transport", zh: "运输", fa: "حمل‌ونقل" },
  transportSub: { en: "Loading status", zh: "装载状态", fa: "وضعیت بارگیری" },
  underLoading: { en: "Under loading", zh: "装载中", fa: "در حال بارگیری" },
  readyWarehouse: { en: "Ready in warehouse", zh: "仓库待发", fa: "آماده در انبار" },
  transportNote: {
    en: "Under-loading capacity must be at least 25 ton to enable delivery to the buyer.",
    zh: "装载量需至少 25 吨方可交付买方。",
    fa: "ظرفیت بارگیری باید حداقل ۲۵ تن باشد تا تحویل به خریدار ممکن شود.",
  },
  plan: { en: "Production Plan", zh: "生产计划", fa: "برنامه تولید" },
  planSub: { en: "Weekly plan and execution status", zh: "周计划及执行状态", fa: "برنامه هفتگی و وضعیت اجرا" },
  tons: { en: "Tons", zh: "吨", fa: "تن" },
  status: { en: "Status", zh: "状态", fa: "وضعیت" },
  scheduled: { en: "Scheduled", zh: "计划中", fa: "برنامه‌ریزی‌شده" },
  notes: { en: "Notes", zh: "备注", fa: "یادداشت‌ها" },
  notesSub: { en: "Decisions and remarks", zh: "决策与说明", fa: "تصمیمات و توضیحات" },
  print: { en: "Print PDF", zh: "打印 PDF", fa: "چاپ PDF" },
  theme: { en: "Theme", zh: "主题", fa: "تم" },
  loadOk: { en: "Data loaded successfully", zh: "数据加载成功", fa: "داده‌ها با موفقیت بارگذاری شد" },
  copyright: {
    en: "Designed and developed by Eng. Hamid Reza Fardar · Copyright © 2026, all rights reserved.",
    zh: "由 Hamid Reza Fardar 工程师设计与开发 · 版权所有 © 2026。",
    fa: "طراح و سازنده مهندس حمیدرضا فاردار · کپی‌رایت برای سازنده محفوظ است ۲۰۲۶",
  },
  projectAnalysis: { en: "Project Analysis", zh: "项目分析", fa: "تحلیل پروژه" },
  noAnalysis: { en: "No project analysis has been entered.", zh: "尚未输入项目分析。", fa: "هیچ تحلیل پروژه‌ای وارد نشده است." },
  mgmtCommentary: { en: "Management Commentary", zh: "管理层评论", fa: "تفسیر مدیریتی" },
  noComment: { en: "No comment provided.", zh: "未提供评论。", fa: "توضیحی ارائه نشده است." },
  noCommentary: { en: "No management commentary has been entered.", zh: "尚未输入管理层评论。", fa: "هیچ تفسیر مدیریتی وارد نشده است." },
  mcOverall: { en: "Overall Project Status", zh: "项目总体状态", fa: "وضعیت کلی پروژه" },
  mcProduction: { en: "Production Status", zh: "生产状态", fa: "وضعیت تولید" },
  mcSales: { en: "Sales Status", zh: "销售状态", fa: "وضعیت فروش" },
  mcInventory: { en: "Inventory Status", zh: "库存状态", fa: "وضعیت موجودی" },
  mcKeyNote: { en: "Key Management Note", zh: "关键管理说明", fa: "نکته کلیدی مدیریتی" },
  close: { en: "Close", zh: "关闭", fa: "بستن" },
};

const dataTr: Record<string, Record<Lang, string>> = {
  Unpickled: { en: "Unpickled", zh: "未酸洗", fa: "اسیدشویی نشده" },
  Pickled: { en: "Pickled", zh: "已酸洗", fa: "اسیدشویی شده" },
  Rolled: { en: "Rolled", zh: "已轧制", fa: "نورد شده" },
  Rolling: { en: "Rolling", zh: "轧制", fa: "نورد" },
  Galvanizing: { en: "Galvanizing", zh: "镀锌", fa: "گالوانیزه" },
  "Pickling Yield": { en: "Pickling Yield", zh: "酸洗良率", fa: "راندمان اسیدشویی" },
  "Rolling Yield": { en: "Rolling Yield", zh: "轧制良率", fa: "راندمان نورد" },
  "Galvanizing Yield": { en: "Galvanizing Yield", zh: "镀锌良率", fa: "راندمان گالوانیزه" },
  "Coil to Coil Yield": { en: "Coil to Coil Yield", zh: "卷到卷良率", fa: "راندمان کویل به کویل" },
  "Factory Input": { en: "Factory Input", zh: "工厂输入", fa: "ورودی کارخانه" },
  "Final Product": { en: "Final Product", zh: "最终产品", fa: "محصول نهایی" },
  "Warehouse + WIP": { en: "Warehouse + WIP", zh: "仓库 + 在制品", fa: "انبار + کالای در جریان" },
  "Warehouse + WIP − Sold": { en: "Warehouse + WIP − Sold", zh: "仓库 + 在制品 − 已售", fa: "انبار + WIP − فروش رفته" },
  "Ready to ship": { en: "Ready to ship", zh: "待发货", fa: "آماده ارسال" },
  "Total Scrap": { en: "Total Scrap", zh: "总废料", fa: "کل ضایعات" },
  "AKA Technical Representative": { en: "AKA Technical Representative", zh: "AKA 技术代表", fa: "نماینده فنی آکا" },
};

const dt = (value: string, lang: Lang) => dataTr[value]?.[lang] ?? value;

function Index() {
  const totals = report.totals;
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showCommentary, setShowCommentary] = useState(false);
  const tr = (key: string) => translations[key]?.[lang] ?? key;

  useEffect(() => {
    const savedLang = (localStorage.getItem("lang") as Lang | null) ?? "en";
    const savedTheme = (localStorage.getItem("theme") as "dark" | "light" | null) ?? "light";
    setLang(savedLang);
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
  }, [lang]);

  const loadStatus = {
    ok: Boolean(report?.totals && Array.isArray(report.daily)),
    message: tr("loadOk"),
  };

  const lastUpdate = report.reportDate
    ? new Date(report.reportDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const dailyNumeric = report.daily.map((row) => ({
    date: row.date.slice(5),
    pickling: typeof row.pickling === "number" ? row.pickling : 0,
    rolling: typeof row.rolling === "number" ? row.rolling : 0,
    galv: typeof row.galv === "number" ? row.galv : 0,
  }));

  const cumulativeNumeric = report.cumulative.map((row) => ({
    date: row.date.slice(5),
    pickling: typeof row.pickling === "number" ? row.pickling : null,
    rolling: typeof row.rolling === "number" ? row.rolling : null,
    galv: typeof row.galv === "number" ? row.galv : null,
  }));

  const planVsActual = report.plan.map((item) => {
    const planned = item.tons ?? 0;
    const actual = /complete/i.test(item.status ?? "") ? planned : 0;
    return { date: item.date, planned, actual };
  });
  const totalPlanned = planVsActual.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = planVsActual.reduce((sum, item) => sum + item.actual, 0);
  const achievementPct = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

  const coilInventory = (((report as unknown as Record<string, unknown>).coilInventory ?? []) as CoilInventoryRow[]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="no-print sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-2 px-6 py-2">
          <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 p-1">
            <Languages className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
            {(["en", "zh", "fa"] as Lang[]).map((option) => (
              <button
                key={option}
                onClick={() => setLang(option)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  lang === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option === "en" ? "EN" : option === "zh" ? "中文" : "فارسی"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 text-xs font-medium text-foreground hover:bg-secondary"
            title={tr("theme")}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Printer className="h-3.5 w-3.5" />
            {tr("print")}
          </button>
          <button
            onClick={() => setShowAnalysis(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <FileText className="h-3.5 w-3.5" />
            {tr("projectAnalysis")}
          </button>
          <button
            onClick={() => setShowCommentary(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {tr("mgmtCommentary")}
          </button>
        </div>
      </div>

      <header className="border-b border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                {tr("badge")}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{tr("title")}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{tr("subtitle")}</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{tr("reportDate")}</p>
                <p className="font-semibold tabular-nums">{lastUpdate}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{tr("version")}</p>
                <p className="font-semibold tabular-nums">v{report.version}</p>
              </div>
            </div>
          </div>
          <div
            className={`mt-6 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              loadStatus.ok ? "border-primary/30 bg-primary/10" : "border-destructive/40 bg-destructive/10"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${loadStatus.ok ? "animate-pulse bg-primary" : "bg-destructive"}`} />
            <span className="font-medium">{loadStatus.ok ? tr("statusOk") : tr("statusFail")}</span>
            <span className="text-muted-foreground">· {loadStatus.message}</span>
            <span className="text-muted-foreground">
              · {tr("lastUpdated")} <span className="font-semibold text-foreground">{lastUpdate}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
          <StatCard label={tr("inputCoils")} value={fmt(totals.inputCoilsTon, 0)} unit={tr("ton")} />
          <StatCard label={tr("inputCoilCount")} value={fmt0(totals.inputCoilsQty)} unit={tr("coils")} accent="accent" />
          <StatCard label={tr("pickling")} value={fmt(totals.pickling, 0)} unit={tr("ton")} accent="chart-2" />
          <StatCard label={tr("rolling")} value={fmt(totals.rolling, 0)} unit={tr("ton")} accent="chart-4" />
          <StatCard label={tr("galvanized")} value={fmt(totals.galvanized, 0)} unit={tr("ton")} accent="primary" />
          <StatCard label={tr("sold")} value={fmt(totals.sold, 0)} unit={tr("ton")} accent="accent" />
          <StatCard label={tr("readyToShip")} value={fmt(report.transport.readyWarehouse, 0)} unit={tr("ton")} accent="chart-2" />
        </div>

        <Section title={tr("coilInventory")} subtitle={tr("coilInventorySub")}>
          {coilInventory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">{tr("thickness")}</th>
                    <th className="py-3 pr-4 font-medium">{tr("width")}</th>
                    <th className="py-3 text-right font-medium">{tr("availableTonnage")}</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {coilInventory.map((row, index) => (
                    <tr key={`${row.thickness}-${row.width}-${index}`} className="border-b border-border/60 hover:bg-secondary/30">
                      <td className="py-3 pr-4 font-medium text-foreground">{row.thickness}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.width}</td>
                      <td className="py-3 text-right font-semibold text-primary">
                        {fmt(Number(row.tonnage))} <span className="text-xs text-muted-foreground">{tr("ton")}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-5 text-sm italic text-muted-foreground">
              {tr("noCoilInventory")}
            </p>
          )}
        </Section>

        <Section title={tr("yields")} subtitle={tr("yieldsSub")}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {report.yields.map((item) => {
              const percentage = item.value * 100;
              return (
                <div key={item.process} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-sm font-medium text-foreground">{dt(item.process, lang)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.formula}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tabular-nums text-primary">{percentage.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(percentage, 100)}%`, background: "var(--gradient-primary)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title={tr("dailyProd")} subtitle={tr("dailyProdSub")}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyNumeric}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="pickling" stackId="a" fill="var(--color-chart-2)" name={tr("pickling")} />
                  <Bar dataKey="rolling" stackId="a" fill="var(--color-chart-4)" name={tr("rolling")} />
                  <Bar dataKey="galv" stackId="a" fill="var(--color-chart-1)" name={tr("galvanized")} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <Section title={tr("cumProd")} subtitle={tr("cumProdSub")}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeNumeric}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="pickling" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} name={tr("pickling")} connectNulls />
                  <Line type="monotone" dataKey="rolling" stroke="var(--color-chart-4)" strokeWidth={2} dot={false} name={tr("rolling")} connectNulls />
                  <Line type="monotone" dataKey="galv" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={false} name={tr("galvanized")} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>

        <Section title={tr("planVsActual")} subtitle={tr("planVsActualSub")}>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <SummaryValue label={tr("totalPlanned")} value={`${fmt0(totalPlanned)} ${tr("ton")}`} />
            <SummaryValue label={tr("totalActual")} value={`${fmt0(totalActual)} ${tr("ton")}`} highlight />
            <SummaryValue label={tr("achievement")} value={`${achievementPct.toFixed(1)} %`} />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planVsActual}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="planned" fill="var(--color-chart-4)" name={tr("planned")} radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="var(--color-chart-1)" name={tr("actual")} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title={tr("plan")} subtitle={tr("planSub")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">{tr("date")}</th>
                  <th className="py-3 pr-4 font-medium">{tr("thickness")}</th>
                  <th className="py-3 pr-4 font-medium">{tr("width")}</th>
                  <th className="py-3 pr-4 text-right font-medium">{tr("tons")}</th>
                  <th className="py-3 font-medium">{tr("status")}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {report.plan.map((item, index) => (
                  <tr key={index} className="border-b border-border/60 hover:bg-secondary/30">
                    <td className="py-3 pr-4 font-medium">{item.date}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{item.thickness}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{item.width}</td>
                    <td className="py-3 pr-4 text-right font-semibold">{item.tons}</td>
                    <td className="py-3 text-muted-foreground">{dt(item.status || "Scheduled", lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <div className="grid gap-6 lg:grid-cols-3">
          <Section title={tr("warehouse")} subtitle={tr("warehouseSub")}>
            <ul className="space-y-3">
              {report.warehouse.map((item) => (
                <li key={item.name} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <span className="text-sm">{dt(item.name, lang)}</span>
                  <span className="font-semibold tabular-nums text-primary">
                    {fmt(item.ton)} <span className="text-xs text-muted-foreground">{tr("ton")}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={tr("matBal")} subtitle={tr("matBalSub")}>
            <ul className="space-y-2">
              {report.materialBalance.map((item) => (
                <li key={item.k} className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
                  <span className="text-muted-foreground">{dt(item.k, lang)}</span>
                  <span className="font-semibold tabular-nums">{fmt(item.v)}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={tr("scrap")} subtitle={tr("scrapSub")}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.scrap.map((item) => ({ ...item, line: dt(item.line, lang) }))}
                    dataKey="ton"
                    nameKey="line"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {report.scrap.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>

        <div className="order-1">
        <Section title={tr("coating")} subtitle={tr("coatingSub")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">{tr("thickness")}</th>
                  <th className="py-3 pr-4 font-medium">{tr("width")}</th>
                  <th className="py-3 pr-4 text-right font-medium">{tr("produced")}</th>
                  <th className="py-3 pr-4 text-right font-medium">{tr("theoZn")}</th>
                  <th className="py-3 pr-4 text-right font-medium">{tr("dross")}</th>
                  <th className="py-3 text-right font-medium">{tr("actualCoating")}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {report.coating.map((item, index) => (
                  <tr key={`${item.thickness}-${index}`} className="border-b border-border/60 hover:bg-secondary/30">
                    <td className="py-3 pr-4 font-medium">{item.thickness}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{item.width}</td>
                    <td className="py-3 pr-4 text-right">{fmt(item.weight)}</td>
                    <td className="py-3 pr-4 text-right">{fmt(item.theoZn)}</td>
                    <td className="py-3 pr-4 text-right text-accent">{fmt(item.dross)}</td>
                    <td className="py-3 text-right font-semibold text-primary">{fmt(item.actual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SummaryValue label={tr("zincPurchased")} value={`${fmt(report.zincPurchased)} ${tr("ton")}`} />
            <SummaryValue label={tr("remaining")} value={`${fmt(report.zincRemaining)} ${tr("ton")}`} highlight />
          </div>
          <div className="mt-6 rounded-xl border border-border bg-secondary/20 p-4">
            <h3 className="text-sm font-semibold">{tr("kpis")}</h3>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">{tr("kpisSub")}</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">{tr("category")}</th>
                    <th className="py-2 pr-4 font-medium">{tr("kpi")}</th>
                    <th className="py-2 pr-4 text-right font-medium">{tr("value")}</th>
                    <th className="py-2 pr-4 font-medium">{tr("unit")}</th>
                    <th className="py-2 font-medium">{tr("industryStd")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { category: tr("catPerf"), name: tr("kpiZnEff"), value: "82", unit: "%", standard: "80–88%" },
                    { category: tr("catPerf"), name: tr("kpiZnLoss"), value: "18", unit: "%", standard: "15–20%" },
                    { category: tr("catProd"), name: tr("kpiZnInt"), value: "11.73", unit: "kg Zn/ton steel", standard: "10–15 kg/ton" },
                    { category: tr("catProd"), name: tr("kpiSteelPerZn"), value: "85.2", unit: "kg steel/kg Zn", standard: "80–100" },
                  ].map((item) => (
                    <tr key={item.name} className="border-b border-border/60 hover:bg-secondary/30">
                      <td className="py-2 pr-4 text-muted-foreground">{item.category}</td>
                      <td className="py-2 pr-4 font-medium">{item.name}</td>
                      <td className="py-2 pr-4 text-right font-semibold text-primary">{item.value}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{item.unit}</td>
                      <td className="py-2 text-muted-foreground">{item.standard}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section title={tr("sales")} subtitle={tr("salesSub")}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 pr-4 font-medium">{tr("date")}</th>
                      <th className="py-3 pr-4 font-medium">{tr("buyer")}</th>
                      <th className="py-3 pr-4 text-right font-medium">{tr("tonnage")}</th>
                      <th className="py-3 text-right font-medium">{tr("amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {report.sales.map((item, index) => (
                      <tr key={index} className="border-b border-border/60 hover:bg-secondary/30">
                        <td className="py-3 pr-4 text-muted-foreground">{item.date}</td>
                        <td className="py-3 pr-4 font-medium">{item.buyer}</td>
                        <td className="py-3 pr-4 text-right">{fmt(item.tonnage)}</td>
                        <td className="py-3 text-right font-semibold text-primary">{fmtRial(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
          <Section title={tr("transport")} subtitle={tr("transportSub")}>
            <div className="space-y-3">
              <SummaryValue label={tr("underLoading")} value={`${fmt(report.transport.underLoading)} ${tr("ton")}`} />
              <SummaryValue label={tr("readyWarehouse")} value={`${fmt(report.transport.readyWarehouse)} ${tr("ton")}`} highlight />
              <p className="text-xs text-muted-foreground">{tr("transportNote")}</p>
            </div>
          </Section>
        </div>

        <div className="order-2">
        <Section title={tr("notes")} subtitle={tr("notesSub")}>
          <ol className="space-y-3 text-sm">
            {report.notes.map((note, index) => (
              <li key={index} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[10px] font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{noteText(note as LocalizedText, index, lang)}</span>
              </li>
            ))}
          </ol>
        </Section>
        </div>

        <footer className="order-3 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-6 py-5 text-sm">
          <p className="text-muted-foreground">{tr("copyright")}</p>
          <div className={lang === "fa" ? "text-left" : "text-right"}>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{dt(report.signature.role, lang)}</p>
            <p className="mt-0.5 font-semibold">{report.signature.name}</p>
          </div>
        </footer>
      </main>

      {showAnalysis && (
        <Modal title={tr("projectAnalysis")} onClose={() => setShowAnalysis(false)} closeLabel={tr("close")}>
          {localizedText((report as unknown as Record<string, unknown>).projectAnalysis, lang).trim() ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {localizedText((report as unknown as Record<string, unknown>).projectAnalysis, lang)}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">{tr("noAnalysis")}</p>
          )}
        </Modal>
      )}

      {showCommentary && (
        <Modal title={tr("mgmtCommentary")} onClose={() => setShowCommentary(false)} closeLabel={tr("close")}>
          <ManagementCommentary tr={tr} lang={lang} />
        </Modal>
      )}
    </div>
  );
}

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

function SummaryValue({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "border-primary/30 bg-primary/10" : "border-border bg-secondary/30"}`}>
      <p className={`text-xs uppercase tracking-wider ${highlight ? "text-primary" : "text-muted-foreground"}`}>{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function ManagementCommentary({ tr, lang }: { tr: (key: string) => string; lang: Lang }) {
  const commentary = (((report as unknown as Record<string, unknown>).managementCommentary ?? {}) as Record<string, LocalizedText>);
  const sections = [
    { key: "overall", label: tr("mcOverall") },
    { key: "production", label: tr("mcProduction") },
    { key: "sales", label: tr("mcSales") },
    { key: "inventory", label: tr("mcInventory") },
    { key: "keyNote", label: tr("mcKeyNote") },
  ];

  if (sections.every((section) => !localizedText(commentary[section.key], lang).trim())) {
    return <p className="text-sm italic text-muted-foreground">{tr("noCommentary")}</p>;
  }

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const value = localizedText(commentary[section.key], lang).trim();
        return (
          <div key={section.key} className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-primary">{section.label}</p>
            {value ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{value}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">{tr("noComment")}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Modal({
  title,
  onClose,
  closeLabel,
  children,
}: {
  title: string;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
