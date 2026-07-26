type ReportData = Record<string, any>;
type CellValue = string | number | boolean | null;
type SheetRows = Record<string, CellValue[][]>;

type ZipEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

type ParsedWorkbook = {
  sheets: SheetRows;
  date1904: boolean;
};

export type ExcelImportResult = {
  data: ReportData;
  importedSections: string[];
  warnings: string[];
};

const textDecoder = new TextDecoder("utf-8");
const RELATIONSHIP_NS =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

const normalizeText = (value: unknown) => String(value ?? "").trim();
const normalizeHeader = (value: unknown) =>
  normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "");

const isBlank = (value: unknown) =>
  value === null || value === undefined || normalizeText(value) === "";

const toNumber = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = normalizeText(value).replace(/,/g, "");
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toText = (value: unknown) => normalizeText(value);

const withEnglishTranslation = (current: unknown, english: string) => ({
  ...(current && typeof current === "object" && !Array.isArray(current)
    ? current
    : {}),
  en: english,
});

const columnIndexFromReference = (reference: string) => {
  const letters = reference.match(/[A-Z]+/i)?.[0]?.toUpperCase() ?? "A";
  let index = 0;
  for (const letter of letters) index = index * 26 + letter.charCodeAt(0) - 64;
  return Math.max(0, index - 1);
};

const joinPath = (base: string, target: string) => {
  if (target.startsWith("/")) return target.slice(1);
  const parts = `${base}/${target}`.split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") resolved.pop();
    else resolved.push(part);
  }
  return resolved.join("/");
};

const findEndOfCentralDirectory = (bytes: Uint8Array) => {
  const minOffset = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - 22; offset >= minOffset; offset -= 1) {
    if (
      bytes[offset] === 0x50 &&
      bytes[offset + 1] === 0x4b &&
      bytes[offset + 2] === 0x05 &&
      bytes[offset + 3] === 0x06
    ) {
      return offset;
    }
  }
  throw new Error("The selected file is not a valid XLSX workbook.");
};

const readZipDirectory = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(bytes);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const entries = new Map<string, ZipEntry>();
  let offset = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("The XLSX ZIP directory is damaged.");
    }
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = textDecoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength));
    entries.set(name, { name, compressionMethod, compressedSize, localHeaderOffset });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return { bytes, view, entries };
};

const inflateRaw = async (data: Uint8Array) => {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot decompress XLSX files. Use a current version of Chrome or Edge.");
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const readZipEntry = async (
  archive: ReturnType<typeof readZipDirectory>,
  path: string,
) => {
  const entry = archive.entries.get(path);
  if (!entry) return null;
  const { bytes, view } = archive;
  const offset = entry.localHeaderOffset;
  if (view.getUint32(offset, true) !== 0x04034b50) {
    throw new Error(`The XLSX entry ${path} is damaged.`);
  }
  const fileNameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = bytes.slice(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) return compressed;
  if (entry.compressionMethod === 8) return inflateRaw(compressed);
  throw new Error(`Unsupported XLSX compression method: ${entry.compressionMethod}`);
};

const readXml = async (
  archive: ReturnType<typeof readZipDirectory>,
  path: string,
) => {
  const bytes = await readZipEntry(archive, path);
  if (!bytes) return null;
  const xml = new DOMParser().parseFromString(textDecoder.decode(bytes), "application/xml");
  if (xml.getElementsByTagName("parsererror").length > 0) {
    throw new Error(`Unable to read ${path} from the XLSX workbook.`);
  }
  return xml;
};

const extractElementText = (element: Element | null) => {
  if (!element) return "";
  return Array.from(element.getElementsByTagName("t"))
    .map((node) => node.textContent ?? "")
    .join("");
};

const parseSharedStrings = (xml: Document | null) => {
  if (!xml) return [];
  return Array.from(xml.getElementsByTagName("si")).map((item) => extractElementText(item));
};

const parseDateStyles = (xml: Document | null) => {
  if (!xml) return new Set<number>();
  const customFormats = new Map<number, string>();
  for (const item of Array.from(xml.getElementsByTagName("numFmt"))) {
    customFormats.set(
      Number(item.getAttribute("numFmtId")),
      item.getAttribute("formatCode") ?? "",
    );
  }

  const builtInDateFormats = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);
  const dateStyles = new Set<number>();
  const cellXfs = xml.getElementsByTagName("cellXfs")[0];
  if (!cellXfs) return dateStyles;

  Array.from(cellXfs.getElementsByTagName("xf")).forEach((item, index) => {
    const numberFormatId = Number(item.getAttribute("numFmtId") ?? 0);
    const custom = (customFormats.get(numberFormatId) ?? "")
      .replace(/"[^"]*"/g, "")
      .replace(/\\./g, "");
    if (builtInDateFormats.has(numberFormatId) || /[ymdhis]/i.test(custom)) {
      dateStyles.add(index);
    }
  });
  return dateStyles;
};

