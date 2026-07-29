import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileDown, Loader2 } from "lucide-react";
import report from "@/data/report.json";

type Lang = "en" | "zh" | "fa";
type LocalizedText = string | (Partial<Record<Lang, string>> & { note?: string });
type CommentaryKey = "overall" | "production" | "sales" | "inventory" | "keyNote";

const PRINT_LABELS = ["Print PDF", "打印 PDF", "چاپ PDF"];
const CAPTURE_WIDTH = 1280;

const labels: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    reportDate: string;
    version: string;
    generated: string;
    projectAnalysis: string;
    noAnalysis: string;
    managementCommentary: string;
    noComment: string;
    commentary: Record<CommentaryKey, string>;
  }
> = {
  en: {
    title: "AKA Executive Management Report",
    subtitle: "Complete export of the live project dashboard",
    reportDate: "Report date",
    version: "Version",
    generated: "Generated",
    projectAnalysis: "Project Analysis",
    noAnalysis: "No project analysis has been entered.",
    managementCommentary: "Management Commentary",
    noComment: "No comment provided.",
    commentary: {
      overall: "Overall Project Status",
      production: "Production Status",
      sales: "Sales Status",
      inventory: "Inventory Status",
      keyNote: "Key Management Note",
    },
  },
  zh: {
    title: "AKA 项目管理报告",
    subtitle: "项目实时仪表板完整导出",
    reportDate: "报告日期",
    version: "版本",
    generated: "生成时间",
    projectAnalysis: "项目分析",
    noAnalysis: "尚未输入项目分析。",
    managementCommentary: "管理层评论",
    noComment: "未提供评论。",
    commentary: {
      overall: "项目总体状态",
      production: "生产状态",
      sales: "销售状态",
      inventory: "库存状态",
      keyNote: "关键管理说明",
    },
  },
  fa: {
    title: "گزارش مدیریتی اجرایی آکا",
    subtitle: "خروجی کامل داشبورد زنده پروژه",
    reportDate: "تاریخ گزارش",
    version: "نسخه",
    generated: "زمان تولید",
    projectAnalysis: "تحلیل پروژه",
    noAnalysis: "هیچ تحلیل پروژه‌ای وارد نشده است.",
    managementCommentary: "تفسیر مدیریتی",
    noComment: "توضیحی ارائه نشده است.",
    commentary: {
      overall: "وضعیت کلی پروژه",
      production: "وضعیت تولید",
      sales: "وضعیت فروش",
      inventory: "وضعیت موجودی",
      keyNote: "نکته کلیدی مدیریتی",
    },
  },
};

function localizedText(value: unknown, lang: Lang) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  const text = value as Partial<Record<Lang, unknown>> & { note?: unknown };
  const selected = text[lang];
  const fallback = text.en ?? text.fa ?? text.zh ?? text.note;
  return typeof selected === "string" ? selected : typeof fallback === "string" ? fallback : "";
}

function nextFrame() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function safeFilePart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "report";
}

function findDashboardTargets() {
  const printButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    PRINT_LABELS.some((label) => button.textContent?.includes(label)),
  );

  return {
    toolbar: printButton?.parentElement ?? null,
    root: printButton?.closest<HTMLElement>(".min-h-screen") ?? null,
  };
}

async function loadLogoDataUrl() {
  return new Promise<string | null>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      try {
        const width = Math.max(image.naturalWidth || 512, 1);
        const height = Math.max(image.naturalHeight || 180, 1);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(null);
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = "/aka-logo.svg";
  });
}

function createRenderStage(source: HTMLElement) {
  const stage = document.createElement("div");
  stage.dataset.executiveReportStage = "true";
  stage.style.position = "fixed";
  stage.style.left = "-20000px";
  stage.style.top = "0";
  stage.style.width = `${CAPTURE_WIDTH}px`;
  stage.style.pointerEvents = "none";
  stage.style.zIndex = "-2147483648";
  stage.style.background = "#ffffff";

  const clone = source.cloneNode(true) as HTMLElement;
  clone.dataset.executiveReportRenderRoot = "true";
  clone.classList.remove("dark");
  clone.classList.add("light");
  clone.style.width = `${CAPTURE_WIDTH}px`;
  clone.style.maxWidth = "none";
  clone.style.background = "#ffffff";
  clone.style.color = "#172033";

  clone.querySelectorAll<HTMLElement>(".no-print, [data-pdf-exclude='true']").forEach((element) => element.remove());
  clone.querySelectorAll<HTMLElement>(".executive-report-only").forEach((element) => {
    element.style.display = "block";
    element.removeAttribute("aria-hidden");
  });

  stage.appendChild(clone);
  document.body.appendChild(stage);
  return { stage, clone };
}

