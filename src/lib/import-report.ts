import {
  importReportWorkbook as importRawReportWorkbook,
  type ExcelImportResult,
} from "./xlsx-import";

type ReportData = Record<string, any>;
type NumericRow = Record<string, unknown>;

const PROCESS_KEYS = [
  ["pickling", "pickling"],
  ["rolling", "rolling"],
  ["galv", "galvanized"],
] as const;

const toFiniteNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const shouldScaleByHundred = (expected: number, observed: number) => {
  if (expected <= 0 || observed <= 0) return false;
  const ratio = expected / observed;
  return ratio >= 90 && ratio <= 110;
};

const normalizeDaily = (data: ReportData, warnings: string[]) => {
  if (!Array.isArray(data.daily) || !data.totals) return;

  const rows = data.daily as NumericRow[];
  let changed = false;

  for (const [rowKey, totalKey] of PROCESS_KEYS) {
    const expected = toFiniteNumber(data.totals[totalKey]);
    const observed = rows.reduce((sum, row) => sum + toFiniteNumber(row[rowKey]), 0);
    if (!shouldScaleByHundred(expected, observed)) continue;

    for (const row of rows) row[rowKey] = toFiniteNumber(row[rowKey]) * 100;
    changed = true;
  }

  if (changed) {
    warnings.push(
      "Daily production cells were percentage-scaled in Excel and were automatically restored to their full numeric values.",
    );
  }
};

const lastPositiveValue = (rows: NumericRow[], key: string) => {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const value = toFiniteNumber(rows[index]?.[key]);
    if (value > 0) return value;
  }
  return 0;
};

const normalizeCumulative = (data: ReportData, warnings: string[]) => {
  if (!Array.isArray(data.cumulative) || !data.totals) return;

  const rows = data.cumulative as NumericRow[];
  let changed = false;

  for (const [rowKey, totalKey] of PROCESS_KEYS) {
    const expected = toFiniteNumber(data.totals[totalKey]);
    const observed = lastPositiveValue(rows, rowKey);
    if (!shouldScaleByHundred(expected, observed)) continue;

    for (const row of rows) row[rowKey] = toFiniteNumber(row[rowKey]) * 100;
    changed = true;
  }

  const expectedSold = toFiniteNumber(data.totals.sold);
  const observedSold = lastPositiveValue(rows, "sold");
  if (shouldScaleByHundred(expectedSold, observedSold)) {
    for (const row of rows) row.sold = toFiniteNumber(row.sold) * 100;
    changed = true;
  }

  if (changed) {
    warnings.push(
      "Cumulative production cells were percentage-scaled in Excel and were automatically restored to their full numeric values.",
    );
  }
};

const normalizeSales = (data: ReportData) => {
  if (!Array.isArray(data.sales)) data.sales = [];

  data.sales = data.sales.map((row: NumericRow) => ({
    date: String(row?.date ?? "").trim(),
    buyer: String(row?.buyer ?? "").trim(),
    tonnage: toFiniteNumber(row?.tonnage),
    amount: toFiniteNumber(row?.amount),
  }));
};

export const importReportWorkbook = async (
  file: File,
  currentData: ReportData,
): Promise<ExcelImportResult> => {
  const result = await importRawReportWorkbook(file, currentData);
  const data = JSON.parse(JSON.stringify(result.data)) as ReportData;
  const warnings = [...result.warnings];

  normalizeDaily(data, warnings);
  normalizeCumulative(data, warnings);
  normalizeSales(data);

  return {
    ...result,
    data,
    warnings,
  };
};

export type { ExcelImportResult };
