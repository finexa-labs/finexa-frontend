/**
 * Tests for the Inventory page (/inventory).
 *
 * Covers:
 *  - Loading state on mount
 *  - Renders SKU table with data from API
 *  - Summary bar (total_skus, conflicted_skus, computed_at)
 *  - Warnings callout renders when warnings exist
 *  - No warnings callout when warnings is empty
 *  - Conflict badge: "Requiere atención" for had_conflict + most_recent
 *  - Conflict badge: "Conflicto resuelto" for had_conflict + other resolution
 *  - No badge for items without conflict
 *  - Conflict resolution panel appears only for had_conflict + most_recent items
 *  - Platform select in resolution panel triggers override state
 *  - Save button disabled when no overrides selected
 *  - Save calls updateInventorySources with correct entries
 *  - Shows success message after saving
 *  - Shows error message when save fails
 *  - Refresh button triggers re-fetch
 *  - Error state renders error message
 */

import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InventoryPage from "@/app/inventory/page";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/api", () => ({
  getUnifiedInventory: jest.fn(),
  updateInventorySources: jest.fn(),
}));

jest.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { getUnifiedInventory, updateInventorySources } from "@/lib/api";

const mockGetInventory = getUnifiedInventory as jest.Mock;
const mockUpdateSources = updateInventorySources as jest.Mock;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const itemClean = {
  sku: "REMERA-001",
  units_available: 20,
  units_reserved: 0,
  source_platform: "tiendanube" as const,
  snapshot_at: "2024-06-01T10:00:00Z",
  had_conflict: false,
  resolution: "sku_source",
};

const itemConflictNeedsAttention = {
  sku: "VESTIDO-001",
  units_available: 10,
  units_reserved: 2,
  source_platform: "shopify" as const,
  snapshot_at: "2024-06-01T11:00:00Z",
  had_conflict: true,
  resolution: "most_recent",
};

const itemConflictResolved = {
  sku: "JEAN-002",
  units_available: 5,
  units_reserved: 1,
  source_platform: "woocommerce" as const,
  snapshot_at: "2024-06-01T12:00:00Z",
  had_conflict: true,
  resolution: "sku_source",
};

const baseResponse = {
  items: [itemClean, itemConflictNeedsAttention, itemConflictResolved],
  total_skus: 3,
  conflicted_skus: 2,
  unresolved_skus: 0,
  warnings: ["SKU 'VESTIDO-001' aparece en múltiples plataformas"],
  computed_at: "2024-06-01T12:30:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetInventory.mockResolvedValue(baseResponse);
  mockUpdateSources.mockResolvedValue({ ok: true });
});

// ─── Loading state ────────────────────────────────────────────────────────────

describe("Loading state", () => {
  it("shows loading text while fetching", () => {
    // Never resolves during this test
    mockGetInventory.mockReturnValue(new Promise(() => {}));
    render(<InventoryPage />);
    expect(screen.getByText(/Cargando inventario/i)).toBeInTheDocument();
  });

  it("hides loading text after data arrives", async () => {
    render(<InventoryPage />);
    await waitFor(() =>
      expect(screen.queryByText(/Cargando inventario/i)).not.toBeInTheDocument()
    );
  });
});

// ─── Error state ──────────────────────────────────────────────────────────────

describe("Error state", () => {
  it("shows error message when fetch fails", async () => {
    mockGetInventory.mockRejectedValue(new Error("network fail"));
    render(<InventoryPage />);
    await waitFor(() =>
      expect(screen.getByText(/No se pudo cargar el inventario/i)).toBeInTheDocument()
    );
  });
});

// ─── Summary bar ──────────────────────────────────────────────────────────────

describe("Summary bar", () => {
  it("shows total_skus count", async () => {
    render(<InventoryPage />);
    await waitFor(() => expect(screen.getByText(/3 SKUs/i)).toBeInTheDocument());
  });

  it("shows conflicted_skus count", async () => {
    render(<InventoryPage />);
    await waitFor(() => expect(screen.getByText(/2 con conflicto/i)).toBeInTheDocument());
  });
});

// ─── Warnings ─────────────────────────────────────────────────────────────────

describe("Warnings section", () => {
  it("renders warning text when warnings are present", async () => {
    render(<InventoryPage />);
    await waitFor(() =>
      expect(
        screen.getByText(/VESTIDO-001.*múltiples plataformas/i)
      ).toBeInTheDocument()
    );
  });

  it("does NOT render warnings section when list is empty", async () => {
    mockGetInventory.mockResolvedValue({ ...baseResponse, warnings: [] });
    render(<InventoryPage />);
    await waitFor(() =>
      expect(screen.queryByText(/Advertencias de inventario/i)).not.toBeInTheDocument()
    );
  });

  it("renders all warnings when multiple exist", async () => {
    mockGetInventory.mockResolvedValue({
      ...baseResponse,
      warnings: ["Aviso A", "Aviso B", "Aviso C"],
    });
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText(/Aviso A/)).toBeInTheDocument();
      expect(screen.getByText(/Aviso B/)).toBeInTheDocument();
      expect(screen.getByText(/Aviso C/)).toBeInTheDocument();
    });
  });
});

// ─── SKU table ────────────────────────────────────────────────────────────────

