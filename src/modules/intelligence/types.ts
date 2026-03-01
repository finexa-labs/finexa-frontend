// ─── Smart Entry ──────────────────────────────────────────────────────────────

export interface ExpenseDraft {
  amount_value: string | null;
  amount_currency: string;
  date: string | null;
  counterparty: string | null;
  category_slug: string | null;
  note: string | null;
  account_id: string | null;
  confidence: number;
  warnings: string[];
}

export type SmartEntryStatus =
  | "idle"
  | "loading"
  | "draft"
  | "confirmed"
  | "error";

export interface SmartEntryState {
  status: SmartEntryStatus;
  text: string;
  draft: ExpenseDraft | null;
  error: string | null;
}

// ─── Doc AI ──────────────────────────────────────────────────────────────────

export type KindConfidence = "high" | "medium" | "low";

export interface KindSuggestion {
  kind: string;
  confidence: KindConfidence;
  score: number;
  reasons: string[];
  source: "heuristic" | "ai";
}

export interface MappingSuggestion {
  mapping: Record<string, number | null>;
  confidence: number;
  notes: string[];
}

// ─── Intelligence Limits ──────────────────────────────────────────────────────

export interface IntelligenceLimits {
  year_month: string;
  tokens_used: number;
  monthly_token_limit: number;
  session_token_limit: number;
  enable_intelligence: boolean;
  enable_smart_entry: boolean;
  enable_doc_ai: boolean;
  provider: string;
  model: string;
}
