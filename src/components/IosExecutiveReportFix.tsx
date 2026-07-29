import { useEffect } from "react";

const IOS_CAPTURE_WIDTH = 1120;

function isAppleMobileWebKit() {
  const userAgent = navigator.userAgent;
  const classicIos = /iPad|iPhone|iPod/i.test(userAgent);
  const desktopModeIpad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return classicIos || desktopModeIpad;
}

function setImportantStyle(element: HTMLElement, property: string, value: string) {
  element.style.setProperty(property, value, "important");
}

function normalizeCharts(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".recharts-responsive-container").forEach((container) => {
    setImportantStyle(container, "width", "100%");
    setImportantStyle(container, "min-width", "0");
    setImportantStyle(container, "max-width", "100%");
    setImportantStyle(container, "overflow", "visible");
  });

  root.querySelectorAll<HTMLElement>(".recharts-wrapper").forEach((wrapper) => {
    setImportantStyle(wrapper, "width", "100%");
    setImportantStyle(wrapper, "max-width", "100%");
    setImportantStyle(wrapper, "overflow", "visible");
  });

  root.querySelectorAll<SVGElement>("svg.recharts-surface").forEach((surface) => {
    surface.style.setProperty("width", "100%", "important");
    surface.style.setProperty("max-width", "100%", "important");
    surface.style.setProperty("overflow", "visible", "important");
    surface.setAttribute("preserveAspectRatio", "xMidYMid meet");
  });
}

function normalizeTables(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".overflow-x-auto, .overflow-auto").forEach((container) => {
    setImportantStyle(container, "width", "100%");
    setImportantStyle(container, "max-width", "100%");
    setImportantStyle(container, "overflow", "visible");
  });

  root.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
    setImportantStyle(table, "display", "table");
    setImportantStyle(table, "width", "100%");
    setImportantStyle(table, "min-width", "0");
    setImportantStyle(table, "max-width", "100%");
    setImportantStyle(table, "table-layout", "fixed");
    setImportantStyle(table, "white-space", "normal");
  });

  root.querySelectorAll<HTMLElement>("th, td").forEach((cell) => {
    setImportantStyle(cell, "min-width", "0");
    setImportantStyle(cell, "max-width", "none");
    setImportantStyle(cell, "white-space", "normal");
    setImportantStyle(cell, "overflow-wrap", "anywhere");
    setImportantStyle(cell, "word-break", "normal");
  });
}

function prepareStage(stage: HTMLElement, ios: boolean) {
  const root = stage.querySelector<HTMLElement>("[data-executive-report-render-root='true']");
  if (!root) return;

  // The exporter stylesheet targets this class. Adding it explicitly keeps the
  // cloned dashboard deterministic instead of inheriting the phone viewport.
  root.classList.add("executive-report-render-root");

  if (!ios) return;

  stage.dataset.iosExecutiveReportStage = "true";
  root.classList.add("ios-executive-report-render-root");

  // Safari can corrupt very large canvases positioned far outside its raster
  // coordinate range. Keep the temporary stage at the origin, behind the app.
  setImportantStyle(stage, "position", "fixed");
  setImportantStyle(stage, "left", "0");
  setImportantStyle(stage, "top", "0");
  setImportantStyle(stage, "width", `${IOS_CAPTURE_WIDTH}px`);
  setImportantStyle(stage, "max-width", "none");
  setImportantStyle(stage, "overflow", "visible");
  setImportantStyle(stage, "transform", "none");
  setImportantStyle(stage, "pointer-events", "none");
  setImportantStyle(stage, "z-index", "-2147483647");
  setImportantStyle(stage, "background", "#ffffff");

  setImportantStyle(root, "width", `${IOS_CAPTURE_WIDTH}px`);
  setImportantStyle(root, "min-width", `${IOS_CAPTURE_WIDTH}px`);
  setImportantStyle(root, "max-width", "none");
  setImportantStyle(root, "overflow", "visible");
  setImportantStyle(root, "transform", "none");
  setImportantStyle(root, "background", "#ffffff");
  setImportantStyle(root, "color", "#172033");

  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    setImportantStyle(element, "box-sizing", "border-box");
    setImportantStyle(element, "animation", "none");
    setImportantStyle(element, "transition", "none");
  });

  root.querySelectorAll<HTMLElement>("main, header, section, footer").forEach((element) => {
    setImportantStyle(element, "max-width", "100%");
    setImportantStyle(element, "overflow", "visible");
  });

  normalizeTables(root);
  normalizeCharts(root);
}

export function IosExecutiveReportFix() {
  useEffect(() => {
    const ios = isAppleMobileWebKit();

    const scan = (node: ParentNode) => {
      if (node instanceof HTMLElement && node.matches("[data-executive-report-stage='true']")) {
        prepareStage(node, ios);
      }
      node.querySelectorAll?.<HTMLElement>("[data-executive-report-stage='true']").forEach((stage) => prepareStage(stage, ios));
    };

    scan(document);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) scan(node);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style>{`
      [data-ios-executive-report-stage='true'] .ios-executive-report-render-root {
        width: ${IOS_CAPTURE_WIDTH}px !important;
        min-width: ${IOS_CAPTURE_WIDTH}px !important;
        max-width: none !important;
      }
      [data-ios-executive-report-stage='true'] .ios-executive-report-render-root .recharts-responsive-container,
      [data-ios-executive-report-stage='true'] .ios-executive-report-render-root .recharts-wrapper,
      [data-ios-executive-report-stage='true'] .ios-executive-report-render-root svg.recharts-surface {
        width: 100% !important;
        max-width: 100% !important;
        overflow: visible !important;
      }
      [data-ios-executive-report-stage='true'] .ios-executive-report-render-root table {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        table-layout: fixed !important;
      }
      [data-ios-executive-report-stage='true'] .ios-executive-report-render-root th,
      [data-ios-executive-report-stage='true'] .ios-executive-report-render-root td {
        min-width: 0 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
      }
    `}</style>
  );
}
