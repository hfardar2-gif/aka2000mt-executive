import report from "@/data/report.json";

type Lang = "en" | "zh" | "fa";

const format = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : "—";

const safeRatio = (numerator: number, denominator: number) =>
  denominator > 0 ? (numerator / denominator) * 100 : 0;

export function SteelConversionRatios({ lang }: { lang: Lang }) {
  const { totals } = report;
  const unshippedSales = Number(report.transport.underLoading) || 0;
  const totalSold = totals.sold + unshippedSales;
  const inventory = Math.max(totals.galvanized - totalSold, 0);
  const productionToSales = safeRatio(totalSold, totals.galvanized);
  const productionToInventory = safeRatio(inventory, totals.galvanized);
  const inputToSales = safeRatio(totalSold, totals.inputCoilsTon);

  const text = {
    en: {
      title: "Commercial conversion ratios",
      subtitle: "Dynamic ratios based on the latest production, sales and inventory data",
      box1: "Production disposition",
      prodSales: "Production converted to total sales",
      prodInventory: "Production held in inventory",
      box2: "Input commercialization",
      inputSales: "Project input converted to total sold tonnage",
      note1: `${format(productionToSales)}% sold / ${format(productionToInventory)}% held in finished inventory`,
      note2: `${format(inputToSales)}% of total input has reached sold status, including unshipped sold tonnage`,
      soldLabel: "Total sold",
    },
    zh: {
      title: "商业转化比率",
      subtitle: "根据最新生产、销售及库存数据动态计算",
      box1: "产量去向",
      prodSales: "产量转为销售总量",
      prodInventory: "产量留存在成品库存",
      box2: "投入商业化",
      inputSales: "项目投入转为总销售吨位",
      note1: `${format(productionToSales)}%已售 / ${format(productionToInventory)}%留存在成品库存`,
      note2: `总投入的${format(inputToSales)}%已进入销售状态，其中包括已售未发运吨位`,
      soldLabel: "销售总量",
    },
    fa: {
      title: "نسبت‌های تبدیل تجاری",
      subtitle: "محاسبهٔ پویا بر اساس آخرین مقادیر تولید، فروش و موجودی",
      box1: "تعیین تکلیف تولید",
      prodSales: "تولید تبدیل‌شده به کل فروش",
      prodInventory: "تولید باقی‌مانده در موجودی انبار",
      box2: "تجاری‌سازی ورودی پروژه",
      inputSales: "ورودی تبدیل‌شده به کل تناژ فروش‌رفته",
      note1: `${format(productionToSales)}٪ فروش‌رفته / ${format(productionToInventory)}٪ موجودی محصول نهایی`,
      note2: `${format(inputToSales)}٪ از کل ورودی پروژه به فروش تبدیل شده است؛ تناژ حمل‌نشده نیز در فروش لحاظ شده است`,
      soldLabel: "کل فروش‌رفته",
    },
  }[lang];

  return (
    <section className="order-first col-span-full rounded-2xl border border-[#727980] bg-[#20252A] p-5 text-[#F2F4F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" dir={lang === "fa" ? "rtl" : "ltr"}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#41484E] pb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{text.title}</h2>
          <p className="mt-1 text-xs text-[#AEB5BA]">{text.subtitle}</p>
        </div>
        <span className="rounded border border-[#616970] bg-[#2B3136] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#C8CDD1]">Steel performance</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-[#4A5258] bg-[#292F34] p-5">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#AEB5BA]">{text.box1}</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[#D5D9DC]">{text.prodSales}</p>
              <p className="mt-2 text-4xl font-semibold tabular-nums text-[#B9D5E8]">{format(productionToSales)}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#424A50]"><div className="h-full rounded-full bg-[#6E9EBE] transition-[width] duration-700" style={{ width: `${Math.min(productionToSales, 100)}%` }} /></div>
            </div>
            <div>
              <p className="text-sm text-[#D5D9DC]">{text.prodInventory}</p>
              <p className="mt-2 text-4xl font-semibold tabular-nums text-[#F0A45B]">{format(productionToInventory)}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#424A50]"><div className="h-full rounded-full bg-[#D17832] transition-[width] duration-700" style={{ width: `${Math.min(productionToInventory, 100)}%` }} /></div>
            </div>
          </div>
          <p className="mt-5 border-t border-[#41484E] pt-3 text-xs leading-6 text-[#AEB5BA]">{text.note1}</p>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-[#4A5258] bg-[#292F34] p-5">
          <div className="absolute inset-y-0 start-0 w-1 bg-[#D17832]" />
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#AEB5BA]">{text.box2}</p>
          <p className="mt-5 text-sm text-[#D5D9DC]">{text.inputSales}</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-5xl font-semibold tabular-nums text-white">{format(inputToSales)}%</p>
            <p className="pb-1 text-right text-xs leading-5 text-[#AEB5BA]">{text.note2}</p>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-sm bg-[#424A50]"><div className="h-full bg-gradient-to-r from-[#6E9EBE] to-[#D17832] transition-[width] duration-700" style={{ width: `${Math.min(inputToSales, 100)}%` }} /></div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded border border-[#41484E] bg-[#242A2F] px-3 py-2 text-[#AEB5BA]">Input <strong className="float-end text-white">{totals.inputCoilsTon.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong></div>
            <div className="rounded border border-[#41484E] bg-[#242A2F] px-3 py-2 text-[#AEB5BA]">{text.soldLabel} <strong className="float-end text-white">{totalSold.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong></div>
          </div>
        </article>
      </div>
    </section>
  );
}