const excelDateToIso = (serial: number, date1904: boolean) => {
  const unixDays = serial - (date1904 ? 24_107 : 25_569);
  const date = new Date(Math.round(unixDays * 86_400_000));
  return Number.isNaN(date.getTime()) ? String(serial) : date.toISOString().slice(0, 10);
};

const parseSheetRows = (
  xml: Document,
  sharedStrings: string[],
  dateStyles: Set<number>,
  date1904: boolean,
) => {
  const rows: CellValue[][] = [];
  for (const rowNode of Array.from(xml.getElementsByTagName("row"))) {
    const rowNumber = Number(rowNode.getAttribute("r") ?? rows.length + 1);
    const row: CellValue[] = [];
    for (const cell of Array.from(rowNode.getElementsByTagName("c"))) {
      const reference = cell.getAttribute("r") ?? "A1";
      const columnIndex = columnIndexFromReference(reference);
      const type = cell.getAttribute("t") ?? "n";
      const styleIndex = Number(cell.getAttribute("s") ?? -1);
      const raw = cell.getElementsByTagName("v")[0]?.textContent ?? "";
      let value: CellValue = null;

      if (type === "s") value = sharedStrings[Number(raw)] ?? "";
      else if (type === "inlineStr") value = extractElementText(cell.getElementsByTagName("is")[0] ?? null);
      else if (type === "str") value = raw;
      else if (type === "b") value = raw === "1";
      else if (raw !== "") {
        const numeric = Number(raw);
        value = Number.isFinite(numeric)
          ? dateStyles.has(styleIndex)
            ? excelDateToIso(numeric, date1904)
            : numeric
          : raw;
      }
      row[columnIndex] = value;
    }
    rows[rowNumber - 1] = row;
  }
  return rows.map((row) => row ?? []);
};

const parseWorkbook = async (buffer: ArrayBuffer): Promise<ParsedWorkbook> => {
  const archive = readZipDirectory(buffer);
  const workbookXml = await readXml(archive, "xl/workbook.xml");
  const relationshipsXml = await readXml(archive, "xl/_rels/workbook.xml.rels");
  if (!workbookXml || !relationshipsXml) {
    throw new Error("The workbook is missing required XLSX files.");
  }

  const date1904 = workbookXml.getElementsByTagName("workbookPr")[0]?.getAttribute("date1904") === "1";
  const sharedStrings = parseSharedStrings(await readXml(archive, "xl/sharedStrings.xml"));
  const dateStyles = parseDateStyles(await readXml(archive, "xl/styles.xml"));
  const relationships = new Map<string, string>();
  for (const relationship of Array.from(relationshipsXml.getElementsByTagName("Relationship"))) {
    relationships.set(
      relationship.getAttribute("Id") ?? "",
      relationship.getAttribute("Target") ?? "",
    );
  }

  const sheets: SheetRows = {};
  for (const sheet of Array.from(workbookXml.getElementsByTagName("sheet"))) {
    const name = sheet.getAttribute("name") ?? "";
    const relationshipId = sheet.getAttributeNS(RELATIONSHIP_NS, "id") ?? sheet.getAttribute("r:id") ?? "";
    const target = relationships.get(relationshipId);
    if (!name || !target) continue;
    const path = joinPath("xl", target);
    const sheetXml = await readXml(archive, path);
    if (sheetXml) sheets[name] = parseSheetRows(sheetXml, sharedStrings, dateStyles, date1904);
  }
  return { sheets, date1904 };
};

const findHeader = (rows: CellValue[][], requiredHeaders: string[]) => {
  const required = requiredHeaders.map(normalizeHeader);
  for (let index = 0; index < rows.length; index += 1) {
    const normalized = (rows[index] ?? []).map(normalizeHeader);
    if (required.every((header) => normalized.includes(header))) {
      return { index, normalized };
    }
  }
  return null;
};

