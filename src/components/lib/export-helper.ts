import {
  escapeDelimitedValue,
  escapeIdentity,
  escapeSqlValue,
} from "@/drivers/sqlite/sql-helper";
import OptimizeTableState from "../gui/table-optimized/OptimizeTableState";
import {
  ExportOptions,
  ExportSelection,
  ExportTarget,
} from "../gui/export/export-result-button";
import { toast } from "sonner";
import { getSingleTableName } from "../gui/tabs/query-tab";

export function selectArrayFromIndexList<T = unknown>(
  data: T[],
  indexList: number[]
): T[] {
  return indexList.map((index) => data[index]) as T[];
}

export function exportRowsToSqlInsert(
  tableName: string,
  headers: string[],
  records: unknown[][],
  exportTarget?: ExportTarget
): string {
  const result: string[] = [];

  const headersPart = headers.map(escapeIdentity).join(", ");

  for (const record of records) {
    const valuePart = record.map(escapeSqlValue).join(", ");
    const line = `INSERT INTO ${escapeIdentity(
      tableName
    )}(${headersPart}) VALUES(${valuePart});`;

    result.push(line);
  }

  const content = result.join("\n");
  if (exportTarget === "clipboard") {
    copyToClipboard(content);
    return "";
  }
  return content;
}

function cellToExcelValue(value: unknown) {
  if (value === undefined) return "";
  if (value === null) return "NULL";
  const parsed = Number(value);
  return isNaN(parsed) ? value : parsed;
}

export function exportRowsToExcel(records: unknown[][]) {
  const result: string[] = [];

  for (const record of records) {
    const line = record.map(cellToExcelValue).join("\t");
    result.push(line);
  }

  return result.join("\r\n");
}

export function exportToExcel(
  records: unknown[][],
  headers: string[],
  tablename: string,
  exportTarget: ExportTarget
) {
  if (exportTarget === "clipboard") {
    exportDataAsDelimitedText(headers, records, "\t", "\r\n", '"', "clipboard");
    return "";
  }

  const processedData = records.map((row) =>
    row.map((cell) => {
      return cellToExcelValue(cell);
    })
  );

  const data = [headers, ...processedData];

  import("xlsx").then((module) => {
    const XLSX = module;
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "sheet1");
    XLSX.writeFile(workbook, `${tablename}.xlsx`);
  });

  return "";
}

export function exportRowsToJson(
  headers: string[],
  records: unknown[][],
  exportTarget?: ExportTarget
): string {
  const recordsWithBigIntAsString = records.map((record) =>
    record.map((value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

  const recordsAsObjects = recordsWithBigIntAsString.map((record) =>
    record.reduce<Record<string, unknown>>((obj, value, index) => {
      const header = headers[index];
      if (header !== undefined) {
        obj[header] = value;
      }
      return obj;
    }, {})
  );

  const content = JSON.stringify(recordsAsObjects, null, 2);

  if (exportTarget === "clipboard") {
    copyToClipboard(content);
    return "";
  }

  return content;
}

export function exportDataAsDelimitedText(
  headers: string[],
  records: unknown[][],
  fieldSeparator: string,
  lineTerminator: string,
  textEncloser: string,
  exportTarget: ExportTarget
): string {
  const result: string[] = [];

  // Add headers
  const escapedHeaders = headers.map((v) =>
    escapeDelimitedValue(v, fieldSeparator, lineTerminator, textEncloser)
  );
  const headerLine = escapedHeaders.join(fieldSeparator);
  if (headers.length > 0) result.push(headerLine);

  // Add records
  for (const record of records) {
    const escapedRecord = record.map((v) =>
      escapeDelimitedValue(v, fieldSeparator, lineTerminator, textEncloser)
    );
    const recordLine = escapedRecord.join(fieldSeparator);
    result.push(recordLine);
  }

  const content = result.join(lineTerminator);

  if (exportTarget === "clipboard") {
    copyToClipboard(content);
    return "";
  }
  return content;
}

export function getFormatHandlers(
  data: OptimizeTableState,
  exportTarget: ExportTarget,
  exportSelection: ExportSelection,
  exportOptions: ExportOptions | null,
  selectedRangeIndex: number
): Record<string, (() => string) | undefined> {
  const tableName = getSingleTableName(data.getSql()) || "UnknownTable";
  let headers: string[] = [];
  let records: unknown[][] = [];

  // Handle export selection
  if (exportSelection === "complete") {
    headers = data.getHeaders().map((header) => header.name);
    records = data
      .getAllRows()
      .map((row) => headers.map((header) => row.raw[header]));
  } else if (exportSelection === "selected_row") {
    headers = data.getHeaders().map((header) => header.name);
    records = selectArrayFromIndexList(
      data.getAllRows(),
      data.getSelectedRowIndex()
    ).map((row) => headers.map((header) => row.raw[header]));
  } else if (exportSelection === "selected_col") {
    headers = data
      .getHeaders()
      .filter((_, index) => data.getFullSelectionColsIndex().includes(index))
      .map((header) => header.name);
    records = data
      .getAllRows()
      .map((row) => headers.map((header) => row.raw[header]));
  } else if (exportSelection === "selected_range" && selectedRangeIndex >= 0) {
    const selectedRange = data.getSelectionRanges()[selectedRangeIndex];
    headers = data
      .getHeaders()
      .filter(
        (_, index) => index >= selectedRange.x1 && index <= selectedRange.x2
      )
      .map((header) => header.name);
    records = data
      .getAllRows()
      .filter(
        (_, index) => index >= selectedRange.y1 && index <= selectedRange.y2
      )
      .map((row) => headers.map((header) => row.raw[header]));
  }

  return {
    csv: () =>
      exportDataAsDelimitedText(headers, records, ",", "\n", '"', exportTarget),
    json: () => exportRowsToJson(headers, records, exportTarget),
    sql: () => exportRowsToSqlInsert(tableName, headers, records, exportTarget),
    xlsx: () => exportToExcel(records, headers, tableName, exportTarget),
    delimited: () =>
      exportDataAsDelimitedText(
        headers,
        records,
        parseUserInput(exportOptions?.fieldSeparator || "") || ",",
        parseUserInput(exportOptions?.lineTerminator || "") || "\n",
        parseUserInput(exportOptions?.encloser || "") || '"',
        exportTarget
      ),
  };
}

function parseUserInput(input: string): string {
  return input
    .replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\")
    .replace(/\\r/g, "\r");
}

function copyToClipboard(content: string) {
  navigator.clipboard
    .writeText(content)
    .then(() => toast.success("Copied to clipboard"))
    .catch(() => toast.error("Failed to copy to clipboard"));
}

export function convertExcelStringToArray(data: string): string[][] {
  const lines = data.split("\r\n");
  return lines.map((line) => line.split("\t"));
}