function collectReportBlocks(root: HTMLElement) {
  const identity = root.querySelector<HTMLElement>("[data-executive-report-identity='true']");
  const header = root.querySelector<HTMLElement>(":scope > header");
  const main = root.querySelector<HTMLElement>(":scope > main");
  const appendices = Array.from(root.querySelectorAll<HTMLElement>("[data-executive-report-appendix='true']"));
  const mainBlocks = main ? Array.from(main.children).filter((node): node is HTMLElement => node instanceof HTMLElement) : [];

  return [identity, header, ...mainBlocks, ...appendices].filter((node): node is HTMLElement => Boolean(node));
}

function drawPageHeader(
  pdf: import("jspdf").jsPDF,
  logoDataUrl: string | null,
  pageWidth: number,
  margin: number,
) {
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, "PNG", margin, 5.2, 17, 7.2, undefined, "FAST");
    } catch {
      pdf.setFillColor(36, 90, 141);
      pdf.roundedRect(margin, 5, 17, 8, 1.5, 1.5, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("AKA", margin + 8.5, 10.5, { align: "center" });
    }
  } else {
    pdf.setFillColor(36, 90, 141);
    pdf.roundedRect(margin, 5, 17, 8, 1.5, 1.5, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("AKA", margin + 8.5, 10.5, { align: "center" });
  }

  pdf.setTextColor(31, 45, 61);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.text("AKA Executive Management Report", margin + 21, 9.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(101, 113, 128);
  pdf.setFontSize(7.5);
  pdf.text(`Report ${report.reportDate}  |  Version ${report.version}`, pageWidth - margin, 9.5, { align: "right" });
  pdf.setDrawColor(205, 213, 223);
  pdf.setLineWidth(0.25);
  pdf.line(margin, 15, pageWidth - margin, 15);
}

function drawPageFooters(pdf: import("jspdf").jsPDF, generatedAt: string) {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(218, 224, 232);
    pdf.setLineWidth(0.2);
    pdf.line(10, pageHeight - 8.5, pageWidth - 10, pageHeight - 8.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(110, 120, 134);
    pdf.text(`Confidential - AKA Project - Generated ${generatedAt}`, 10, pageHeight - 4.5);
    pdf.text(`Page ${page} of ${pageCount}`, pageWidth - 10, pageHeight - 4.5, { align: "right" });
  }
}

function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 1;
  canvas.height = 1;
}

