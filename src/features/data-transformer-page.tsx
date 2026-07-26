import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import reportData from "@/data/report.json";
import { importReportWorkbook } from "@/lib/xlsx-import";

type AnyObj = Record<string, any>;
type FieldType = "text" | "number";
type Tone = "info" | "success" | "error";
type Message = { tone: Tone; text: string };
type ContentLang = "en" | "fa" | "zh";
type ColumnDefinition = { key: string; label: string; type?: FieldType };
type ArraySection = {
  key: string;
  title: string;
  description?: string;
  columns: ColumnDefinition[];
  template: AnyObj;
};
type ApiResponse = {
  ok?: boolean;
  message?: string;
  commitSha?: string;
  commitUrl?: string;
  branch?: string;
};

export const Route = createFileRoute("/data-transformer")({
  head: () => ({
    meta: [
      { title: "AKA Project Report — Live Data Entry" },
      {
        name: "description",
        content: "Secure data entry with automatic GitHub save and Cloudflare deployment.",
      },
    ],
  }),
  component: DataTransformerPage,
});

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

const statusClasses: Record<Tone, string> = {
  info: "border-primary/30 bg-primary/10 text-foreground",
  success:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
};

const parseNum = (value: string) =>
  value === "" ? 0 : Number.isNaN(Number(value)) ? value : Number(value);

const CONTENT_LANGUAGES: Array<{ code: ContentLang; label: string; dir: "ltr" | "rtl" }> = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fa", label: "فارسی", dir: "rtl" },
  { code: "zh", label: "中文", dir: "ltr" },
];

const localizedValue = (value: unknown, lang: ContentLang) => {
  if (typeof value === "string") return lang === "en" ? value : "";
  if (!value || typeof value !== "object") return "";
  const selected = (value as Record<string, unknown>)[lang];
  return typeof selected === "string" ? selected : "";
};

const withLocalizedValue = (value: unknown, lang: ContentLang, text: string) => ({
  ...(typeof value === "string" ? { en: value } : value && typeof value === "object" ? value : {}),
  [lang]: text,
});

const cloneReport = () => {
  const initial = JSON.parse(JSON.stringify(reportData)) as AnyObj;
  initial.coilInventory = initial.coilInventory ?? [];
  initial.managementCommentary = initial.managementCommentary ?? {};
  return initial;
};

const ARRAY_SECTIONS: ArraySection[] = [
  {
    key: "coilInventory",
    title: "Coil Inventory",
    description: "Available coil stock by thickness, width and tonnage.",
    columns: [
      { key: "thickness", label: "Thickness (mm)", type: "number" },
      { key: "width", label: "Width (mm)", type: "number" },
      { key: "tonnage", label: "Available Tonnage", type: "number" },
    ],
    template: { thickness: 0, width: 1000, tonnage: 0 },
  },
  {
    key: "warehouse",
    title: "Warehouse",
    columns: [
      { key: "name", label: "Name" },
      { key: "ton", label: "Ton", type: "number" },
    ],
    template: { name: "", ton: 0 },
  },
  {
    key: "scrap",
    title: "Scrap",
    columns: [
      { key: "line", label: "Line" },
      { key: "ton", label: "Ton", type: "number" },
    ],
    template: { line: "", ton: 0 },
  },
  {
    key: "materialBalance",
    title: "Material Balance",
    columns: [
      { key: "k", label: "Key" },
      { key: "v", label: "Value", type: "number" },
    ],
    template: { k: "", v: 0 },
  },
  {
    key: "yields",
    title: "Yields",
    columns: [
      { key: "process", label: "Process" },
      { key: "formula", label: "Formula" },
      { key: "value", label: "Value", type: "number" },
    ],
    template: { process: "", formula: "", value: 0 },
  },
  {
    key: "daily",
    title: "Daily Production",
    columns: [
      { key: "date", label: "Date" },
      { key: "inputTon", label: "Input Ton", type: "number" },
      { key: "inputQty", label: "Input Qty", type: "number" },
      { key: "pickling", label: "Pickling", type: "number" },
      { key: "rolling", label: "Rolling", type: "number" },
      { key: "galv", label: "Galv", type: "number" },
    ],
    template: {
      date: "",
      inputTon: 0,
      inputQty: 0,
      pickling: 0,
      rolling: 0,
      galv: 0,
    },
  },
  {
    key: "cumulative",
    title: "Cumulative Production",
    columns: [
      { key: "date", label: "Date" },
      { key: "inputTon", label: "Input Ton", type: "number" },
      { key: "inputQty", label: "Input Qty", type: "number" },
      { key: "pickling", label: "Pickling", type: "number" },
      { key: "rolling", label: "Rolling", type: "number" },
      { key: "galv", label: "Galv", type: "number" },
      { key: "sold", label: "Sold", type: "number" },
    ],
    template: {
      date: "",
      inputTon: 0,
      inputQty: 0,
      pickling: 0,
      rolling: 0,
      galv: 0,
      sold: 0,
    },
  },
  {
    key: "coating",
    title: "Coating",
    columns: [
      { key: "thickness", label: "Thickness", type: "number" },
      { key: "width", label: "Width", type: "number" },
      { key: "weight", label: "Weight", type: "number" },
      { key: "theoZn", label: "Theo Zn", type: "number" },
      { key: "dross", label: "Dross", type: "number" },
      { key: "actual", label: "Actual", type: "number" },
    ],
    template: {
      thickness: 0,
      width: 1000,
      weight: 0,
      theoZn: 0,
      dross: 0,
      actual: 0,
    },
  },
  {
    key: "sales",
    title: "Sales",
    description: "Every row entered here is included in the dashboard sales report.",
    columns: [
      { key: "date", label: "Date" },
      { key: "buyer", label: "Buyer" },
      { key: "tonnage", label: "Tonnage", type: "number" },
      { key: "amount", label: "Amount", type: "number" },
    ],
    template: { date: "", buyer: "", tonnage: 0, amount: 0 },
  },
  {
    key: "plan",
    title: "Plan",
    columns: [
      { key: "date", label: "Date" },
      { key: "thickness", label: "Thickness" },
      { key: "width", label: "Width", type: "number" },
      { key: "tons", label: "Tons", type: "number" },
      { key: "status", label: "Status" },
    ],
    template: { date: "", thickness: "", width: 1000, tons: 0, status: "" },
  },
];