const objectRows = (
  rows: CellValue[][] | undefined,
  columnMap: Record<string, string>,
) => {
  if (!rows) return [];
  const expected = Object.keys(columnMap);
  const header = findHeader(rows, expected);
  if (!header) return [];
  const positions = new Map<string, number>();
  header.normalized.forEach((value, index) => positions.set(value, index));

  return rows.slice(header.index + 1).flatMap((row) => {
    const result: ReportData = {};
    let hasValue = false;
    for (const [headerName, outputKey] of Object.entries(columnMap)) {
      const value = row[positions.get(normalizeHeader(headerName)) ?? -1] ?? null;
      if (!isBlank(value)) hasValue = true;
      result[outputKey] = value;
    }
    return hasValue ? [result] : [];
  });
};

const keyValueRows = (rows: CellValue[][] | undefined) => {
  const values: Record<string, CellValue> = {};
  if (!rows) return values;
  const header = findHeader(rows, ["Key", "Value"]);
  if (!header) return values;
  const keyIndex = header.normalized.indexOf("key");
  const valueIndex = header.normalized.indexOf("value");
  for (const row of rows.slice(header.index + 1)) {
    const key = normalizeText(row[keyIndex]);
    const value = row[valueIndex];
    if (key && !isBlank(value)) values[key] = value;
  }
  return values;
};

const textAfterHeader = (rows: CellValue[][] | undefined, headerName: string) => {
  if (!rows) return "";
  const header = findHeader(rows, [headerName]);
  if (!header) return "";
  return rows
    .slice(header.index + 1)
    .flatMap((row) => row)
    .filter((value) => !isBlank(value))
    .map(toText)
    .join("\n")
    .trim();
};

const setArrayIfPresent = (
  next: ReportData,
  importedSections: string[],
  key: string,
  rows: ReportData[],
  transform: (row: ReportData) => ReportData,
) => {
  if (rows.length === 0) return;
  next[key] = rows.map(transform);
  importedSections.push(key);
};

