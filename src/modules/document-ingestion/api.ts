/**
 * API wrappers for the Document Ingestion module.
 * All calls go through the same apiFetch base function used by the rest of the app.
 */

import type {
  ColumnMapping,
  GoogleStatus,
  ImportRowDecision,
  ImportRun,
  ImportSource,
  SheetItem,
  SheetPreview,
  TabItem,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const OWNER_ID =
  process.env.NEXT_PUBLIC_OWNER_ID ?? "00000000-0000-0000-0000-000000000001";

async function apiFetch<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
  }
): Promise<T> {
  const method = options?.method ?? "GET";
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Owner-ID": OWNER_ID,
    },
    body: options?.body != null ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Imports API ─────────────────────────────────────────────────────────────

export const importsApi = {
  createSource: (data: {
    source_type: string;
    reference: string;
    tab_name?: string;
    google_email?: string;
  }) =>
    apiFetch<ImportSource>("/finance/imports/sources", {
      method: "POST",
      body: data,
    }),

  createRun: (data: {
    source_id?: string | null;
    headers: string[];
    all_rows: string[][];
    account_id?: string | null;
    document_kind?: string;
    currency_default?: string;
  }) =>
    apiFetch<ImportRun>("/finance/imports/runs", {
      method: "POST",
      body: data,
    }),

  listRuns: () =>
    apiFetch<ImportRun[]>("/finance/imports/runs"),

  getRun: (runId: string) =>
    apiFetch<ImportRun>(`/finance/imports/runs/${runId}`),

  getDecisions: (runId: string) =>
    apiFetch<ImportRowDecision[]>(`/finance/imports/runs/${runId}/decisions`),

  analyzeRun: (
    runId: string,
    data: {
      all_rows: string[][];
      column_mapping: ColumnMapping;
      account_id?: string | null;
      date_format?: string | null;
    }
  ) =>
    apiFetch<ImportRun>(`/finance/imports/runs/${runId}/analyze`, {
      method: "POST",
      body: data,
    }),

  commitRun: (runId: string) =>
    apiFetch<ImportRun>(`/finance/imports/runs/${runId}/commit`, {
      method: "POST",
    }),

  patchDecision: (decisionId: string, decision: string) =>
    apiFetch<ImportRowDecision>(`/finance/imports/decisions/${decisionId}`, {
      method: "PATCH",
      body: { decision },
    }),
};

// ─── Google OAuth API ─────────────────────────────────────────────────────────

export const googleApi = {
  status: () => apiFetch<GoogleStatus>("/finance/google/status"),

  /** Returns the full redirect URL for the OAuth popup */
  authStartUrl: () =>
    `${API_URL}/finance/google/auth/start?X-Owner-ID=${OWNER_ID}`,

  listSheets: (q?: string) =>
    apiFetch<SheetItem[]>(
      `/finance/google/sheets${q ? `?q=${encodeURIComponent(q)}` : ""}`
    ),

  listTabs: (spreadsheetId: string) =>
    apiFetch<TabItem[]>(
      `/finance/google/sheets/${spreadsheetId}/tabs`
    ),

  preview: (spreadsheetId: string, tabName: string) =>
    apiFetch<SheetPreview>(
      `/finance/google/sheets/${spreadsheetId}/preview`,
      { method: "POST", body: { tab_name: tabName } }
    ),

  allRows: (spreadsheetId: string, tabName: string) =>
    apiFetch<{ headers: string[]; all_rows: string[][] }>(
      `/finance/google/sheets/${spreadsheetId}/rows`,
      { method: "POST", body: { tab_name: tabName } }
    ),
};
