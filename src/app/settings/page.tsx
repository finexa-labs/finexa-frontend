"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, Check, Sparkles, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { intelligenceApi } from "@/modules/intelligence/api";
import type { IntelligenceLimits } from "@/modules/intelligence/types";

export default function SettingsPage() {
  const [commission, setCommission] = useState("12.5");
  const [shippingCost, setShippingCost] = useState("850");
  const [daysToCash, setDaysToCash] = useState("21");
  const [cashBalance, setCashBalance] = useState("890000");
  const [saved, setSaved] = useState(false);

  // ── Intelligence ──────────────────────────────────────────────────────────

  const [limits, setLimits] = useState<IntelligenceLimits | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(true);
  const [limitsSaving, setLimitsSaving] = useState(false);
  const [limitsSaved, setLimitsSaved] = useState(false);

  const loadLimits = useCallback(async () => {
    setLimitsLoading(true);
    try {
      const data = await intelligenceApi.getLimits();
      setLimits(data);
    } catch {
      // Intelligence not configured — show defaults
      setLimits(null);
    } finally {
      setLimitsLoading(false);
    }
  }, []);

  useEffect(() => { loadLimits(); }, [loadLimits]);

  async function handleSaveLimits() {
    if (!limits) return;
    setLimitsSaving(true);
    try {
      const updated = await intelligenceApi.patchLimits({
        enable_intelligence: limits.enable_intelligence,
        enable_smart_entry: limits.enable_smart_entry,
        enable_doc_ai: limits.enable_doc_ai,
        provider: limits.provider,
        model: limits.model,
        monthly_token_limit: limits.monthly_token_limit,
        session_token_limit: limits.session_token_limit,
      });
      setLimits(updated);
      setLimitsSaved(true);
      setTimeout(() => setLimitsSaved(false), 2500);
    } catch {
      // ignore
    } finally {
      setLimitsSaving(false);
    }
  }

  const usagePct = limits
    ? Math.min(100, Math.round((limits.tokens_used / limits.monthly_token_limit) * 100))
    : 0;

  // ─────────────────────────────────────────────────────────────────────────

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function toggleLimitFlag(flag: keyof IntelligenceLimits) {
    if (!limits) return;
    setLimits({ ...limits, [flag]: !limits[flag as keyof IntelligenceLimits] });
  }

  return (
    <AppShell title="Settings">
      <div className="max-w-lg flex flex-col gap-8">

        {/* General params */}
        <div className="flex flex-col gap-3">
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

        {/* Intelligence section */}
        <div className="flex flex-col gap-3" id="intelligence">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            <p className="text-sm font-medium text-foreground">Inteligencia (Beta)</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Configurá el módulo de IA para Smart Entry y Doc AI.
            Requiere una API key de Anthropic en el servidor.
          </p>

          <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-5">
            {limitsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={13} className="animate-spin" />
                Cargando configuración...
              </div>
            ) : (
              <>
                {/* Feature toggles */}
                {(["enable_intelligence", "enable_smart_entry", "enable_doc_ai"] as const).map((flag) => {
                  const labels: Record<string, string> = {
                    enable_intelligence: "Activar Inteligencia",
                    enable_smart_entry: "Smart Entry (Gastos)",
                    enable_doc_ai: "Doc AI (Ingestion)",
                  };
                  const descs: Record<string, string> = {
                    enable_intelligence: "Master switch. Debe estar activo para que funcionen Smart Entry y Doc AI.",
                    enable_smart_entry: "Permite generar borradores de gastos desde texto libre.",
                    enable_doc_ai: "Detecta tipo de documento y sugiere mapeo de columnas.",
                  };
                  const value = limits ? Boolean(limits[flag]) : false;
                  return (
                    <div key={flag} className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-foreground">{labels[flag]}</span>
                        <span className="text-xs text-muted-foreground">{descs[flag]}</span>
                      </div>
                      <button
                        onClick={() => toggleLimitFlag(flag)}
                        className={`relative shrink-0 h-6 w-11 rounded-full transition-colors ${
                          value ? "bg-accent" : "bg-border"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            value ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}

                {/* Provider */}
                <div className="flex flex-col gap-1.5 border-t border-border pt-4">
                  <label className="text-xs font-medium text-muted-foreground">Proveedor</label>
                  <select
                    value={limits?.provider ?? "stub"}
                    onChange={(e) => limits && setLimits({ ...limits, provider: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="stub">Stub (sin API key, respuestas simuladas)</option>
                    <option value="claude">Claude (Anthropic API)</option>
                  </select>
                </div>

                {/* Model */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Modelo</label>
                  <select
                    value={limits?.model ?? "claude-haiku-4-5-20251001"}
                    onChange={(e) => limits && setLimits({ ...limits, model: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (rápido, económico)</option>
                    <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (mejor calidad)</option>
                  </select>
                </div>

                {/* Token limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Límite mensual (tokens)</label>
                    <input
                      type="number"
                      value={limits?.monthly_token_limit ?? 50000}
                      onChange={(e) => limits && setLimits({ ...limits, monthly_token_limit: Number(e.target.value) })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Límite por sesión (tokens)</label>
                    <input
                      type="number"
                      value={limits?.session_token_limit ?? 4000}
                      onChange={(e) => limits && setLimits({ ...limits, session_token_limit: Number(e.target.value) })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Usage bar */}
                {limits && (
                  <div className="flex flex-col gap-1.5 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Uso mensual ({limits.year_month})
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {limits.tokens_used.toLocaleString()} / {limits.monthly_token_limit.toLocaleString()} tokens
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePct >= 90 ? "bg-red-400" : usagePct >= 70 ? "bg-yellow-400" : "bg-accent"
                        }`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{usagePct}% utilizado este mes</p>
                  </div>
                )}

                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <button
                    onClick={handleSaveLimits}
                    disabled={limitsSaving}
                    className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {limitsSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Guardar configuración IA
                  </button>
                  {limitsSaved && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                      <Check size={14} />
                      Guardado
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
