import { useEffect } from "react";

const IOS_CAPTURE_WIDTH = 1120;
const STAGE_SELECTOR = "[data-executive-report-stage='true']";
const ROOT_SELECTOR = "[data-executive-report-render-root='true']";

function isIosDevice() {
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/i.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function important(element: HTMLElement, property: string, value: string) {
  element.style.setProperty(property, value, "important");
}

function prepareStage(stage: HTMLElement, ios: boolean) {
  const root = stage.querySelector<HTMLElement>(ROOT_SELECTOR);
  if (!root) return;

  root.classList.add("executive-report-render-root");
  if (!ios) return;

  stage.dataset.iosExecutiveReportStage = "true";
  root.classList.add("ios-executive-report-render-root");

  important(stage, "position", "fixed");
  important(stage, "left", "0");
  important(stage, "top", "0");
  important(stage, "width", `${IOS_CAPTURE_WIDTH}px`);
  important(stage, "max-width", "none");
  important(stage, "overflow", "visible");
  important(stage, "transform", "none");
  important(stage, "pointer-events", "none");
  important(stage, "z-index", "-2147483647");
  important(stage, "background", "#ffffff");

  important(root, "width", `${IOS_CAPTURE_WIDTH}px`);
  important(root, "min-width", `${IOS_CAPTURE_WIDTH}px`);
  important(root, "max-width", "none");
  important(root, "overflow", "visible");
  important(root, "transform", "none");
  important(root, "background", "#ffffff");
  important(root, "color", "#172033");

  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    important(element, "box-sizing", "border-box");
    important(element, "animation", "none");
    important(element, "transition", "none");
  });

  root.querySelectorAll<HTMLElement>("main, header, section, footer").forEach((element) => {
    important(element, "max-width", "100%");
    important(element, "overflow", "visible");
  });

  root.querySelectorAll<HTMLElement>(".overflow-x-auto, .overflow-auto").forEach((element) => {
    important(element, "width", "100%");
    important(element, "max-width", "100%");
    important(element, "overflow", "visible");
  });

  root.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
    important(table, "display", "table");
    important(table, "width", "100%");
    important(table, "min-width", "0");
    important(table, "max-width", "100%");
    important(table, "table-layout", "fixed");
    important(table, "white-space", "normal");
  });

  root.querySelectorAll<HTMLElement>("th, td").forEach((cell) => {
    important(cell, "min-width", "0");
    important(cell, "white-space", "normal");
    important(cell, "overflow-wrap", "anywhere");
  });

  root.querySelectorAll<HTMLElement>(".recharts-responsive-container, .recharts-wrapper").forEach((chart) => {
    important(chart, "width", "100%");
    important(chart, "min-width", "0");
    important(chart, "max-width", "100%");
    important(chart, "overflow", "visible");
  });

  root.querySelectorAll<SVGElement>("svg.recharts-surface").forEach((surface) => {
    surface.style.setProperty("width", "100%", "important");
    surface.style.setProperty("max-width", "100%", "important");
    surface.style.setProperty("overflow", "visible", "important");
    surface.setAttribute("preserveAspectRatio", "xMidYMid meet");
  });
}

export function ExecutiveReportStagePatch() {
  useEffect(() => {
    const ios = isIosDevice();
    const originalAppendChild = Node.prototype.appendChild;

    const patchedAppendChild = function <T extends Node>(this: Node, child: T): T {
      if (child instanceof HTMLElement && child.matches(STAGE_SELECTOR)) {
        prepareStage(child, ios);
      }
      return originalAppendChild.call(this, child) as T;
    };

    Node.prototype.appendChild = patchedAppendChild;
    return () => {
      Node.prototype.appendChild = originalAppendChild;
    };
  }, []);

  return null;
}
