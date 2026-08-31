import { useMemo, useState, type ReactNode } from "react";
import {
  Calculator,
  CheckCircle2,
  CloudUpload,
  Download,
  FileClock,
  LockKeyhole,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import reportData from "@/data/report.json";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { reportChecks, sum, type AKAProjectReport } from "@/lib/report-model";

type Tone = "info" | "success" | "error";
type Message = { tone: Tone; text: string };
type Column = { key: string; label: string; type?: "text" | "number"; readOnly?: boolean };
type Row = Record<string, any>;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0f6f8f] focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100";
const statusClass: Record<Tone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
};
const tabClass =
  "whitespace-nowrap data-[state=active]:bg-[#123b57] data-[state=active]:text-white";

async function callPublisher(body: unknown) {
  const response = await fetch("/api/publish-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
  if (!response.ok || !result.ok) throw new Error(result.message || "عملیات انتشار انجام نشد.");
  return result;
}

export function DataTransformerPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<AKAProjectReport>(() => clone(reportData) as AKAProjectReport);
  const [message, setMessage] = useState<Message | null>(null);
  const validation = useMemo(() => validateReport(data), [data]);

  const mutate = (fn: (draft: AKAProjectReport) => void) =>
    setData((current) => {
      const next = clone(current);
      fn(next);
      return next;
    });
  const setPath = (path: (string | number)[], value: unknown) =>
    mutate((draft) => {
      let cursor: any = draft;
      path.slice(0, -1).forEach((part) => {
        cursor = cursor[part];
      });
      cursor[path[path.length - 1]] = value;
    });

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await callPublisher({ action: "verify", password });
      setAuthed(true);
      setMessage({
        tone: "success",
        text: "ورود موفق بود. ابتدا داده‌ها را ویرایش و اعتبارسنجی کنید.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "رمز عبور صحیح نیست.",
      });
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = () => {
    localStorage.setItem("aka-report-draft-v2", JSON.stringify(data));
    setMessage({
      tone: "success",
      text: "پیش‌نویس فقط روی همین دستگاه ذخیره شد و هنوز منتشر نشده است.",
    });
  };
  const loadDraft = () => {
    const saved = localStorage.getItem("aka-report-draft-v2");
    if (!saved) return setMessage({ tone: "info", text: "پیش‌نویسی روی این دستگاه وجود ندارد." });
    try {
      setData(JSON.parse(saved));
      setMessage({ tone: "success", text: "پیش‌نویس بازیابی شد." });
    } catch {
      setMessage({ tone: "error", text: "پیش‌نویس قابل خواندن نیست." });
    }
  };
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aka-report-${data.reportDate || "draft"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const recalculate = () => {
    setData((current) => recalculateReport(current));
    setMessage({
      tone: "success",
      text: "مقادیر وابسته، جمع‌ها و شاخص‌های مدیریتی دوباره محاسبه شدند.",
    });
  };
  const publish = async () => {
    const issues = validateReport(data);
    if (issues.errors.length)
      return setMessage({
        tone: "error",
        text: `قبل از انتشار اصلاح شود: ${issues.errors.join(" | ")}`,
      });
    if (!window.confirm("گزارش فعلی روی سایت اصلی منتشر شود؟")) return;
    setBusy(true);
    setMessage({ tone: "info", text: "در حال انتشار گزارش نهایی…" });
    try {
      await callPublisher({ action: "publish", password, data });
      localStorage.removeItem("aka-report-draft-v2");
      setMessage({ tone: "success", text: "گزارش با موفقیت ثبت شد و انتشار سایت آغاز شده است." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "انتشار ناموفق بود.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!authed)
    return (
      <main
        dir="rtl"
        className="flex min-h-[calc(100vh-41px)] items-center justify-center bg-slate-100 p-4"
      >
        <form
          onSubmit={login}
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#123b57] text-white">
            <LockKeyhole />
          </div>
          <p className="text-xs font-bold tracking-wider text-[#0f6f8f]">AKA PROJECT REPORT</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">ورود به مدیریت داده‌ها</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            این بخش برای ویرایش و انتشار گزارش مدیریتی است.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="رمز عبور"
            autoFocus
            className={`${inputClass} mt-6`}
          />
          <button
            disabled={!password || busy}
            className="mt-3 w-full rounded-lg bg-[#123b57] py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "در حال بررسی…" : "ورود"}
          </button>
          {message && <Status message={message} />}
        </form>
      </main>
    );

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
        <header className="rounded-2xl bg-[#102f46] p-5 text-white shadow-lg md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-semibold tracking-wider text-cyan-200">
                AKA PROJECT REPORT
              </p>
              <h1 className="mt-2 text-2xl font-bold">مرکز ورود و انتشار داده‌ها</h1>
              <p className="mt-1 text-sm text-slate-300">
                ویرایش ← محاسبه ← اعتبارسنجی ← انتشار نهایی
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Action icon={<FileClock />} label="بازیابی پیش‌نویس" onClick={loadDraft} secondary />
              <Action icon={<Save />} label="ذخیره پیش‌نویس" onClick={saveDraft} secondary />
              <Action icon={<Download />} label="نسخه JSON" onClick={exportBackup} secondary />
              <Action icon={<Calculator />} label="محاسبه مجدد" onClick={recalculate} />
              <Action
                icon={<CloudUpload />}
                label={busy ? "در حال انتشار…" : "انتشار نهایی"}
                onClick={publish}
                disabled={busy}
                danger
              />
            </div>
          </div>
        </header>
        {message && <Status message={message} />}
        <ValidationPanel errors={validation.errors} warnings={validation.warnings} />

        <Tabs defaultValue="general" className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <TabsList className="h-auto min-w-max flex-wrap justify-start gap-1 bg-transparent">
              <TabsTrigger value="general" className={tabClass}>
                اطلاعات عمومی
              </TabsTrigger>
              <TabsTrigger value="production" className={tabClass}>
                تولید و انبار
              </TabsTrigger>
              <TabsTrigger value="zinc" className={tabClass}>
                روی و پوشش
              </TabsTrigger>
              <TabsTrigger value="sales" className={tabClass}>
                فروش و مالی
              </TabsTrigger>
              <TabsTrigger value="plan" className={tabClass}>
                برنامه و موجودی
              </TabsTrigger>
              <TabsTrigger value="daily" className={tabClass}>
                تولید روزانه
              </TabsTrigger>
              <TabsTrigger value="notes" className={tabClass}>
                یادداشت‌ها
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general">
            <Panel title="اطلاعات شناسنامه گزارش">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="تاریخ گزارش"
                  value={data.reportDate}
                  onChange={(v) => setPath(["reportDate"], v)}
                />
                <Field
                  label="نسخه گزارش"
                  value={data.version}
                  onChange={(v) => setPath(["version"], v)}
                />
                <Field
                  label="نام نماینده"
                  value={data.signature.name}
                  onChange={(v) => setPath(["signature", "name"], v)}
                />
                <Field
                  label="عنوان انگلیسی"
                  value={data.title.en}
                  onChange={(v) => setPath(["title", "en"], v)}
                />
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="production" className="space-y-4">
            <Panel title="مقادیر تجمعی تولید">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    ["inputCoilsTon", "تناژ کویل ورودی"],
                    ["inputCoilsQty", "تعداد کویل ورودی"],
                    ["pickling", "اسیدشویی"],
                    ["rolling", "نورد"],
                    ["galvanized", "گالوانیزه"],
                    ["sold", "فروش"],
                  ] as const
                ).map(([key, label]) => (
                  <Field
                    key={key}
                    label={label}
                    type="number"
                    value={data.totals[key]}
                    onChange={(v) => setPath(["totals", key], v)}
                  />
                ))}
              </div>
            </Panel>
            <Panel title="انبار و کالای در جریان">
              <FixedRows
                rows={data.warehouse}
                labelKey="key"
                columns={[{ key: "ton", label: "تناژ", type: "number" }]}
                onChange={(i, k, v) => setPath(["warehouse", i, k], v)}
              />
            </Panel>
            <Panel title="ضایعات خطوط">
              <FixedRows
                rows={data.scrap}
                labelKey="key"
                columns={[{ key: "ton", label: "تناژ", type: "number" }]}
                onChange={(i, k, v) => setPath(["scrap", i, k], v)}
              />
            </Panel>
          </TabsContent>

          <TabsContent value="zinc">
            <Panel
              title="مصرف روی و پوشش به تفکیک ضخامت"
              description="این داده‌ها در مدل گزارش حفظ می‌شوند، اما جدول تفصیلی آن در صفحه اصلی نمایش داده نمی‌شود."
            >
              <ArrayEditor
                rows={data.coating as unknown as Row[]}
                columns={[
                  { key: "thickness", label: "ضخامت", type: "number" },
                  { key: "width", label: "عرض", type: "number" },
                  { key: "producedWeight", label: "تولید (تن)", type: "number" },
                  { key: "theoreticalZinc", label: "روی نظری (kg)", type: "number" },
                  { key: "loss", label: "اتلاف (kg)", type: "number" },
                  { key: "actualCoating", label: "پوشش واقعی (kg)", type: "number" },
                ]}
                template={{
                  thickness: 0,
                  width: 1000,
                  producedWeight: 0,
                  theoreticalZinc: 0,
                  loss: 0,
                  actualCoating: 0,
                }}
                onUpdate={(rows) => setPath(["coating"], rows)}
              />
            </Panel>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <Panel title="گزارش فروش">
              <ArrayEditor
                rows={data.sales as unknown as Row[]}
                columns={[
                  { key: "date", label: "تاریخ" },
                  { key: "buyer", label: "خریدار" },
                  { key: "tonnage", label: "تناژ", type: "number" },
                  { key: "amountRial", label: "مبلغ ریال", type: "number" },
                ]}
                template={{ date: "", buyer: "", tonnage: 0, amountRial: 0 }}
                onUpdate={(rows) => setPath(["sales"], rows)}
              />
            </Panel>
            <Panel title="وضعیت حمل">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="در حال بارگیری (تن)"
                  type="number"
                  value={data.transport.underLoading}
                  onChange={(v) => setPath(["transport", "underLoading"], v)}
                />
                <Field
                  label="آماده در انبار (تن)"
                  type="number"
                  value={data.transport.readyInWarehouse}
                  onChange={(v) => setPath(["transport", "readyInWarehouse"], v)}
                />
              </div>
            </Panel>
            <Panel title="خلاصه مالی">
              <FixedRows
                rows={data.financial as unknown as Row[]}
                labelKey="key"
                columns={[
                  { key: "amountRial", label: "مبلغ ریال", type: "number" },
                  { key: "note", label: "توضیح" },
                ]}
                onChange={(i, k, v) => setPath(["financial", i, k], v)}
              />
            </Panel>
            <Panel title="حواله‌ها و انتقال دلار">
              <ArrayEditor
                rows={data.transfers as unknown as Row[]}
                columns={[
                  { key: "date", label: "تاریخ" },
                  { key: "rialAmount", label: "مبلغ ریال", type: "number" },
                  { key: "usdRate", label: "نرخ دلار", type: "number" },
                  { key: "usdAmount", label: "مبلغ دلار", type: "number" },
                  { key: "status", label: "وضعیت" },
                  { key: "notes", label: "توضیح" },
                ]}
                template={{
                  date: "",
                  rialAmount: 0,
                  usdRate: 0,
                  usdAmount: 0,
                  status: "Completed",
                  notes: "",
                }}
                onUpdate={(rows) => setPath(["transfers"], rows)}
              />
            </Panel>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4">
            <Panel title="برنامه تولید">
              <ArrayEditor
                rows={data.productionPlan as unknown as Row[]}
                columns={[
                  { key: "date", label: "تاریخ" },
                  { key: "thickness", label: "ضخامت‌ها" },
                  { key: "width", label: "عرض", type: "number" },
                  { key: "tons", label: "تناژ", type: "number" },
                  { key: "status", label: "وضعیت" },
                ]}
                template={{ date: "", thickness: "", width: 1000, tons: 0, status: "In progress" }}
                onUpdate={(rows) => setPath(["productionPlan"], rows)}
              />
            </Panel>
            <Panel title="موجودی محصول Grade A و B/C">
              <ArrayEditor
                rows={data.inventory as unknown as Row[]}
                columns={[
                  { key: "thickness", label: "ضخامت", type: "number" },
                  { key: "width", label: "عرض", type: "number" },
                  { key: "gradeAKg", label: "Grade A (kg)", type: "number" },
                  { key: "gradeBCKg", label: "Grade B/C (kg)", type: "number" },
                  { key: "totalKg", label: "جمع (kg)", type: "number", readOnly: true },
                ]}
                template={{ thickness: 0, width: 1000, gradeAKg: 0, gradeBCKg: 0, totalKg: 0 }}
                onUpdate={(rows) => setPath(["inventory"], rows)}
              />
            </Panel>
          </TabsContent>

          <TabsContent value="daily">
            <Panel title="تولید روزانه">
              <ArrayEditor
                rows={data.dailyProduction as unknown as Row[]}
                columns={[
                  { key: "persianDate", label: "تاریخ شمسی" },
                  { key: "date", label: "تاریخ میلادی" },
                  { key: "inputCoilsTon", label: "ورودی تن", type: "number" },
                  { key: "inputCoilsQty", label: "تعداد کویل", type: "number" },
                  { key: "pickling", label: "اسیدشویی", type: "number" },
                  { key: "rolling", label: "نورد", type: "number" },
                  { key: "galvanized", label: "گالوانیزه", type: "number" },
                ]}
                template={{
                  persianDate: "",
                  date: "",
                  inputCoilsTon: 0,
                  inputCoilsQty: 0,
                  pickling: 0,
                  rolling: 0,
                  galvanized: 0,
                }}
                onUpdate={(rows) => setPath(["dailyProduction"], rows)}
              />
            </Panel>
          </TabsContent>

          <TabsContent value="notes">
            <Panel title="یادداشت‌های مدیریتی سه‌زبانه">
              <div className="space-y-4">
                {data.notes.map((note, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <strong className="text-sm">یادداشت {index + 1}</strong>
                      <button
                        onClick={() => {
                          if (window.confirm("این یادداشت حذف شود؟"))
                            mutate((d) => {
                              d.notes.splice(index, 1);
                            });
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-3">
                      <TextArea
                        label="فارسی"
                        value={note.fa ?? ""}
                        onChange={(v) => setPath(["notes", index, "fa"], v)}
                      />
                      <TextArea
                        label="English"
                        dir="ltr"
                        value={note.en}
                        onChange={(v) => setPath(["notes", index, "en"], v)}
                      />
                      <TextArea
                        label="中文"
                        dir="ltr"
                        value={note.zh ?? ""}
                        onChange={(v) => setPath(["notes", index, "zh"], v)}
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => mutate((d) => d.notes.push({ en: "", fa: "", zh: "" }))}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  افزودن یادداشت
                </button>
              </div>
            </Panel>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function recalculateReport(source: AKAProjectReport) {
  const d = clone(source);
  const warehouse = (key: string) => d.warehouse.find((r) => r.key === key)?.ton ?? 0;
  const scrap = (key: string) => d.scrap.find((r) => r.key === key)?.ton ?? 0;
  const finalWarehouse = d.totals.galvanized - d.totals.sold;
  const wip = warehouse("unpickled") + warehouse("pickled") + warehouse("rolled");
  const totalScrap = sum(d.scrap, (r) => r.ton);
  d.productionKpis = [
    { key: "productionHrc", value: (d.totals.galvanized / d.totals.inputCoilsTon) * 100 },
    { key: "saleHrc", value: (d.totals.sold / d.totals.inputCoilsTon) * 100 },
    { key: "saleGlv", value: (d.totals.sold / d.totals.galvanized) * 100 },
    { key: "galvanizingScrap", value: (scrap("galvanizing") / d.totals.galvanized) * 100 },
    { key: "hotRollScrap", value: (scrap("rolling") / d.totals.rolling) * 100 },
    { key: "productSold", value: (d.totals.sold / d.totals.galvanized) * 100 },
  ];
  d.materialBalance = [
    { key: "factoryInput", ton: d.totals.inputCoilsTon },
    { key: "finalGalvanizedProduct", ton: d.totals.galvanized },
    { key: "wip", ton: wip },
    { key: "totalScrap", ton: totalScrap },
    {
      key: "balanceDifference",
      ton: d.totals.inputCoilsTon - d.totals.galvanized - wip - totalScrap,
    },
  ];
  d.finishedGoods = [
    { key: "finalGalvanizedProduction", ton: d.totals.galvanized },
    { key: "sold", ton: d.totals.sold },
    { key: "finishedGoodsWarehouse", ton: finalWarehouse },
    { key: "balanceDifference", ton: 0 },
  ];
  d.inventory = d.inventory.map((r) => ({ ...r, totalKg: r.gradeAKg + r.gradeBCKg }));
  d.transport.readyInWarehouse = sum(d.inventory, (r) => r.totalKg) / 1000;
  d.coating = d.coating.map((r) => ({ ...r, actualCoating: r.theoreticalZinc - r.loss }));
  d.massBalance = [
    { key: "totalSteelProduction", value: sum(d.coating, (r) => r.producedWeight), unit: "tons" },
    { key: "theoreticalZinc", value: sum(d.coating, (r) => r.theoreticalZinc), unit: "kg" },
    { key: "actualZinc", value: sum(d.coating, (r) => r.actualCoating), unit: "kg" },
    { key: "drossLoss", value: sum(d.coating, (r) => r.loss), unit: "kg" },
    {
      key: "zincEfficiency",
      value: sum(d.coating, (r) => r.theoreticalZinc)
        ? (sum(d.coating, (r) => r.actualCoating) / sum(d.coating, (r) => r.theoreticalZinc)) * 100
        : 0,
      unit: "%",
    },
  ];
  d.transfers = d.transfers.map((r) => ({
    ...r,
    usdAmount: r.usdRate ? r.rialAmount / r.usdRate : 0,
  }));
  const saleTotal = sum(d.sales, (r) => r.amountRial);
  const find = (key: string) => d.financial.find((r) => r.key === key);
  if (find("totalSalesCollected")) find("totalSalesCollected")!.amountRial = saleTotal;
  const costs = find("projectCosts")?.amountRial ?? 0,
    china = find("transferChinaOffice")?.amountRial ?? 0,
    paid = find("paidMrFardar")?.amountRial ?? 0;
  if (find("remaining")) find("remaining")!.amountRial = saleTotal - costs - china - paid;
  return d;
}
function validateReport(data: AKAProjectReport) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!data.reportDate) errors.push("تاریخ گزارش خالی است");
  if (!data.version) errors.push("نسخه گزارش خالی است");
  const c = reportChecks(data);
  if (Math.abs(c.materialBalanceDifference) > 0.01)
    warnings.push(`اختلاف بالانس مواد: ${c.materialBalanceDifference.toFixed(3)} تن`);
  if (Math.abs(c.salesDifference) > 0.01)
    warnings.push(`جمع فروش با مقدار تجمعی ${c.salesDifference.toFixed(3)} تن اختلاف دارد`);
  if (Math.abs(c.inventoryDifferenceTon) > 0.01)
    warnings.push(
      `جمع موجودی با آماده ارسال ${c.inventoryDifferenceTon.toFixed(3)} تن اختلاف دارد`,
    );
  if (c.dailyDifference.rolling.toFixed(3) !== "0.000")
    warnings.push(`اختلاف نورد روزانه و تجمعی: ${c.dailyDifference.rolling.toFixed(3)} تن`);
  return { errors, warnings };
}
function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[#123b57]">{title}</h2>
      {description && <p className="mb-4 mt-1 text-xs leading-5 text-slate-500">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </section>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  type?: "text" | "number";
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <input
        className={inputClass}
        type={type}
        step={type === "number" ? "any" : undefined}
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            type === "number"
              ? e.target.value === ""
                ? 0
                : Number(e.target.value)
              : e.target.value,
          )
        }
      />
    </label>
  );
}
function TextArea({
  label,
  value,
  onChange,
  dir = "rtl",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "rtl" | "ltr";
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      <textarea
        dir={dir}
        className={`${inputClass} min-h-32 resize-y`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function FixedRows({
  rows,
  labelKey,
  columns,
  onChange,
}: {
  rows: Row[];
  labelKey: string;
  columns: Column[];
  onChange: (i: number, k: string, v: any) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((row, i) => (
        <div
          key={row[labelKey] ?? i}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <p className="mb-3 text-xs font-bold uppercase text-[#0f6f8f]">{row[labelKey]}</p>
          <div className="grid gap-3">
            {columns.map((c) => (
              <Field
                key={c.key}
                label={c.label}
                type={c.type}
                value={row[c.key] ?? ""}
                onChange={(v) => onChange(i, c.key, v)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
function ArrayEditor({
  rows,
  columns,
  template,
  onUpdate,
}: {
  rows: Row[];
  columns: Column[];
  template: Row;
  onUpdate: (rows: Row[]) => void;
}) {
  const change = (i: number, key: string, v: any) => {
    const next = clone(rows);
    next[i][key] = v;
    if ("gradeAKg" in next[i])
      next[i].totalKg = (Number(next[i].gradeAKg) || 0) + (Number(next[i].gradeBCKg) || 0);
    onUpdate(next);
  };
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-xs">
          <thead>
            <tr className="bg-[#123b57] text-white">
              {columns.map((c) => (
                <th key={c.key} className="px-2 py-2 text-right">
                  {c.label}
                </th>
              ))}
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 even:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="p-1.5">
                    <input
                      className={inputClass}
                      type={c.type ?? "text"}
                      step={c.type === "number" ? "any" : undefined}
                      disabled={c.readOnly}
                      value={row[c.key] ?? ""}
                      onChange={(e) =>
                        change(
                          i,
                          c.key,
                          c.type === "number"
                            ? e.target.value === ""
                              ? 0
                              : Number(e.target.value)
                            : e.target.value,
                        )
                      }
                    />
                  </td>
                ))}
                <td>
                  <button
                    onClick={() => {
                      if (window.confirm("این ردیف حذف شود؟"))
                        onUpdate(rows.filter((_, x) => x !== i));
                    }}
                    className="p-2 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={() => onUpdate([...rows, clone(template)])}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold"
      >
        <Plus className="h-4 w-4" />
        افزودن ردیف
      </button>
    </div>
  );
}
function Action({
  icon,
  label,
  onClick,
  secondary = false,
  danger = false,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ${danger ? "bg-[#b52532] text-white" : secondary ? "border border-white/20 bg-white/10 text-white hover:bg-white/20" : "bg-cyan-600 text-white"}`}
    >
      <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {label}
    </button>
  );
}
function Status({ message }: { message: Message }) {
  return (
    <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${statusClass[message.tone]}`}>
      {message.text}
    </div>
  );
}
function ValidationPanel({ errors, warnings }: { errors: string[]; warnings: string[] }) {
  const ok = !errors.length && !warnings.length;
  return (
    <div
      className={`rounded-xl border p-4 ${errors.length ? "border-red-200 bg-red-50" : warnings.length ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2
          className={`h-5 w-5 ${ok ? "text-emerald-600" : errors.length ? "text-red-600" : "text-amber-600"}`}
        />
        <strong className="text-sm">
          {ok
            ? "داده‌ها آماده انتشار هستند"
            : errors.length
              ? "خطاهای ضروری وجود دارد"
              : "داده‌ها قابل انتشارند، اما موارد زیر بررسی شوند"}
        </strong>
      </div>
      {[...errors, ...warnings].length > 0 && (
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          {[...errors, ...warnings].map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
