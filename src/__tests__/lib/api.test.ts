/**
 * Tests for src/lib/api.ts
 *
 * Covers: apiFetch, apiPost, apiPut, and each exported function.
 * All network calls are intercepted via global fetch mock.
 */

import {
  getDashboardSummary,
  ingestOrders,
  ingestInventory,
  getUnifiedInventory,
  getInventorySources,
  updateInventorySources,
} from "@/lib/api";
import type {
  DashboardSummary,
  UnifiedInventoryResponse,
  InventorySourcesResponse,
} from "@/types/financial";

// ─── helpers ─────────────────────────────────────────────────────────────────

function mockFetch(body: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

function lastCall() {
  return (global.fetch as jest.Mock).mock.calls[0];
}

// ─── getDashboardSummary ──────────────────────────────────────────────────────

describe("getDashboardSummary", () => {
  const payload: DashboardSummary = {
    survival_score: {
      score: 75,
      label: "Saludable",
      recommended_ads_budget: 15000,
      explanation: "Todo OK",
    },
    cash_flow: {
      immobilized_capital: 50000,
      days_to_cash: 30,
      current_cash_position: 120000,
    },
    top_margins: [],
  };

  it("calls the correct endpoint", async () => {
    mockFetch(payload);
    await getDashboardSummary();
    const [url] = lastCall();
    expect(url).toContain("/api/v1/metrics/dashboard");
  });

  it("returns parsed JSON", async () => {
    mockFetch(payload);
    const result = await getDashboardSummary();
    expect(result.survival_score.score).toBe(75);
    expect(result.cash_flow.days_to_cash).toBe(30);
  });

  it("throws on non-ok response", async () => {
    mockFetch({}, false, 503);
    await expect(getDashboardSummary()).rejects.toThrow("API error 503");
  });
});

// ─── ingestOrders ─────────────────────────────────────────────────────────────

describe("ingestOrders", () => {
  it("sends POST to /commerce/ingest/orders with tiendanube payload", async () => {
    mockFetch({ ok: true });
    await ingestOrders({
      platform: "tiendanube",
      credentials: { store_id: "123", access_token: "tok" },
    });
    const [url, opts] = lastCall();
    expect(url).toContain("/commerce/ingest/orders");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.platform).toBe("tiendanube");
    expect(body.credentials.store_id).toBe("123");
  });

  it("sends POST with shopify credentials", async () => {
    mockFetch({ ok: true });
    await ingestOrders({
      platform: "shopify",
      credentials: { shop_domain: "mi-tienda.myshopify.com", access_token: "shpat_xxx" },
    });
    const body = JSON.parse(lastCall()[1].body);
    expect(body.platform).toBe("shopify");
    expect(body.credentials.shop_domain).toBe("mi-tienda.myshopify.com");
  });

  it("sends POST with woocommerce credentials", async () => {
    mockFetch({ ok: true });
    await ingestOrders({
      platform: "woocommerce",
      credentials: {
        site_url: "https://tienda.com",
        consumer_key: "ck_xxx",
        consumer_secret: "cs_xxx",
      },
    });
    const body = JSON.parse(lastCall()[1].body);
    expect(body.platform).toBe("woocommerce");
    expect(body.credentials.consumer_key).toBe("ck_xxx");
  });

  it("sets Content-Type header", async () => {
    mockFetch({ ok: true });
    await ingestOrders({
      platform: "tiendanube",
      credentials: { store_id: "1", access_token: "t" },
    });
    const headers = lastCall()[1].headers;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("throws on API error", async () => {
    mockFetch({}, false, 422);
    await expect(
      ingestOrders({ platform: "tiendanube", credentials: { store_id: "x", access_token: "y" } })
    ).rejects.toThrow("API error 422");
  });
});

// ─── ingestInventory ──────────────────────────────────────────────────────────

describe("ingestInventory", () => {
  it("sends POST to /commerce/ingest/inventory", async () => {
    mockFetch({ ok: true });
    await ingestInventory({
      platform: "shopify",
      credentials: { shop_domain: "x.myshopify.com", access_token: "tok" },
    });
    const [url] = lastCall();
    expect(url).toContain("/commerce/ingest/inventory");
  });
});

// ─── getUnifiedInventory ──────────────────────────────────────────────────────

describe("getUnifiedInventory", () => {
  const payload: UnifiedInventoryResponse = {
    items: [
      {
        sku: "VESTIDO-001",
        units_available: 10,
        units_reserved: 0,
        source_platform: "tiendanube",
        snapshot_at: "2024-01-01T00:00:00Z",
        had_conflict: true,
        resolution: "most_recent",
      },
    ],
    total_skus: 1,
    conflicted_skus: 1,
    unresolved_skus: 0,
    warnings: ["SKU 'VESTIDO-001' aparece en múltiples plataformas"],
    computed_at: "2024-01-01T00:01:00Z",
  };

  it("calls GET /commerce/inventory/unified", async () => {
    mockFetch(payload);
    await getUnifiedInventory();
    expect(lastCall()[0]).toContain("/commerce/inventory/unified");
  });

  it("returns items array with correct shape", async () => {
    mockFetch(payload);
    const result = await getUnifiedInventory();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].sku).toBe("VESTIDO-001");
    expect(result.items[0].had_conflict).toBe(true);
    expect(result.warnings).toHaveLength(1);
  });

  it("throws on error", async () => {
    mockFetch({}, false, 500);
    await expect(getUnifiedInventory()).rejects.toThrow("API error 500");
  });
});

// ─── getInventorySources ──────────────────────────────────────────────────────

describe("getInventorySources", () => {
  const payload: InventorySourcesResponse = {
    entries: [{ sku: "VESTIDO-001", primary_platform: "tiendanube" }],
  };

  it("calls GET /commerce/inventory/sources", async () => {
    mockFetch(payload);
    await getInventorySources();
    expect(lastCall()[0]).toContain("/commerce/inventory/sources");
  });

  it("returns entries", async () => {
    mockFetch(payload);
    const result = await getInventorySources();
    expect(result.entries[0].primary_platform).toBe("tiendanube");
  });
});

// ─── updateInventorySources ───────────────────────────────────────────────────

describe("updateInventorySources", () => {
  it("sends PUT to /commerce/inventory/sources", async () => {
    mockFetch({ ok: true });
    await updateInventorySources([{ sku: "JEAN-002", primary_platform: "shopify" }]);
    const [url, opts] = lastCall();
    expect(url).toContain("/commerce/inventory/sources");
    expect(opts.method).toBe("PUT");
  });

  it("wraps entries under 'entries' key", async () => {
    mockFetch({ ok: true });
    await updateInventorySources([
      { sku: "VESTIDO-001", primary_platform: "tiendanube" },
      { sku: "JEAN-002", primary_platform: "shopify" },
    ]);
    const body = JSON.parse(lastCall()[1].body);
    expect(body.entries).toHaveLength(2);
    expect(body.entries[0].sku).toBe("VESTIDO-001");
    expect(body.entries[1].primary_platform).toBe("shopify");
  });

  it("throws on error", async () => {
    mockFetch({}, false, 400);
    await expect(
      updateInventorySources([{ sku: "x", primary_platform: "tiendanube" }])
    ).rejects.toThrow("API error 400");
  });
});
