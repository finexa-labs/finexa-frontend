"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { Upload, AlertTriangle, Edit3, Save } from "lucide-react";

const MOCK_COSTS = [
  { sku: "REMERA-BAS-001", productCost: 2400, logisticsCost: 350, otherCost: 100, total: 2850 },
  { sku: "JEAN-SLM-042", productCost: 5800, logisticsCost: 450, otherCost: 200, total: 6450 },
  { sku: "BUZO-HVY-008", productCost: 4200, logisticsCost: 400, otherCost: 150, total: 4750 },
  { sku: "SHORT-DEP-009", productCost: 1800, logisticsCost: 300, otherCost: 80, total: 2180 },
];

const MISSING_COSTS = [
  { sku: "CAMP-OVR-015", reason: "Sin costo de producto registrado" },
  { sku: "PANT-CRG-023", reason: "Sin costo logistico" },
];

export default function CostsPage() {
  const [dragOver, setDragOver] = useState(false);
  const [editSku, setEditSku] = useState("");
  const [editCost, setEditCost] = useState("");

  return (
    <AppShell title="Costos">
      <div className="flex flex-col gap-6">
        {/* Upload CSV dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors",
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border bg-card/50"
          )}
        >
          <Upload size={24} className="text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Arrastra un CSV con costos
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Columnas: sku, product_cost, logistics_cost, other_cost
            </p>
          </div>
          <label className="cursor-pointer rounded-md bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
            Seleccionar archivo
            <input type="file" accept=".csv" className="sr-only" />
          </label>
        </div>

        {/* Quick edit form */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-3">
            Editar costo de un SKU
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">SKU</label>
              <input
                type="text"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                placeholder="REMERA-BAS-001"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">
                Costo unitario ($)
              </label>
              <input
                type="number"
                value={editCost}
                onChange={(e) => setEditCost(e.target.value)}
                placeholder="2850"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors shrink-0">
              <Save size={14} />
              Guardar
            </button>
          </div>
        </div>

        {/* Costs preview table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">
              Costos registrados
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    SKU
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Producto
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Logistica
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Otros
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Accion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_COSTS.map((c) => (
                  <tr
                    key={c.sku}
                    className="transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-foreground">
                      {c.sku}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      ${c.productCost.toLocaleString("es-AR")}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      ${c.logisticsCost.toLocaleString("es-AR")}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      ${c.otherCost.toLocaleString("es-AR")}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-foreground">
                      ${c.total.toLocaleString("es-AR")}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button className="text-muted-foreground hover:text-accent transition-colors">
                        <Edit3 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Missing costs alerts */}
        {MISSING_COSTS.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <AlertTriangle size={14} className="text-amber-400" />
              Costos faltantes
            </h2>
            <div className="flex flex-col gap-2">
              {MISSING_COSTS.map((m) => (
                <div
                  key={m.sku}
                  className="flex items-center justify-between rounded-md border border-amber-400/20 bg-amber-400/5 px-4 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-foreground">
                      {m.sku}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {m.reason}
                    </span>
                  </div>
                  <button className="text-xs font-medium text-accent hover:text-accent/80 transition-colors">
                    Cargar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
