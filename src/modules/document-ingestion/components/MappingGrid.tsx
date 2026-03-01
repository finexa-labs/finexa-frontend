import type { ExtendedMappingField } from "../documentKindConfig";
import type { ColumnMapping } from "../types";

const FIELD_LABELS: Record<ExtendedMappingField, string> = {
  date: "Fecha",
  amount: "Monto / Costo",
  currency: "Moneda",
  counterparty: "Contraparte",
  note: "Nota / Concepto / Nombre",
  category: "Categoría",
  account: "Cuenta (hint)",
  sku: "SKU",
  stock_qty: "Stock (qty)",
  spend_platform: "Plataforma Ads",
  week_start: "Semana inicio",
};

// All possible fields in display order
const ALL_FIELDS: ExtendedMappingField[] = [
  "date",
  "amount",
  "sku",
  "stock_qty",
  "currency",
  "counterparty",
  "note",
  "category",
  "account",
  "spend_platform",
  "week_start",
];

interface MappingGridProps {
  headers: string[];
  mapping: ColumnMapping;
  requiredFields?: ExtendedMappingField[];
  onChange: (field: ExtendedMappingField, colIndex: number | null) => void;
}

export function MappingGrid({ headers, mapping, requiredFields = [], onChange }: MappingGridProps) {
  // Show required first, then all others that have a mapping or are standard
  const standardFields: ExtendedMappingField[] = ["date", "amount", "currency", "counterparty", "note", "category", "account"];
  const extraFields: ExtendedMappingField[] = ["sku", "stock_qty", "spend_platform", "week_start"];

  // Determine which fields to show:
  // - Always show requiredFields
  // - Show standard fields that aren't extra-only
  // - Show extra fields only if they are required
  const required = new Set(requiredFields);
  const fieldsToShow = ALL_FIELDS.filter((f) => {
    if (required.has(f)) return true;
    if (extraFields.includes(f)) return false; // hide extras unless required
    return standardFields.includes(f);
  });

  return (
    <div className="flex flex-col gap-3">
      {fieldsToShow.map((field) => {
        const currentIdx = mapping[field as keyof ColumnMapping] ?? null;
        const isRequired = required.has(field);

        return (
          <div key={field} className="flex items-center gap-3">
            <div className="w-44 shrink-0">
              <span className="text-sm text-foreground">
                {FIELD_LABELS[field]}
                {isRequired && (
                  <span className="ml-1 text-red-400 text-xs">*</span>
                )}
              </span>
            </div>
            <select
              value={currentIdx !== null && currentIdx !== undefined ? String(currentIdx) : ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange(field, val === "" ? null : parseInt(val, 10));
              }}
              className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">— No mapear —</option>
              {headers.map((h, i) => (
                <option key={i} value={String(i)}>
                  Col {i + 1}: {h || `(vacío)`}
                </option>
              ))}
            </select>
            {currentIdx !== null && currentIdx !== undefined && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                → {headers[currentIdx] || `Col ${currentIdx + 1}`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