describe("Inventory table", () => {
  it("renders all three SKUs", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText("REMERA-001")).toBeInTheDocument();
      // VESTIDO-001 appears in both the conflict panel and the table row
      expect(screen.getAllByText("VESTIDO-001").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("JEAN-002")).toBeInTheDocument();
    });
  });

  it("shows units_available for each SKU", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText("20")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  it("shows platform labels correctly", async () => {
    render(<InventoryPage />);
    // Platform names appear in table cells AND in the <select> options of the
    // conflict panel — use getAllByText to handle multiple occurrences.
    await waitFor(() => {
      expect(screen.getAllByText("Tiendanube").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Shopify").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("WooCommerce").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows no badge for clean item (no conflict)", async () => {
    render(<InventoryPage />);
    await waitFor(() => screen.getByText("REMERA-001"));

    // The row for REMERA-001 should have no badge
    const rows = screen.getAllByRole("row");
    const remera = rows.find((r) => r.textContent?.includes("REMERA-001"));
    expect(remera).toBeDefined();
    expect(within(remera!).queryByText(/conflicto/i)).not.toBeInTheDocument();
  });

  it("shows 'Requiere atención' badge for had_conflict + most_recent", async () => {
    render(<InventoryPage />);
    await waitFor(() =>
      expect(screen.getByText("Requiere atención")).toBeInTheDocument()
    );
  });

  it("shows 'Conflicto resuelto' badge for had_conflict + other resolution", async () => {
    render(<InventoryPage />);
    await waitFor(() =>
      expect(screen.getByText("Conflicto resuelto")).toBeInTheDocument()
    );
  });
});

// ─── Conflict resolution panel ────────────────────────────────────────────────

describe("Conflict resolution panel", () => {
  it("renders the panel when there are items needing attention", async () => {
    render(<InventoryPage />);
    await waitFor(() =>
      expect(screen.getByText(/plataforma maestra/i)).toBeInTheDocument()
    );
  });

  it("does NOT render the panel when no items need attention", async () => {
    mockGetInventory.mockResolvedValue({
      ...baseResponse,
      items: [itemClean, itemConflictResolved],
    });
    render(<InventoryPage />);
    await waitFor(() => screen.getByText("REMERA-001"));
    expect(screen.queryByText(/plataforma maestra/i)).not.toBeInTheDocument();
  });

  it("lists only the attention-needed SKU (not resolved ones)", async () => {
    render(<InventoryPage />);
    await waitFor(() => screen.getByText(/plataforma maestra/i));

    // VESTIDO-001 should appear in the panel; JEAN-002 (resolved) should not
    const panel = screen.getByText(/plataforma maestra/i).closest("section")!;
    expect(within(panel).getByText("VESTIDO-001")).toBeInTheDocument();
    expect(within(panel).queryByText("JEAN-002")).not.toBeInTheDocument();
  });

  it("Save button is disabled when no override is selected", async () => {
    render(<InventoryPage />);
    await waitFor(() => screen.getByText(/plataforma maestra/i));
    const saveBtn = screen.getByRole("button", { name: /Guardar/i });
    expect(saveBtn).toBeDisabled();
  });

  it("enables Save button after selecting a platform for a conflicted SKU", async () => {
    const user = userEvent.setup();
    render(<InventoryPage />);
    await waitFor(() => screen.getByText(/plataforma maestra/i));

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "tiendanube");

    expect(screen.getByRole("button", { name: /Guardar/i })).toBeEnabled();
  });

  it("calls updateInventorySources with the selected override", async () => {
    const user = userEvent.setup();
    render(<InventoryPage />);
    await waitFor(() => screen.getByText(/plataforma maestra/i));

    await user.selectOptions(screen.getByRole("combobox"), "tiendanube");
    await user.click(screen.getByRole("button", { name: /Guardar/i }));

    await waitFor(() =>
      expect(mockUpdateSources).toHaveBeenCalledWith([
        { sku: "VESTIDO-001", primary_platform: "tiendanube" },
      ])
    );
  });

  it("shows success message after saving", async () => {
    const user = userEvent.setup();
    render(<InventoryPage />);
    await waitFor(() => screen.getByText(/plataforma maestra/i));

    await user.selectOptions(screen.getByRole("combobox"), "shopify");
    await user.click(screen.getByRole("button", { name: /Guardar/i }));

    await waitFor(() =>
      expect(screen.getByText(/Guardado correctamente/i)).toBeInTheDocument()
    );
  });

  it("shows error message when save fails", async () => {
    mockUpdateSources.mockRejectedValue(new Error("save failed"));
    const user = userEvent.setup();
    render(<InventoryPage />);
    await waitFor(() => screen.getByText(/plataforma maestra/i));

    await user.selectOptions(screen.getByRole("combobox"), "shopify");
    await user.click(screen.getByRole("button", { name: /Guardar/i }));

    await waitFor(() =>
      expect(screen.getByText(/Error al guardar/i)).toBeInTheDocument()
    );
  });

  it("refreshes inventory after a successful save", async () => {
    const user = userEvent.setup();
    render(<InventoryPage />);
    await waitFor(() => screen.getByText(/plataforma maestra/i));

    await user.selectOptions(screen.getByRole("combobox"), "tiendanube");
    await user.click(screen.getByRole("button", { name: /Guardar/i }));

    await waitFor(() => screen.getByText(/Guardado correctamente/i));
    // Initial call + one after save = 2
    expect(mockGetInventory).toHaveBeenCalledTimes(2);
  });
});

// ─── Refresh button ────────────────────────────────────────────────────────────

describe("Refresh button", () => {
  it("calls getUnifiedInventory again on click", async () => {
    const user = userEvent.setup();
    render(<InventoryPage />);
    await waitFor(() => screen.getByText("REMERA-001"));

    await user.click(screen.getByRole("button", { name: /Actualizar/i }));
    await waitFor(() => expect(mockGetInventory).toHaveBeenCalledTimes(2));
  });
});
