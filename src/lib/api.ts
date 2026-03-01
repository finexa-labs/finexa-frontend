import type { DashboardSummary, CommerceIngestRequest, UnifiedInventoryResponse, InventorySourcesResponse, InventorySourceEntry } from "@/types/financial";
import type {
  Account,
  BulkCostResult,
  BulkResult,
  Category,
  CostPageResult,
  CostSKU,
  CostStats,
  Counterparty,
  Expense,
  ReconciliationBalance,
  ReconciliationSession,
  ReconciliationSuggestion,
  RecurringInstance,
  RecurringRule,
  SessionDetail,
} from "@/types/finance";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// MVP: owner_id desde env o UUID de desarrollo
const OWNER_ID =
  process.env.NEXT_PUBLIC_OWNER_ID ?? "00000000-0000-0000-0000-000000000001";

// ─── Core fetch ──────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    idempotencyKey?: string;
    noCache?: boolean;
  }
): Promise<T> {
  const method = options?.method ?? "GET";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Owner-ID": OWNER_ID,
  };

  if (options?.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: options?.body != null ? JSON.stringify(options.body) : undefined,
    cache: options?.noCache || method !== "GET" ? "no-store" : undefined,
    ...(method === "GET" && !options?.noCache
      ? { next: { revalidate: 30 } }
      : {}),
  });

  if (!res.ok) {
    const detail = await res
      .json()
      .catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(
      typeof detail?.detail === "string" ? detail.detail : `Error ${res.status}: ${path}`
    );
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ─── Legacy ───────────────────────────────────────────────────────────────────

export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/api/v1/metrics/dashboard");
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export const accountsApi = {
  list: () => apiFetch<Account[]>("/finance/accounts"),
  create: (data: { name: string; type: string; currency?: string; bank_type?: string | null; color?: string }) =>
    apiFetch<Account>("/finance/accounts", { method: "POST", body: data }),
  update: (id: string, data: Partial<Account>) =>
    apiFetch<Account>(`/finance/accounts/${id}`, { method: "PATCH", body: data }),
};

// ─── Categories ──────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: (type?: string) =>
    apiFetch<Category[]>(`/finance/categories${type ? `?type=${type}` : ""}`),
};

// ─── Counterparties ──────────────────────────────────────────────────────────

export const counterpartiesApi = {
  search: (q: string) =>
    apiFetch<Counterparty[]>(
      `/finance/counterparties?search=${encodeURIComponent(q)}&limit=10`,
      { noCache: true }
    ),
  create: (data: { name: string; type: string }) =>
    apiFetch<Counterparty>("/finance/counterparties", {
      method: "POST",
      body: data,
    }),
};

// ─── Expenses ────────────────────────────────────────────────────────────────

export interface ExpenseFilters {
  from_date?: string;
  to_date?: string;
  account_id?: string;
  category_id?: string;
  status?: string;
  counterparty_id?: string;
  limit?: number;
  offset?: number;
}

export const expensesApi = {
  list: (filters: ExpenseFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null) params.set(k, String(v));
    });
    const qs = params.toString();
    return apiFetch<Expense[]>(`/finance/expenses${qs ? `?${qs}` : ""}`, {
      noCache: true,
    });
  },

  get: (id: string) => apiFetch<Expense>(`/finance/expenses/${id}`),

  create: (
    data: {
      account_id: string;
      amount: { value: number; currency: string };
      date: string;
      category_id?: string | null;
      counterparty_id?: string | null;
      note?: string | null;
      tags?: Record<string, unknown> | null;
    },
    idempotencyKey?: string
  ) =>
    apiFetch<Expense>("/finance/expenses", {
      method: "POST",
      body: data,
      idempotencyKey,
    }),

  update: (id: string, data: Partial<Omit<Expense, "id" | "owner_id">>) =>
    apiFetch<Expense>(`/finance/expenses/${id}`, {
      method: "PATCH",
      body: data,
    }),

  bulk: (
    expenses: {
      account_id: string;
      amount_value: number;
      amount_currency: string;
      date: string;
      category_id?: string | null;
      note?: string | null;
    }[],
    idempotencyKey?: string
  ) =>
    apiFetch<BulkResult>("/finance/expenses/bulk", {
      method: "POST",
      body: { expenses },
      idempotencyKey,
    }),
};

// ─── Recurring ───────────────────────────────────────────────────────────────

export const recurringApi = {
  listRules: () =>
    apiFetch<RecurringRule[]>("/finance/recurring-expenses", { noCache: true }),

  createRule: (data: Omit<RecurringRule, "id" | "owner_id" | "next_due_date">) =>
    apiFetch<RecurringRule>("/finance/recurring-expenses", {
      method: "POST",
      body: data,
    }),

  updateRule: (id: string, data: Partial<RecurringRule>) =>
    apiFetch<RecurringRule>(`/finance/recurring-expenses/${id}`, {
      method: "PATCH",
      body: data,
    }),

  generate: (id: string, from_date: string, to_date: string) =>
    apiFetch<RecurringInstance[]>(
      `/finance/recurring-expenses/${id}/generate?from_date=${from_date}&to_date=${to_date}`,
      { method: "POST" }
    ),

  listInstances: (filters: {
    from_date?: string;
    to_date?: string;
    status?: string;
  } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return apiFetch<RecurringInstance[]>(
      `/finance/recurring-instances${qs ? `?${qs}` : ""}`,
      { noCache: true }
    );
  },
};