export const importReportWorkbook = async (
  file: File,
  currentData: ReportData,
): Promise<ExcelImportResult> => {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Please select an .xlsx Excel file.");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("The Excel file is too large. The maximum supported size is 15 MB.");
  }

  const workbook = await parseWorkbook(await file.arrayBuffer());
  const next = JSON.parse(JSON.stringify(currentData)) as ReportData;
  const importedSections: string[] = [];
  const warnings: string[] = [];

  const meta = keyValueRows(workbook.sheets.Meta);
  for (const key of ["reportDate", "version"]) {
    if (!isBlank(meta[key])) next[key] = toText(meta[key]);
  }
  for (const key of ["zincPurchased", "zincRemaining"]) {
    if (!isBlank(meta[key])) next[key] = toNumber(meta[key]);
  }
  if (Object.keys(meta).length > 0) importedSections.push("meta");

  const totals = keyValueRows(workbook.sheets.Totals);
  if (Object.keys(totals).length > 0) {
    next.totals = { ...(next.totals ?? {}) };
    for (const [key, value] of Object.entries(totals)) next.totals[key] = toNumber(value);
    importedSections.push("totals");
  }

  const transport = keyValueRows(workbook.sheets.Transport);
  if (Object.keys(transport).length > 0) {
    next.transport = { ...(next.transport ?? {}) };
    for (const [key, value] of Object.entries(transport)) next.transport[key] = toNumber(value);
    importedSections.push("transport");
  }

  const signature = keyValueRows(workbook.sheets.Signature);
  if (Object.keys(signature).length > 0) {
    next.signature = { ...(next.signature ?? {}) };
    for (const [key, value] of Object.entries(signature)) next.signature[key] = toText(value);
    importedSections.push("signature");
  }

  const projectAnalysis = textAfterHeader(workbook.sheets["Project Analysis"], "Analysis Text");
  if (projectAnalysis) {
    next.projectAnalysis = withEnglishTranslation(next.projectAnalysis, projectAnalysis);
    importedSections.push("projectAnalysis");
  }

  const commentaryRows = objectRows(workbook.sheets["Management Commentary"], {
    Key: "key",
    Commentary: "commentary",
  });
  if (commentaryRows.length > 0) {
    next.managementCommentary = { ...(next.managementCommentary ?? {}) };
    for (const row of commentaryRows) {
      const key = toText(row.key);
      if (key && !isBlank(row.commentary)) {
        next.managementCommentary[key] = withEnglishTranslation(
          next.managementCommentary[key],
          toText(row.commentary),
        );
      }
    }
    importedSections.push("managementCommentary");
  }

  setArrayIfPresent(
    next,
    importedSections,
    "coilInventory",
    objectRows(workbook.sheets["Coil Inventory"], {
      "Thickness (mm)": "thickness",
      "Width (mm)": "width",
      "Available Tonnage": "tonnage",
    }),
    (row) => ({
      thickness: toNumber(row.thickness),
      width: toNumber(row.width),
      tonnage: toNumber(row.tonnage),
    }),
  );

  setArrayIfPresent(next, importedSections, "warehouse", objectRows(workbook.sheets.Warehouse, { Name: "name", Ton: "ton" }), (row) => ({ name: toText(row.name), ton: toNumber(row.ton) }));
  setArrayIfPresent(next, importedSections, "scrap", objectRows(workbook.sheets.Scrap, { Line: "line", Ton: "ton" }), (row) => ({ line: toText(row.line), ton: toNumber(row.ton) }));
  setArrayIfPresent(next, importedSections, "materialBalance", objectRows(workbook.sheets["Material Balance"], { Key: "k", Value: "v" }), (row) => ({ k: toText(row.k), v: toNumber(row.v) }));
  setArrayIfPresent(next, importedSections, "yields", objectRows(workbook.sheets.Yields, { Process: "process", Formula: "formula", Value: "value" }), (row) => ({ process: toText(row.process), formula: toText(row.formula), value: toNumber(row.value) }));
  setArrayIfPresent(next, importedSections, "daily", objectRows(workbook.sheets.Daily, { Date: "date", "Input Ton": "inputTon", "Input Qty": "inputQty", Pickling: "pickling", Rolling: "rolling", Galv: "galv" }), (row) => ({ date: toText(row.date), inputTon: toNumber(row.inputTon), inputQty: toNumber(row.inputQty), pickling: toNumber(row.pickling), rolling: toNumber(row.rolling), galv: toNumber(row.galv) }));
  setArrayIfPresent(next, importedSections, "cumulative", objectRows(workbook.sheets.Cumulative, { Date: "date", "Input Ton": "inputTon", "Input Qty": "inputQty", Pickling: "pickling", Rolling: "rolling", Galv: "galv", Sold: "sold" }), (row) => ({ date: toText(row.date), inputTon: toNumber(row.inputTon), inputQty: toNumber(row.inputQty), pickling: toNumber(row.pickling), rolling: toNumber(row.rolling), galv: toNumber(row.galv), sold: toNumber(row.sold) }));
  setArrayIfPresent(next, importedSections, "coating", objectRows(workbook.sheets.Coating, { Thickness: "thickness", Width: "width", Weight: "weight", "Theo Zn": "theoZn", Dross: "dross", Actual: "actual" }), (row) => ({ thickness: toNumber(row.thickness), width: toNumber(row.width), weight: toNumber(row.weight), theoZn: toNumber(row.theoZn), dross: toNumber(row.dross), actual: toNumber(row.actual) }));
  setArrayIfPresent(next, importedSections, "sales", objectRows(workbook.sheets.Sales, { Date: "date", Buyer: "buyer", Tonnage: "tonnage", Amount: "amount" }), (row) => ({ date: toText(row.date), buyer: toText(row.buyer), tonnage: toNumber(row.tonnage), amount: toNumber(row.amount) }));
  setArrayIfPresent(next, importedSections, "plan", objectRows(workbook.sheets.Plan, { Date: "date", Thickness: "thickness", Width: "width", Tons: "tons", Status: "status" }), (row) => ({ date: toText(row.date), thickness: toText(row.thickness), width: toNumber(row.width), tons: toNumber(row.tons), status: toText(row.status) }));

  const noteRows = objectRows(workbook.sheets.Notes, { Note: "note" });
  if (noteRows.length > 0) {
    next.notes = noteRows.map((row) => toText(row.note)).filter(Boolean);
    importedSections.push("notes");
  }

  if (importedSections.length === 0) {
    throw new Error("No recognized AKA report data was found. Please use the official Excel template without renaming sheets or headers.");
  }

  const expectedSheets = ["Meta", "Totals", "Coil Inventory"];
  for (const sheetName of expectedSheets) {
    if (!workbook.sheets[sheetName]) warnings.push(`Sheet “${sheetName}” was not found.`);
  }

  return { data: next, importedSections, warnings };
};
