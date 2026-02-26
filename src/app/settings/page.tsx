"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [commission, setCommission] = useState("12.5");
  const [shippingCost, setShippingCost] = useState("850");
  const [daysToCash, setDaysToCash] = useState("21");
  const [cashBalance, setCashBalance] = useState("890000");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <AppShell title="Settings">
      <div className="max-w-lg flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Parametros base para el calculo de margen y recomendaciones.
        </p>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Tasa de comision (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Comision del marketplace (Tiendanube, Shopify, etc.)
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Costo promedio de envio por unidad ($)
              </label>
              <input
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Dias promedio a caja
              </label>
              <input
                type="number"
                value={daysToCash}
                onChange={(e) => setDaysToCash(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Tiempo promedio desde la venta hasta tener el dinero disponible.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Saldo de caja actual ($)
              </label>
              <input
                type="number"
                value={cashBalance}
                onChange={(e) => setCashBalance(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Ingreso manual. Se usa para calcular buffer de caja.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              <Save size={14} />
              Guardar
            </button>
            {saved && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                <Check size={14} />
                Guardado
              </span>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
