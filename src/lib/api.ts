import type {
  DashboardSummary,
  CommerceIngestRequest,
  UnifiedInventoryResponse,
  InventorySourcesResponse,
  InventorySourceEntry,
} from "@/types/financial";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    // Next.js 14: revalidar cada 60s
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/api/v1/metrics/dashboard");
}

// Commerce ingestion
export function ingestOrders(req: CommerceIngestRequest): Promise<{ ok: boolean }> {
  return apiPost("/commerce/ingest/orders", req);
}

export function ingestInventory(req: CommerceIngestRequest): Promise<{ ok: boolean }> {
  return apiPost("/commerce/ingest/inventory", req);
}

// Unified inventory
export function getUnifiedInventory(): Promise<UnifiedInventoryResponse> {
  return apiFetch<UnifiedInventoryResponse>("/commerce/inventory/unified");
}

export function getInventorySources(): Promise<InventorySourcesResponse> {
  return apiFetch<InventorySourcesResponse>("/commerce/inventory/sources");
}

export function updateInventorySources(entries: InventorySourceEntry[]): Promise<{ ok: boolean }> {
  return apiPut("/commerce/inventory/sources", { entries });
}