export function ExecutiveReportExporter() {
  const [toolbarTarget, setToolbarTarget] = useState<Element | null>(null);
  const [reportRoot, setReportRoot] = useState<HTMLElement | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [generatedAt, setGeneratedAt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const locate = () => {
      const targets = findDashboardTargets();
      setToolbarTarget((current) => (current === targets.toolbar ? current : targets.toolbar));
      setReportRoot((current) => (current === targets.root ? current : targets.root));
      const documentLang = document.documentElement.lang;
      setLang(documentLang === "fa" || documentLang === "zh" ? documentLang : "en");
    };

    locate();
    const observer = new MutationObserver(locate);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
      attributeFilter: ["lang"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!reportRoot) return;
    reportRoot.dataset.executiveReportRoot = "true";
    return () => {
      delete reportRoot.dataset.executiveReportRoot;
    };
  }, [reportRoot]);

  const generateReport = async () => {
    if (isGenerating) return;

    const targets = findDashboardTargets();
    const source = targets.root ?? reportRoot;
    if (!source) {
      setError("Dashboard content is not ready yet.");
      return;
    }

    const generatedDate = new Date();
    const generatedLabel = generatedDate.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    setGeneratedAt(generatedLabel);
    setError("");
    setIsGenerating(true);

    let stage: HTMLElement | null = null;
    try {
      await nextFrame();
      await nextFrame();
      if (document.fonts?.ready) await document.fonts.ready;
      await wait(250);

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
      const logoDataUrl = await loadLogoDataUrl();
      const rendered = createRenderStage(source);
      stage = rendered.stage;
      const blocks = collectReportBlocks(rendered.clone);
      if (blocks.length === 0) throw new Error("No dashboard blocks were found for export.");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
        putOnlyUsedFonts: true,
      });
      pdf.setProperties({
        title: `AKA Executive Management Report - ${report.reportDate}`,
        subject: "Complete AKA project dashboard export",
        author: "AKA",
        creator: "AKA Executive Dashboard",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentTop = 19;
      const contentBottom = pageHeight - 11;
      const fullContentHeight = contentBottom - contentTop;
      const contentWidth = pageWidth - margin * 2;
      const mobileDevice = /Android|iPhone|iPad|iPod|HarmonyOS|Huawei/i.test(navigator.userAgent);
      const scale = mobileDevice ? 1.05 : 1.35;
      let cursorY = contentTop;
      let pageHasContent = false;

      const addPage = () => {
        if (pageHasContent) pdf.addPage("a4", "landscape");
        drawPageHeader(pdf, logoDataUrl, pageWidth, margin);
        cursorY = contentTop;
        pageHasContent = true;
      };

      addPage();

      for (const block of blocks) {
        const rect = block.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;

        const canvas = await html2canvas(block, {
          backgroundColor: "#ffffff",
          scale,
          useCORS: true,
          allowTaint: false,
          logging: false,
          imageTimeout: 15000,
          windowWidth: CAPTURE_WIDTH + 80,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDocument) => {
            clonedDocument.documentElement.classList.remove("dark");
            clonedDocument.documentElement.classList.add("light");
            const clonedStage = clonedDocument.querySelector<HTMLElement>("[data-executive-report-stage='true']");
            if (clonedStage) {
              clonedStage.style.left = "0";
              clonedStage.style.top = "0";
              clonedStage.style.position = "absolute";
              clonedStage.style.zIndex = "0";
            }
          },
        });

        const mmPerPixel = contentWidth / canvas.width;
        const blockHeightMm = canvas.height * mmPerPixel;
        const remainingHeight = contentBottom - cursorY;

        if (blockHeightMm <= fullContentHeight && blockHeightMm > remainingHeight) {
          pdf.addPage("a4", "landscape");
          drawPageHeader(pdf, logoDataUrl, pageWidth, margin);
          cursorY = contentTop;
        }

        if (blockHeightMm <= fullContentHeight) {
          const imageData = canvas.toDataURL("image/jpeg", 0.92);
          pdf.addImage(imageData, "JPEG", margin, cursorY, contentWidth, blockHeightMm, undefined, "FAST");
          cursorY += blockHeightMm + 4;
          releaseCanvas(canvas);
          continue;
        }

        const pixelsPerPage = Math.max(1, Math.floor(fullContentHeight / mmPerPixel));
        let sourceY = 0;
        while (sourceY < canvas.height) {
          if (cursorY > contentTop + 0.5) {
            pdf.addPage("a4", "landscape");
            drawPageHeader(pdf, logoDataUrl, pageWidth, margin);
            cursorY = contentTop;
          }

          const sliceHeight = Math.min(pixelsPerPage, canvas.height - sourceY);
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = sliceHeight;
          const context = slice.getContext("2d");
          if (!context) throw new Error("Unable to prepare a PDF page image.");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, slice.width, slice.height);
          context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

          const sliceHeightMm = sliceHeight * mmPerPixel;
          const imageData = slice.toDataURL("image/jpeg", 0.92);
          pdf.addImage(imageData, "JPEG", margin, cursorY, contentWidth, sliceHeightMm, undefined, "FAST");
          releaseCanvas(slice);
          sourceY += sliceHeight;
          cursorY = contentTop + sliceHeightMm;

          if (sourceY < canvas.height) {
            pdf.addPage("a4", "landscape");
            drawPageHeader(pdf, logoDataUrl, pageWidth, margin);
            cursorY = contentTop;
          } else {
            cursorY += 4;
          }
        }
        releaseCanvas(canvas);
      }

      drawPageFooters(pdf, generatedLabel);
      const fileName = `AKA_Executive_Report_${safeFilePart(report.reportDate)}_v${safeFilePart(String(report.version))}.pdf`;
      const blob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.target = "_blank";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (reportError) {
      console.error("Executive report generation failed", reportError);
      setError("Executive report generation failed. Please try again.");
    } finally {
      stage?.remove();
      setIsGenerating(false);
    }
  };

  const reportData = report as unknown as Record<string, unknown>;
  const projectAnalysis = localizedText(reportData.projectAnalysis, lang).trim();
  const commentary = (reportData.managementCommentary ?? {}) as Record<CommentaryKey, LocalizedText>;
  const currentLabels = labels[lang];

  return (
    <>
      <style>{`
        .executive-report-only { display: none; }
        .executive-report-render-root {
          width: ${CAPTURE_WIDTH}px !important;
          max-width: none !important;
          background: #ffffff !important;
          color: #172033 !important;
        }
        .executive-report-render-root main,
        .executive-report-render-root header {
          width: 100% !important;
          max-width: ${CAPTURE_WIDTH}px !important;
          overflow: visible !important;
        }
        .executive-report-render-root .overflow-x-auto,
        .executive-report-render-root .overflow-auto,
        .executive-report-render-root div:has(> table),
        .executive-report-render-root section:has(> table) {
          overflow: visible !important;
          max-width: none !important;
        }
        .executive-report-render-root table {
          display: table !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          white-space: normal !important;
        }
        .executive-report-render-root th,
        .executive-report-render-root td {
          min-width: 0 !important;
          white-space: normal !important;
          overflow-wrap: anywhere;
        }
        .executive-report-render-root .sticky { position: static !important; }
        .executive-report-render-root section,
        .executive-report-render-root footer,
        .executive-report-render-root [data-executive-report-identity='true'] {
          box-shadow: none !important;
        }
      `}</style>

      {toolbarTarget &&
        createPortal(
          <>
            <button
              type="button"
              onClick={generateReport}
              disabled={isGenerating}
              data-pdf-exclude="true"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 disabled:cursor-wait disabled:opacity-70"
              title="Generate a complete A4 landscape PDF of the dashboard"
            >
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              {isGenerating ? "Preparing Management Report..." : "Generate Executive Report"}
            </button>
            {error ? <span className="max-w-52 text-xs font-medium text-destructive">{error}</span> : null}
          </>,
          toolbarTarget,
        )}

      {reportRoot &&
        createPortal(
          <div className="executive-report-only executive-report-appendices" aria-hidden="true">
            <section
              data-executive-report-identity="true"
              className="mx-auto max-w-7xl rounded-2xl border border-border bg-card p-8"
              dir={lang === "fa" ? "rtl" : "ltr"}
            >
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <img src="/aka-logo.svg" alt="AKA" className="h-20 w-auto object-contain" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">AKA</p>
                    <h2 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{currentLabels.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{currentLabels.subtitle}</p>
                  </div>
                </div>
                <div className="grid min-w-80 gap-3 text-sm">
                  <div className="flex items-center justify-between gap-8 border-b border-border pb-2">
                    <span className="text-muted-foreground">{currentLabels.reportDate}</span>
                    <strong className="tabular-nums">{report.reportDate}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-8 border-b border-border pb-2">
                    <span className="text-muted-foreground">{currentLabels.version}</span>
                    <strong className="tabular-nums">v{report.version}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-muted-foreground">{currentLabels.generated}</span>
                    <strong className="tabular-nums">{generatedAt || "-"}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section
              data-executive-report-appendix="true"
              className="mx-auto max-w-7xl rounded-2xl border border-border bg-card p-6"
              dir={lang === "fa" ? "rtl" : "ltr"}
            >
              <h2 className="text-xl font-semibold text-foreground">{currentLabels.projectAnalysis}</h2>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {projectAnalysis || <span className="italic text-muted-foreground">{currentLabels.noAnalysis}</span>}
              </div>
            </section>

            <section
              data-executive-report-appendix="true"
              className="mx-auto max-w-7xl rounded-2xl border border-border bg-card p-6"
              dir={lang === "fa" ? "rtl" : "ltr"}
            >
              <h2 className="text-xl font-semibold text-foreground">{currentLabels.managementCommentary}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {(Object.keys(currentLabels.commentary) as CommentaryKey[]).map((key) => {
                  const value = localizedText(commentary[key], lang).trim();
                  return (
                    <div key={key} className="rounded-xl border border-border bg-secondary/30 p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {currentLabels.commentary[key]}
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {value || <span className="italic text-muted-foreground">{currentLabels.noComment}</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>,
          reportRoot,
        )}
    </>
  );
}
