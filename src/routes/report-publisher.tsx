import { createFileRoute } from "@tanstack/react-router";
import { useState, type ChangeEvent } from "react";
import reportData from "@/data/report.json";
import { importReportWorkbook } from "@/lib/xlsx-import";

type AnyObj = Record<string, any>;
type StatusTone = "info" | "success" | "error";
type StatusMessage = { tone: StatusTone; text: string };

type ApiResponse = {
  ok?: boolean;
  message?: string;
  commitSha?: string;
  commitUrl?: string;
  branch?: string;
};

export const Route = createFileRoute("/report-publisher")({
  head: () => ({
    meta: [
      { title: "Excel Deploy — AKA Project Report" },
      {
        name: "description",
        content: "Import the AKA Excel workbook and publish the report through GitHub and Cloudflare.",
      },
    ],
  }),
  component: ReportPublisherPage,
});

const statusClasses: Record<StatusTone, string> = {
  info: "border-primary/30 bg-primary/10 text-foreground",
  success:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
};

const cloneCurrentReport = () => JSON.parse(JSON.stringify(reportData)) as AnyObj;

async function callPublisher(body: AnyObj): Promise<ApiResponse> {
  const response = await fetch("/api/publish-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok || !result.ok) {
    throw new Error(result.message || `Request failed with status ${response.status}.`);
  }
  return result;
}

function ReportPublisherPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [data, setData] = useState<AnyObj | null>(null);
  const [importedSections, setImportedSections] = useState<string[]>([]);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [commit, setCommit] = useState<ApiResponse | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthenticating(true);
    setStatus(null);
    try {
      await callPublisher({ action: "verify", password });
      setAuthed(true);
      setStatus({
        tone: "success",
        text: "Password verified. Select the completed AKA Excel workbook.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        text: error instanceof Error ? error.message : "Password verification failed.",
      });
    } finally {
      setAuthenticating(false);
    }
  };

  const handleExcelImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setStatus({ tone: "error", text: "The Excel file is larger than 15 MB." });
      return;
    }

    setImporting(true);
    setCommit(null);
    setStatus({ tone: "info", text: `Reading ${file.name}…` });
    try {
      const result = await importReportWorkbook(file, cloneCurrentReport());
      setData(result.data);
      setImportedSections(result.importedSections);
      const warnings = result.warnings.length
        ? ` Warnings: ${result.warnings.join(" ")}`
        : "";
      setStatus({
        tone: "success",
        text: `Excel import completed. ${result.importedSections.length} sections were populated.${warnings} Review the summary and select Save & Deploy.`,
      });
    } catch (error) {
      setData(null);
      setImportedSections([]);
      setStatus({
        tone: "error",
        text: error instanceof Error ? error.message : "The Excel workbook could not be imported.",
      });
    } finally {
      setImporting(false);
    }
  };

  const handlePublish = async () => {
    if (!data || publishing) return;
    setPublishing(true);
    setCommit(null);
    setStatus({
      tone: "info",
      text: "Validating the report and creating a GitHub commit…",
    });
    try {
      const result = await callPublisher({ action: "publish", password, data });
      setCommit(result);
      setStatus({
        tone: "success",
        text:
          result.message ||
          "Report committed successfully. Cloudflare deployment should start automatically.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        text: error instanceof Error ? error.message : "The report could not be published.",
      });
    } finally {
      setPublishing(false);
    }
  };

  const exportBackup = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aka-report-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!authed) {
    return (
      <main className="flex min-h-[calc(100vh-41px)] items-center justify-center bg-background p-4 text-foreground">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            AKA Project Report
          </p>
          <h1 className="text-xl font-semibold">Excel Deploy</h1>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Enter the Cloudflare Data Entry password to publish report updates.
          </p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoFocus
            className="mb-3 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={authenticating || !password}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {authenticating ? "Verifying…" : "Enter"}
          </button>
          {status && (
            <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${statusClasses[status.tone]}`}>
              {status.text}
            </div>
          )}
        </form>
      </main>
    );
  }

  const summary = data
    ? [
        ["Report date", data.reportDate || "—"],
        ["Version", data.version || "—"],
        ["Input coil tonnage", data.totals?.inputCoilsTon ?? 0],
        ["Input coil count", data.totals?.inputCoilsQty ?? 0],
        ["Galvanized", data.totals?.galvanized ?? 0],
        ["Sold", data.totals?.sold ?? 0],
        ["Coil inventory rows", data.coilInventory?.length ?? 0],
        ["Daily production rows", data.daily?.length ?? 0],
        ["Sales rows", data.sales?.length ?? 0],
        ["Plan rows", data.plan?.length ?? 0],
      ]
    : [];

  return (
    <main className="min-h-[calc(100vh-41px)] bg-background text-foreground">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            AKA Project Report
          </p>
          <h1 className="text-2xl font-semibold">Excel Import & Automatic Deploy</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload the official workbook, verify the mapped totals, then create the GitHub commit that triggers Cloudflare deployment.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold">1. Import Excel Workbook</h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            Use the official AKA .xlsx template. Blank sheets keep the currently deployed values.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label
              className={`inline-flex cursor-pointer items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 ${importing ? "pointer-events-none opacity-60" : ""}`}
            >
              {importing ? "Reading Excel…" : "Choose Excel File"}
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                disabled={importing || publishing}
                onChange={handleExcelImport}
              />
            </label>
            <span className="text-xs text-muted-foreground">Maximum size: 15 MB</span>
          </div>

          {status && (
            <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${statusClasses[status.tone]}`}>
              {status.text}
            </div>
          )}
        </section>

        {data && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">2. Review Import Summary</h2>
            <p className="mb-4 mt-1 text-xs text-muted-foreground">
              Imported sections: {importedSections.join(", ") || "No populated sections detected"}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {summary.map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-lg font-semibold">{String(value)}</p>
                </div>
              ))}
            </div>

            <details className="mt-4 rounded-lg border border-border p-3">
              <summary className="cursor-pointer text-sm font-medium">View imported JSON</summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold">3. Save & Deploy</h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            This replaces src/data/report.json on the main branch. The connected Cloudflare project should then build and deploy automatically.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePublish}
              disabled={!data || publishing || importing}
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishing ? "Saving to GitHub…" : "Save & Deploy"}
            </button>
            <button
              type="button"
              onClick={exportBackup}
              disabled={!data || publishing}
              className="rounded-md border border-border bg-secondary/40 px-5 py-2.5 text-sm font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download JSON Backup
            </button>
          </div>

          {commit?.commitSha && (
            <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                GitHub commit created successfully.
              </p>
              <p className="mt-1 text-muted-foreground">
                Branch: {commit.branch || "main"} · Commit: {commit.commitSha.slice(0, 12)}
              </p>
              {commit.commitUrl && (
                <a
                  href={commit.commitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-medium text-primary underline underline-offset-4"
                >
                  Open commit in GitHub
                </a>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
