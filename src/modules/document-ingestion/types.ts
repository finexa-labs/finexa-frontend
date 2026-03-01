// ─── Source ──────────────────────────────────────────────────────────────────

export type ImportSourceType = "csv" | "google_sheets";

export interface ImportSource {
  id: string;
  source_type: ImportSourceType;
  reference: string;
  tab_name: string | null;
  google_email: string | null;
  created_at: string;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

export type ImportRunStatus =
  | "pending"
  | "analyzing"
  | "ready"
  | "committing"
  | "done"
  | "failed";

export interface RunStats {
  to_import: number;
  to_skip: number;
  needs_review: number;
  errors: number;
  total: number;
  committed?: number;
  commit_errors?: number;
}

export interface ImportRun {
  id: string;
  owner_id: string;
  source_id: string | null;
  status: ImportRunStatus;
  headers: string[] | null;
  sample_rows: string[][] | null;
  total_rows: number | null;
  detected_columns: ColumnMapping | null;
  column_mapping: ColumnMapping | null;
  account_id: string | null;
  stats: RunStats | null;
  document_kind: string | null;
  defaults: Record<string, string> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Column Mapping ───────────────────────────────────────────────────────────

export interface ColumnMapping {
  date: number | null;
  amount: number | null;
  currency: number | null;
  counterparty: number | null;
  note: number | null;
  category: number | null;
  account: number | null;
  // Extended fields for non-expense kinds
  sku?: number | null;
  stock_qty?: number | null;
  spend_platform?: number | null;
  week_start?: number | null;
}

export const MAPPING_FIELDS = [
  "date",
  "amount",
  "currency",
  "counterparty",
  "note",
  "category",
  "account",
] as const;

export type MappingField = (typeof MAPPING_FIELDS)[number];

// ─── Row Decisions ────────────────────────────────────────────────────────────

export type RowDecision = "import" | "skip" | "needs_user_action" | "error";

export interface ImportRowDecision {
  id: string;
  run_id: string;
  row_index: number;
  raw_row: Record<string, string>;
  mapped: MappedRow | null;
  decision: RowDecision;
  dedup_score: number | null;
  candidate_expense_id: string | null;
  detected_category_id: string | null;
  detected_counterparty_id: string | null;
  created_expense_id: string | null;
  error_detail: string | null;
}

export interface MappedRow {
  date: string | null;
  amount_value: string | null;
  amount_currency: string;
  counterparty: string | null;
  note: string | null;
  category_slug: string | null;
  account_hint: string | null;
  error: string | null;
  // Extended for non-expense kinds
  sku?: string | null;
  product_name?: string | null;
  stock_qty?: string | null;
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export interface GoogleStatus {
  connected: boolean;
  email: string | null;
}

export interface SheetItem {
  id: string;
  name: string;
}

export interface TabItem {
  id: number;
  title: string;
}

export interface SheetPreview {
  headers: string[];
  sample_rows: string[][];
  total_rows_approx: number;
  error?: string;
}

// ─── Wizard state ─────────────────────────────────────────────────────────────

export type WizardStep = "kind" | "source" | "preview" | "mapping" | "review";

export interface WizardState {
  step: WizardStep;
  // Kind
  documentKind: string;  // DocumentKind value
  // Source
  sourceType: ImportSourceType;
  csvContent: string;
  csvFileName: string;
  sheetsSpreadsheetId: string;
  sheetsSpreadsheetName: string;
  sheetsTabName: string;
  // Parsed
  headers: string[];
  allRows: string[][];
  sampleRows: string[][];
  // Run
  runId: string | null;
  run: ImportRun | null;
  // Mapping
  columnMapping: ColumnMapping;
  accountId: string;
  dateFormat: string;
  invertSign: boolean;
  // Decisions
  decisions: ImportRowDecision[];
}
