"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getUnifiedInventory, updateInventorySources } from "@/lib/api";
import type {
  UnifiedInventoryResponse,
  UnifiedInventoryItem,
  CommercePlatform,
  InventorySourceEntry,
} from "@/types/financial";

const PLATFORM_LABELS: Record<CommercePlatform, string> = {
  tiendanube:  "Tiendanube",
  shopify:     "Shopify",
  woocommerce: "WooCommerce",
};

const PLATFORMS: CommercePlatform[] = ["tiendanube", "shopify", "woocommerce"];

// SKUs que necesitan atención: tenían conflicto y se resolvieron automáticamente
function needsAttention(item: UnifiedInventoryItem) {
  return item.had_conflict && item.resolution === "most_recent";
}

export default function InventoryPage() {
  const [data, setData] = useState<UnifiedInventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // primary_platform overrides: sku -> platform
  const [overrides, setOverrides] = useState<Record<string, CommercePlatform>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");

  async function fetchInventory() {
    setLoading(true);
    setError(null);
    try {
      const res = await getUnifiedInventory();
      setData(res);
    } catch {
      setError("No se pudo cargar el inventario. Verificá que el backend esté activo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInventory(); }, []);

  async function handleSaveOverrides() {
    const entries: InventorySourceEntry[] = (
      Object.entries(overrides) as [string, CommercePlatform][]
    ).map(([sku, primary_platform]) => ({ sku, primary_platform }));
    if (entries.length === 0) return;

    setSaveStatus("saving");
    try {
      await updateInventorySources(entries);
      setSaveStatus("ok");
      setOverrides({});
      await fetchInventory();
    } catch {
      setSaveStatus("error");
    }
  }

  const conflictedItems = data?.items.filter(needsAttention) ?? [];
  const pendingOverrides = Object.keys(overrides).length;

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventario unificado</h1>
            {data && (
              <p className="text-sm text-gray-500 mt-1">
                {data.total_skus} SKUs · {data.conflicted_skus} con conflicto ·{" "}
                {data.unresolved_skus} sin resolver ·{" "}
                <span className="text-gray-400">
                  Calculado: {new Date(data.computed_at).toLocaleString("es-AR")}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>

        {/* Warnings */}
        {data?.warnings && data.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-yellow-700 font-medium text-sm">
              <AlertTriangle size={15} />
              Advertencias de inventario
            </div>
            <ul className="space-y-1">
              {data.warnings.map((w, i) => (
                <li key={i} className="text-sm text-yellow-700 pl-1">
                  · {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Formulario de resolución de conflictos */}
        {conflictedItems.length > 0 && (
          <section className="bg-white rounded-xl border border-orange-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm">
              <AlertTriangle size={15} />
              SKUs con conflicto — configurá la plataforma maestra
            </div>
            <p className="text-xs text-gray-500">
              Estos SKUs aparecen en más de una plataforma y se resolvieron automáticamente
              usando el dato más reciente. Podés elegir una fuente fija para cada uno.
            </p>
            <div className="space-y-2">
              {conflictedItems.map((item) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm font-mono text-gray-800">{item.sku}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Fuente actual: {PLATFORM_LABELS[item.source_platform]}</span>
                    <select
                      value={overrides[item.sku] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value as CommercePlatform;
                        setOverrides((prev) => ({ ...prev, [item.sku]: val }));
                        setSaveStatus("idle");
                      }}
                      className="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-finexa-500"
                    >
                      <option value="">Seleccionar fuente…</option>
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {PLATFORM_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSaveOverrides}
                disabled={pendingOverrides === 0 || saveStatus === "saving"}
                className="px-4 py-2 bg-finexa-600 text-white text-sm font-medium rounded-md hover:bg-finexa-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saveStatus === "saving" ? "Guardando…" : `Guardar ${pendingOverrides > 0 ? `(${pendingOverrides})` : ""}`}
              </button>
              {saveStatus === "ok" && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle size={14} /> Guardado correctamente
                </span>
              )}
              {saveStatus === "error" && (
                <span className="text-sm text-red-600">Error al guardar. Intentá de nuevo.</span>
              )}
            </div>
          </section>
        )}

        {/* Tabla de inventario */}
        {loading && (
          <div className="text-sm text-gray-400 py-8 text-center">Cargando inventario…</div>
        )}
        {error && (
          <div className="text-sm text-red-600 py-8 text-center">{error}</div>
        )}
        {!loading && !error && data && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">SKU</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Disponible</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Reservado</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Plataforma</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Snapshot</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.sku} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-800">{item.sku}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{item.units_available}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{item.units_reserved}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {PLATFORM_LABELS[item.source_platform] ?? item.source_platform}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(item.snapshot_at).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      {item.had_conflict && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            needsAttention(item)
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <AlertTriangle size={10} />
                          {needsAttention(item) ? "Requiere atención" : "Conflicto resuelto"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
