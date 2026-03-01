// ─── Accounts ────────────────────────────────────────────────────────────────
export type AccountType = "BANK" | "MP" | "WALLET";
export type AccountStatus = "active" | "archived";

export interface Account {
  id: string;
  owner_id: string;
  name: string;
  type: AccountType;
  currency: string;
  status: AccountStatus;
  bank_type: string | null;
  color: string;
}

// ─── Categories ──────────────────────────────────────────────────────────────
export type CategoryType = "fixed" | "variable" | "special";

export interface Category {
  id: string;
  owner_id: string | null;
  name: string;
  type: CategoryType;
  parent_id: string | null;
  is_global: boolean;
}

// ─── Counterparties ──────────────────────────────────────────────────────────
export type CounterpartyType = "provider" | "employee" | "tax_agency" | "other";

export interface Counterparty {
  id: string;
  owner_id: string;
  name: string;
  type: CounterpartyType;
}

// ─── Expenses ────────────────────────────────────────────────────────────────
export type ExpenseStatus = "confirmed" | "pending" | "needs_review";
export type ExpenseOrigin =
  | "manual_form"
  | "reconciliation_suggested"
  | "import_statement"
  | "integration_mp"
  | "chat_llm";

export interface Expense {
  id: string;
  owner_id: string;
  account_id: string;
  amount_value: number;
  amount_currency: string;
  date: string;
  category_id: string | null;
  counterparty_id: string | null;
  note: string | null;
  tags: Record<string, unknown> | null;
  status: ExpenseStatus;
  origin: ExpenseOrigin;
  is_owner_withdrawal: boolean;
  parent_expense_id: string | null;
}

// ─── Recurring ───────────────────────────────────────────────────────────────
export type RuleStatus = "active" | "paused" | "archived";
export type InstanceStatus = "pending" | "confirmed" | "skipped";

export interface RecurringRule {
  id: string;
  owner_id: string;
  name: string;
  amount_value: number;
  amount_currency: string;
  category_id: string | null;
  cadence: {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval?: number;
    day_of_month?: number;
    day_of_week?: number;
    until?: string;
    count?: number;
  };
  next_due_date: string | null;
  default_account_id: string | null;
  auto_confirm: boolean;
  status: RuleStatus;
}

export interface RecurringInstance {
  id: string;
  rule_id: string;
  owner_id: string;
  due_date: string;
  generated_expense_id: string | null;
  status: InstanceStatus;
}

// ─── Reconciliation ──────────────────────────────────────────────────────────
export type SessionStatus = "open" | "closed";
export type SuggestionType = "expense" | "adjustment";
export type SuggestionStatus = "proposed" | "confirmed" | "discarded";

export interface ReconciliationSession {
  id: string;
  owner_id: string;
  period_start: string;
  period_end: string;
  status: SessionStatus;
}

export interface ReconciliationBalance {
  id: string;
  session_id: string;
  account_id: string;
  declared_balance_value: number;
  expected_balance_value: number | null;
  delta_value: number | null;
  currency: string;
}

export interface SuggestionPayload {
  account_id: string;
  amount_value: string;
  amount_currency: string;
  category_id: string | null;
  category_slug: string;
  label: string;
  note: string;
  date: string;
  delta_direction: "positive" | "negative";
}

export interface ReconciliationSuggestion {
  id: string;
  session_id: string;
  account_id: string;
  suggestion_type: SuggestionType;
  payload_json: SuggestionPayload;
  status: SuggestionStatus;
  created_expense_id: string | null;
}

export interface SessionDetail {
  session: ReconciliationSession;
  balances: ReconciliationBalance[];
  suggestions: ReconciliationSuggestion[];
}

// ─── Bulk ─────────────────────────────────────────────────────────────────────
export interface BulkResult {
  created: { row: number; expense_id: string; status: ExpenseStatus }[];
  errors: { row: number; error: string }[];
}

// ─── Costs ───────────────────────────────────────────────────────────────────
export type CostConfidence = "high" | "medium" | "low";
export type CostSource = "manual" | "csv" | "paste" | "commerce_sync";

export interface CostSKU {
  id: string;
  owner_id: string;
  sku: string;
  product_name: string | null;
  variant_name: string | null;
  stock_qty: number | null;
  stock_source: string | null;
  effective_unit_cost_value: number | null;
  effective_unit_cost_currency: string;
  cost_confidence: CostConfidence;
  valid_from: string | null;
  valid_to: string | null;
  source: CostSource;
  last_updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface CostStats {
  total_count: number;
  missing_count: number;
  low_confidence_count: number;
}

export interface CostPageResult {
  items: CostSKU[];
  page: {
    offset: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
  stats: CostStats;
}

export interface BulkCostResult {
  created: { row: number; sku: string }[];
  updated: { row: number; sku: string }[];
  errors: { row: number; sku: string; error: string }[];
  stats: CostStats;
}
