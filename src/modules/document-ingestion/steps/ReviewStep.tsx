"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { DedupCard } from "../components/DedupCard";
import { DOCUMENT_KIND_CONFIG, type DocumentKind } from "../documentKindConfig";
import type { ImportRowDecision, RowDecision, RunStats, WizardState } from "../types";

interface ReviewStepProps {
  state: WizardState;
  onUpdate: (partial: Partial<WizardState>) => void;
  onBack: () => void;
  onCommit: () => void;
  onDecisionChange: (decisionId: string, decision: RowDecision) => void;
  loading: boolean;
  committed: boolean;
}

const DECISION_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "import", label: "Importar" },
  { value: "needs_user_action", label: "Revisar" },
  { value: "skip", label: "Omitir" },
  { value: "error", label: "Error" },
] as const;

export function ReviewStep({
  state,
  onBack,
  onCommit,
  onDecisionChange,
  loading,
  committed,
}: ReviewStepProps) {
  const [filter, setFilter] = useState<string>("all");

  const kind = state.documentKind as DocumentKind;
  const kindCfg = DOCUMENT_KIND_CONFIG[kind] ?? DOCUMENT_KIND_CONFIG.generic_custom;
  const commitEnabled = kindCfg.commitEnabled;

  const stats: RunStats = state.run?.stats ?? {
    to_import: 0,
    to_skip: 0,
    needs_review: 0,
    errors: 0,
    total: 0,
  };

  const filtered = filter === "all"
    ? state.decisions
    : state.decisions.filter((d) => d.decision === filter);

  function massDecide(decision: RowDecision) {
    state.decisions
      .filter((d) => d.decision === "needs_user_action")
      .forEach((d) => onDecisionChange(d.id, decision));
  }

  if (committed && state.run?.status === "done") {
    const committed_count = state.run.stats?.committed ?? 0;
    return (
      <div className="flex flex-col items-center gap-5 py-10">
        <CheckCircle2 size={48} className="text-emerald-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">
            ¡Importación completa!
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Se crearon <span className="text-emerald-400 font-medium">{committed_count}</span> gastos.
          </p>
          {(state.run.stats?.commit_errors ?? 0) > 0 && (
            <p className="text-sm text-red-400 mt-1">
              {state.run.stats?.commit_errors} filas con error.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Commit disabled banner */}
      {!commitEnabled && (
        <div className="flex items-center gap-3 rounded-md border border-amber-400/20 bg-amber-400/5 px-4 py-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-amber-400">
              Solo análisis — este tipo de documento todavía no se importa.
            </span>
            <span className="text-xs text-muted-foreground">
              Podés revisar el mapeo y las filas detectadas, pero el botón de importar está deshabilitado en MVP.
            </span>
          </div>
        </div>
      )}

      {/* sku_costs_simple: show SKU preview */}
      {kind === "sku_costs_simple" && state.decisions.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Preview costos ({state.decisions.filter((d) => d.decision === "import").length} SKUs a cargar)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-muted-foreground font-medium">SKU</th>
                  <th className="px-4 py-2 text-right text-muted-foreground font-medium">Costo</th>
                  <th className="px-4 py-2 text-left text-muted-foreground font-medium">Moneda</th>
                  <th className="px-4 py-2 text-left text-muted-foreground font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.decisions.slice(0, 15).map((d) => {
                  const mapped = d.mapped;
                  return (
                    <tr key={d.id} className="hover:bg-secondary/20">
                      <td className="px-4 py-2 font-mono text-foreground">{mapped?.sku ?? "—"}</td>
                      <td className="px-4 py-2 text-right text-foreground">
                        {mapped?.amount_value ? parseFloat(mapped.amount_value).toLocaleString("es-AR") : "—"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{mapped?.amount_currency ?? "ARS"}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs font-medium ${
                          d.decision === "import" ? "text-emerald-400" :
                          d.decision === "error" ? "text-red-400" : "text-muted-foreground"
                        }`}>
                          {d.decision === "import" ? "✓" : d.decision === "error" ? "✗" : "—"}
                          {" "}{d.decision === "error" ? d.error_detail?.slice(0, 30) : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {state.decisions.length > 15 && (
              <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
                + {state.decisions.length - 15} más
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats chips */}
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-400">
          {stats.to_import} a importar
        </span>
        {stats.needs_review > 0 && (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-400">
            {stats.needs_review} a revisar
          </span>
        )}
        <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
          {stats.to_skip} a omitir
        </span>
        {stats.errors > 0 && (
          <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs text-red-400">
            {stats.errors} errores
          </span>
        )}
      </div>

      {/* Mass actions for needs_review */}
      {stats.needs_review > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-amber-400/20 bg-amber-400/5 px-4 py-3">
          <span className="text-xs text-amber-400 flex-1">
            {stats.needs_review} fila(s) requieren revisión por posible duplicado.
          </span>
          <button
            onClick={() => massDecide("import")}
            className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-400/20 transition-colors"
          >
            Importar todas
          </button>
          <button
            onClick={() => massDecide("skip")}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Omitir todas
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {DECISION_FILTERS.map((f) => {
          const count = f.value === "all"
            ? state.decisions.length
            : state.decisions.filter((d) => d.decision === f.value).length;
          if (count === 0 && f.value !== "all") return null;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                filter === f.value
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Decisions list */}
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay filas con este filtro.
          </p>
        )}
        {filtered.map((d) => (
          <DedupCard
            key={d.id}
            decision={d}
            onChangeDecision={onDecisionChange}
          />
        ))}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
        >
          ← Atrás
        </button>
        <button
          onClick={onCommit}
          disabled={loading || stats.to_import === 0 || !commitEnabled}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {!commitEnabled
            ? "Solo análisis (commit deshabilitado)"
            : kind === "sku_costs_simple"
            ? `Cargar ${stats.to_import} costos`
            : `Confirmar e importar ${stats.to_import} gastos`}
        </button>
      </div>
    </div>
  );
}