// ─── Costs ───────────────────────────────────────────────────────────────────

export interface CostFilters {
  search?: string;
  missing_only?: boolean;
  confidence?: string;
  limit?: number;
  offset?: number;
}

export const costsApi = {
  list: (filters: CostFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== "" && v !== false) params.set(k, String(v));
    });
    if (filters.missing_only) params.set("missing_only", "true");
    const qs = params.toString();
    return apiFetch<CostPageResult>(`/finance/costs${qs ? `?${qs}` : ""}`, {
      noCache: true,
    });
  },

  stats: () => apiFetch<CostStats>("/finance/costs/stats", { noCache: true }),

  upsert: (data: {
    sku: string;
    product_name?: string | null;
    variant_name?: string | null;
    effective_unit_cost_value?: number | null;
    effective_unit_cost_currency?: string;
    cost_confidence?: string;
    valid_from?: string | null;
  }) => apiFetch<CostSKU>("/finance/costs", { method: "POST", body: data }),

  patch: (
    sku: string,
    data: {
      effective_unit_cost_value?: number | null;
      effective_unit_cost_currency?: string;
      cost_confidence?: string;
      product_name?: string | null;
      variant_name?: string | null;
      valid_from?: string | null;
    }
  ) =>
    apiFetch<CostSKU>(`/finance/costs/${encodeURIComponent(sku)}`, {
      method: "PATCH",
      body: data,
    }),

  bulk: (
    rows: Record<string, unknown>[],
    source = "csv",
    idempotencyKey?: string
  ) =>
    apiFetch<BulkCostResult>("/finance/costs/bulk", {
      method: "POST",
      body: { rows, source },
      idempotencyKey,
    }),

  applyBulkEdit: (sku_list: string[], patch: Record<string, unknown>) =>
    apiFetch<{ updated_count: number; stats: CostStats }>(
      "/finance/costs/apply-bulk-edit",
      { method: "POST", body: { sku_list, patch } }
    ),

  missing: (limit = 50, offset = 0) =>
    apiFetch<{ items: CostSKU[]; page: { offset: number; limit: number; total: number; has_more: boolean } }>(
      `/finance/costs/missing?limit=${limit}&offset=${offset}`,
      { noCache: true }
    ),
};

export const catalogApi = {
  importSkus: (rows: { sku: string; product_name?: string; variant_name?: string }[]) =>
    apiFetch<BulkCostResult>("/finance/catalog/skus/import", {
      method: "POST",
      body: { rows },
    }),
};

// ─── Reconciliation ──────────────────────────────────────────────────────────

export const reconciliationApi = {
  createSession: (period_start: string, period_end: string) =>
    apiFetch<ReconciliationSession>("/finance/reconciliation/sessions", {
      method: "POST",
      body: { period_start, period_end },
    }),

  getSession: (id: string) =>
    apiFetch<SessionDetail>(`/finance/reconciliation/sessions/${id}`, {
      noCache: true,
    }),

  declareBalances: (
    sessionId: string,
    balances: { account_id: string; declared_balance_value: number; currency: string }[]
  ) =>
    apiFetch<ReconciliationBalance[]>(
      `/finance/reconciliation/sessions/${sessionId}/declare-balances`,
      { method: "POST", body: { balances } }
    ),

  compute: (sessionId: string) =>
    apiFetch<SessionDetail>(
      `/finance/reconciliation/sessions/${sessionId}/compute`,
      { method: "POST" }
    ),

  closeSession: (sessionId: string) =>
    apiFetch<ReconciliationSession>(
      `/finance/reconciliation/sessions/${sessionId}/close`,
      { method: "POST" }
    ),

  confirmSuggestion: (suggestionId: string) =>
    apiFetch<ReconciliationSuggestion>(
      `/finance/reconciliation/suggestions/${suggestionId}/confirm`,
      { method: "POST" }
    ),

  discardSuggestion: (suggestionId: string) =>
    apiFetch<ReconciliationSuggestion>(
      `/finance/reconciliation/suggestions/${suggestionId}/discard`,
      { method: "POST" }
    ),
};

// ─── Commerce ─────────────────────────────────────────────────────────────────

export function ingestOrders(req: CommerceIngestRequest): Promise<{ ok: boolean }> {
  return apiPost("/commerce/ingest/orders", req);
}

export function ingestInventory(req: CommerceIngestRequest): Promise<{ ok: boolean }> {
  return apiPost("/commerce/ingest/inventory", req);
}

export function getUnifiedInventory(): Promise<UnifiedInventoryResponse> {
  return apiFetch<UnifiedInventoryResponse>("/commerce/inventory/unified");
}

export function getInventorySources(): Promise<InventorySourcesResponse> {
  return apiFetch<InventorySourcesResponse>("/commerce/inventory/sources");
}

export function updateInventorySources(entries: InventorySourceEntry[]): Promise<{ ok: boolean }> {
  return apiPut("/commerce/inventory/sources", { entries });
}