const MANAGEMENT_SECTIONS = [
  ["overall", "Overall Project Status"],
  ["production", "Production Status"],
  ["sales", "Sales Status"],
  ["inventory", "Inventory Status"],
  ["keyNote", "Key Management Note"],
] as const;

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

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mb-4 mt-1 text-xs text-muted-foreground">{description}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: any;
  type?: FieldType;
  onChange: (value: any) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        step={type === "number" ? "any" : undefined}
        className={`${inputCls} mt-1`}
        value={value ?? ""}
        onChange={(event) =>
          onChange(type === "number" ? parseNum(event.target.value) : event.target.value)
        }
      />
    </label>
  );
}

function ArrayTable({
  arr,
  columns,
  onUpdate,
  onRemove,
  onAdd,
}: {
  arr: AnyObj[];
  columns: ColumnDefinition[];
  onUpdate: (index: number, key: string, value: any) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              {columns.map((column) => (
                <th key={column.key} className="px-2 py-2 font-medium">
                  {column.label}
                </th>
              ))}
              <th className="px-2 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {arr.map((row, index) => (
              <tr key={index} className="border-b border-border/50">
                {columns.map((column) => (
                  <td key={column.key} className="px-2 py-1">
                    <input
                      type={column.type ?? "text"}
                      step={column.type === "number" ? "any" : undefined}
                      className={inputCls}
                      value={row[column.key] ?? ""}
                      onChange={(event) =>
                        onUpdate(
                          index,
                          column.key,
                          column.type === "number"
                            ? parseNum(event.target.value)
                            : event.target.value,
                        )
                      }
                    />
                  </td>
                ))}
                <td className="px-2 py-1 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {arr.length === 0 && (
        <p className="rounded-md border border-dashed border-border px-3 py-3 text-xs italic text-muted-foreground">
          No rows entered yet. Select “Add Row”.
        </p>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="rounded-md bg-secondary px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary/80"
      >
        + Add Row
      </button>
    </div>
  );
}

function DataTransformerPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<AnyObj>(() => cloneReport());
  const [message, setMessage] = useState<Message | null>(null);
  const [commit, setCommit] = useState<ApiResponse | null>(null);
  const lastPublishedJson = useRef(JSON.stringify(data));
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const publishSnapshot = useCallback(
    async (snapshot: AnyObj, mode: "auto" | "manual") => {
      const snapshotJson = JSON.stringify(snapshot);
      if (snapshotJson === lastPublishedJson.current) {
        setMessage({ tone: "success", text: "All changes are already saved." });
        return;
      }

      setSaving(true);
      setMessage({
        tone: "info",
        text:
          mode === "auto"
            ? "Saving changes automatically and starting deployment…"
            : "Saving changes now and starting deployment…",
      });

      const task = saveQueue.current.then(async () => {
        const result = await callPublisher({ action: "publish", password, data: snapshot });
        lastPublishedJson.current = snapshotJson;
        setCommit(result);
        setMessage({
          tone: "success",
          text:
            mode === "auto"
              ? "Changes saved automatically. Cloudflare deployment has started."
              : result.message || "Changes saved. Cloudflare deployment has started.",
        });
      });

      saveQueue.current = task.then(
        () => undefined,
        () => undefined,
      );

      try {
        await task;
      } catch (error) {
        setMessage({
          tone: "error",
          text: error instanceof Error ? error.message : "Automatic save failed.",
        });
      } finally {
        setSaving(false);
      }
    },
    [password],
  );

  useEffect(() => {
    if (!authed || revision === 0) return;
    const snapshotJson = JSON.stringify(data);
    if (snapshotJson === lastPublishedJson.current) return;

    setMessage({
      tone: "info",
      text: "Unsaved changes detected. Automatic save will run after 3 seconds of inactivity.",
    });

    const timer = window.setTimeout(() => {
      void publishSnapshot(JSON.parse(snapshotJson) as AnyObj, "auto");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [authed, data, publishSnapshot, revision]);

  const mutateData = (mutator: (next: AnyObj) => void) => {
    setData((previous) => {
      const next = JSON.parse(JSON.stringify(previous)) as AnyObj;
      mutator(next);
      return next;
    });
    setRevision((value) => value + 1);
  };

  const update = (path: (string | number)[], value: any) => {
    mutateData((next) => {
      let current: any = next;
      for (let index = 0; index < path.length - 1; index += 1) {
        const segment = path[index];
        if (current[segment] === undefined || current[segment] === null) {
          current[segment] = typeof path[index + 1] === "number" ? [] : {};
        }
        current = current[segment];
      }
      current[path[path.length - 1]] = value;
    });
  };

  const addRow = (key: string, template: AnyObj | string) => {
    mutateData((next) => {
      next[key] = [
        ...(next[key] ?? []),
        typeof template === "string" ? template : { ...template },
      ];
    });
  };

  const removeRow = (key: string, index: number) => {
    mutateData((next) => {
      next[key] = (next[key] ?? []).filter(
        (_: unknown, rowIndex: number) => rowIndex !== index,
      );
    });
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthenticating(true);
    setMessage(null);
    try {
      await callPublisher({ action: "verify", password });
      setAuthed(true);
      setMessage({
        tone: "success",
        text: "Password verified. Automatic save is active for every edit, add and delete action.",
      });
    } catch (error) {
      setMessage({
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

    setImporting(true);
    setMessage({ tone: "info", text: `Reading ${file.name}…` });
    try {
      const result = await importReportWorkbook(file, data);
      setData(result.data);
      setRevision((value) => value + 1);
      const warningText = result.warnings.length
        ? ` Warnings: ${result.warnings.join(" ")}`
        : "";
      setMessage({
        tone: "success",
        text: `Excel import completed. ${result.importedSections.length} sections were populated.${warningText} Automatic save is scheduled.`,
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "The Excel workbook could not be imported.",
      });
    } finally {
      setImporting(false);
    }
  };

  const exportBackup = () => {
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
          <h1 className="text-xl font-semibold">Live Data Entry</h1>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Use the Cloudflare Data Entry password. Changes are saved and deployed automatically.
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
          {message && (
            <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${statusClasses[message.tone]}`}>
              {message.text}
            </div>
          )}
        </form>
      </main>
    );
  }

  const renderArray = (section: ArraySection) => (
    <ArrayTable
      arr={(data[section.key] ?? []) as AnyObj[]}
      columns={section.columns}
      onUpdate={(index, key, value) => update([section.key, index, key], value)}
      onRemove={(index) => removeRow(section.key, index)}
      onAdd={() => addRow(section.key, section.template)}
    />
  );

  return (
    <main className="min-h-[calc(100vh-41px)] bg-background text-foreground">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              AKA Project Report
            </p>
            <h1 className="text-2xl font-semibold">Live Data Entry</h1>
            <p className="text-sm text-muted-foreground">
              Every field edit, row addition and row deletion is saved automatically after 3 seconds.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void publishSnapshot(JSON.parse(JSON.stringify(data)), "manual")}
              disabled={saving || importing}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save now & Deploy"}
            </button>
            <button
              type="button"
              onClick={exportBackup}
              className="rounded-md border border-border bg-secondary/40 px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Download JSON Backup
            </button>
          </div>
        </header>

        <div className="sticky top-12 z-30 rounded-xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Automatic publishing
              </p>
              <p className="text-xs text-muted-foreground">
                GitHub main branch → Cloudflare build → updated dashboard
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${saving ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
              {saving ? "Saving" : "Auto-save active"}
            </span>
          </div>
          {message && (
            <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${statusClasses[message.tone]}`}>
              {message.text}
              {commit?.commitUrl && (
                <a
                  href={commit.commitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 font-medium underline underline-offset-4"
                >
                  Open commit
                </a>
              )}
            </div>
          )}
        </div>

        <Card
          title="Import Excel Workbook"
          description="The official AKA workbook is imported, normalized and then saved automatically."
        >
          <label
            className={`inline-flex cursor-pointer items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 ${importing ? "pointer-events-none opacity-60" : ""}`}
          >
            {importing ? "Reading Excel…" : "Choose Excel File"}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              disabled={importing || saving}
              onChange={handleExcelImport}
            />
          </label>
        </Card>

        <Card title="Meta">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Report Date" value={data.reportDate} onChange={(value) => update(["reportDate"], value)} />
            <Field label="Version" value={data.version} onChange={(value) => update(["version"], value)} />
            <Field label="Zinc Purchased" value={data.zincPurchased} type="number" onChange={(value) => update(["zincPurchased"], value)} />
            <Field label="Zinc Remaining" value={data.zincRemaining} type="number" onChange={(value) => update(["zincRemaining"], value)} />
          </div>
        </Card>

        {data.totals && (
          <Card title="Totals">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Object.entries(data.totals).map(([key, value]) => (
                <Field key={key} label={key} value={value} type="number" onChange={(nextValue) => update(["totals", key], nextValue)} />
              ))}
            </div>
          </Card>
        )}

        {data.transport && (
          <Card title="Transport">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(data.transport).map(([key, value]) => (
                <Field key={key} label={key} value={value} type="number" onChange={(nextValue) => update(["transport", key], nextValue)} />
              ))}
            </div>
          </Card>
        )}

        {data.signature && (
          <Card title="Signature">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Object.entries(data.signature).map(([key, value]) => (
                <Field key={key} label={key} value={value} onChange={(nextValue) => update(["signature", key], nextValue)} />
              ))}
            </div>
          </Card>
        )}

        <Card title="Project Analysis">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {CONTENT_LANGUAGES.map(({ code, label, dir }) => (
              <label key={code} className="block">
                <span className="text-xs text-muted-foreground">{label}</span>
                <textarea
                  dir={dir}
                  className={`${inputCls} mt-1 min-h-[180px] text-sm leading-relaxed`}
                  value={localizedValue(data.projectAnalysis, code)}
                  onChange={(event) =>
                    update(
                      ["projectAnalysis"],
                      withLocalizedValue(data.projectAnalysis, code, event.target.value),
                    )
                  }
                />
              </label>
            ))}
          </div>
        </Card>

        <Card title="Management Commentary">
          <div className="space-y-5">
            {MANAGEMENT_SECTIONS.map(([key, label]) => (
              <div key={key}>
                <p className="mb-2 text-sm font-medium">{label}</p>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {CONTENT_LANGUAGES.map(({ code, label: languageLabel, dir }) => (
                    <label key={code} className="block">
                      <span className="text-xs text-muted-foreground">{languageLabel}</span>
                      <textarea
                        dir={dir}
                        className={`${inputCls} mt-1 min-h-[110px] text-sm leading-relaxed`}
                        value={localizedValue(data.managementCommentary?.[key], code)}
                        onChange={(event) =>
                          update(
                            ["managementCommentary", key],
                            withLocalizedValue(
                              data.managementCommentary?.[key],
                              code,
                              event.target.value,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {ARRAY_SECTIONS.map((section) => (
          <Card key={section.key} title={section.title} description={section.description}>
            {renderArray(section)}
          </Card>
        ))}

        <Card title="Notes">
          <div className="space-y-2">
            {(data.notes ?? []).map((note: any, index: number) => {
              const isObject = typeof note === "object" && note !== null;
              const value = isObject ? note.note ?? "" : note;
              return (
                <div key={index} className="flex gap-2">
                  <input
                    className={inputCls}
                    value={value}
                    onChange={(event) => update(["notes", index], isObject ? { ...note, note: event.target.value } : event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow("notes", index)}
                    className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => addRow("notes", "")}
              className="rounded-md bg-secondary px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary/80"
            >
              + Add Note
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
}
