// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

const enhanceDashboard = (code: string) => {
  let transformed = code;

  // Daily production values are independent process values, not a 100%-stacked total.
  transformed = transformed.replaceAll(' stackId="a"', "");

  // Always show exact numeric chart values.
  transformed = transformed.replaceAll(
    '<YAxis stroke="var(--color-muted-foreground)" fontSize={11} />',
    '<YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(value) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 3 })} />',
  );
  transformed = transformed.replaceAll(
    '<Tooltip contentStyle={tooltipStyle} />',
    '<Tooltip contentStyle={tooltipStyle} formatter={(value) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 3 })} />',
  );

  // Make every dashboard section use the latest report.json from GitHub at runtime.
  if (!transformed.includes("const [liveReport, setLiveReport]")) {
    const componentStart = transformed.indexOf("function Index() {");
    const componentEnd = transformed.indexOf("\nconst tooltipStyle", componentStart);

    if (componentStart >= 0 && componentEnd > componentStart) {
      const before = transformed.slice(0, componentStart);
      let component = transformed.slice(componentStart, componentEnd);
      const after = transformed.slice(componentEnd);

      component = component.replace(/\breport\b/g, "liveReport");
      component = component.replace(
        "function Index() {\n  const totals = liveReport.totals;",
        "function Index() {\n  const [liveReport, setLiveReport] = useState<any>(report);\n  const totals = liveReport.totals;",
      );
      component = component.replace(
        '  const tr = (key: string) => translations[key]?.[lang] ?? key;\n',
        `  const tr = (key: string) => translations[key]?.[lang] ?? key;\n\n  useEffect(() => {\n    let cancelled = false;\n\n    const loadLatestReport = async () => {\n      try {\n        const response = await fetch(\"/api/report-data\", { cache: \"no-store\" });\n        const payload = (await response.json()) as { ok?: boolean; data?: any };\n        if (!cancelled && response.ok && payload.ok && payload.data) {\n          setLiveReport(payload.data);\n        }\n      } catch {\n        // Keep the bundled report as a safe fallback when live retrieval is unavailable.\n      }\n    };\n\n    void loadLatestReport();\n    const timer = window.setInterval(() => void loadLatestReport(), 15_000);\n    const refreshOnFocus = () => void loadLatestReport();\n    window.addEventListener(\"focus\", refreshOnFocus);\n\n    return () => {\n      cancelled = true;\n      window.clearInterval(timer);\n      window.removeEventListener(\"focus\", refreshOnFocus);\n    };\n  }, []);\n`,
      );

      transformed = before + component + after;
    }
  }

  return transformed;
};

const enhanceDataEntry = (code: string) => {
  let transformed = code;

  // Avoid overlapping publish requests and coalesce typing into one automatic save.
  transformed = transformed.replace(
    "if (!authed || revision === 0) return;",
    "if (!authed || revision === 0 || saving) return;",
  );
  transformed = transformed.replace("}, 3000);", "}, 12000);");
  transformed = transformed.replace(
    "[authed, data, publishSnapshot, revision]",
    "[authed, data, publishSnapshot, revision, saving]",
  );

  // Never start editing from a stale bundled report. Read the current GitHub report after login.
  transformed = transformed.replace(
    `      await callPublisher({ action: \"verify\", password });\n      setAuthed(true);`,
    `      await callPublisher({ action: \"verify\", password });\n      const liveResponse = await fetch(\"/api/report-data\", { cache: \"no-store\" });\n      const livePayload = (await liveResponse.json().catch(() => ({}))) as {\n        ok?: boolean;\n        data?: AnyObj;\n        message?: string;\n      };\n      if (!liveResponse.ok || !livePayload.ok || !livePayload.data) {\n        throw new Error(livePayload.message || \"The latest GitHub report could not be loaded. Editing was stopped to prevent overwriting newer data.\");\n      }\n      setData(livePayload.data);\n      lastPublishedJson.current = JSON.stringify(livePayload.data);\n      setAuthed(true);`,
  );

  transformed = transformed.replace(
    "Every field edit, row addition and row deletion is saved automatically after 3 seconds.",
    "Every field edit, row addition and row deletion is saved automatically after 12 seconds of inactivity.",
  );

  return transformed;
};

const akaRuntimeDataFixes: Plugin = {
  name: "aka-runtime-report-data-fixes",
  enforce: "pre",
  transform(code, id) {
    const normalizedId = id.split("?", 1)[0].replace(/\\/g, "/");

    if (normalizedId.endsWith("/src/routes/index.tsx")) {
      const transformed = enhanceDashboard(code);
      return transformed === code ? null : { code: transformed, map: null };
    }

    if (normalizedId.endsWith("/src/features/data-transformer-page.tsx")) {
      const transformed = enhanceDataEntry(code);
      return transformed === code ? null : { code: transformed, map: null };
    }

    return null;
  },
};

export default defineConfig({
  vite: {
    plugins: [akaRuntimeDataFixes],
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
