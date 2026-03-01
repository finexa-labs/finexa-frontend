/**
 * CSV parsing utilities for the Document Ingestion module.
 * Handles comma and tab delimiters, quoted fields, BOM stripping.
 */

export function parseCSV(raw: string): { headers: string[]; rows: string[][] } {
  // Strip BOM
  const content = raw.startsWith("\uFEFF") ? raw.slice(1) : raw;
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };

  // Detect delimiter: use tab if found more tabs than commas in first line
  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = tabCount > commaCount ? "\t" : ",";

  const parsed = lines.map((line) => parseLine(line, delimiter));
  const headers = parsed[0].map((h) => h.trim());
  const rows = parsed.slice(1);

  return { headers, rows };
}

function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/** Format a number as a localized currency string */
export function formatCurrency(value: number | string | null | undefined, currency = "ARS"): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Map decision value to a display label */
export function decisionLabel(decision: string): string {
  const map: Record<string, string> = {
    import: "Importar",
    skip: "Omitir",
    needs_user_action: "Revisar",
    error: "Error",
  };
  return map[decision] ?? decision;
}

/** Map decision to a color class */
export function decisionColor(decision: string): string {
  const map: Record<string, string> = {
    import: "text-emerald-400",
    skip: "text-muted-foreground",
    needs_user_action: "text-amber-400",
    error: "text-red-400",
  };
  return map[decision] ?? "";
}

/** Truncate a string to maxLen chars */
export function truncate(s: string | null | undefined, maxLen = 40): string {
  if (!s) return "";
  return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
}
