"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { accountsApi } from "@/lib/api";
import type { Account } from "@/types/finance";
import { MappingGrid } from "../components/MappingGrid";
import {
  DOCUMENT_KIND_CONFIG,
  type DocumentKind,
  type ExtendedMappingField,
} from "../documentKindConfig";
import type { ColumnMapping, MappingField, WizardState } from "../types";
import { intelligenceApi } from "@/modules/intelligence/api";

interface MappingStepProps {
  state: WizardState;
  onUpdate: (partial: Partial<WizardState>) => void;
  onBack: () => void;
  onNext: () => void;
  loading: boolean;
}

export function MappingStep({ state, onUpdate, onBack, onNext, loading }: MappingStepProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [aiMappingLoading, setAiMappingLoading] = useState(false);

  const kind = state.documentKind as DocumentKind;
  const kindCfg = DOCUMENT_KIND_CONFIG[kind] ?? DOCUMENT_KIND_CONFIG.generic_custom;

  useEffect(() => {
    accountsApi.list().then(setAccounts).catch(() => {});
  }, []);

  async function handleAISuggestMapping() {
    if (!state.headers.length) return;
    setAiMappingLoading(true);
    try {
      const result = await intelligenceApi.docAiSuggestMapping(state.headers, state.documentKind);
      if (result?.mapping) {
        const merged: Partial<ColumnMapping> = {};
        (Object.keys(result.mapping) as ExtendedMappingField[]).forEach((f) => {
          const val = result.mapping[f as keyof typeof result.mapping];
          if (val !== undefined) merged[f as keyof ColumnMapping] = val as number | null;
        });
        onUpdate({ columnMapping: { ...state.columnMapping, ...merged } });
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setAiMappingLoading(false);
    }
  }

  function handleMappingChange(field: ExtendedMappingField, colIndex: number | null) {
    onUpdate({
      columnMapping: { ...state.columnMapping, [field]: colIndex },
    });
  }

  // Build required field hint string
  const requiredFieldsList = kindCfg.requiredFields.join(", ");

  // Validate required fields
  const missingRequired = kindCfg.requiredFields.filter(
    (f) => (state.columnMapping[f as keyof ColumnMapping] ?? null) === null
  );
  const requiredOk = missingRequired.length === 0;

  // Account required depends on kind
  const accountOk = !kindCfg.defaultAccountRequired || !!state.accountId;
  const canProceed = requiredOk && accountOk;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-foreground">
            Mapeá las columnas del documento
          </h3>
          <p className="text-xs text-muted-foreground">
            Campos requeridos para <strong>{kind.replace(/_/g, " ")}</strong>:{" "}
            <span className="text-accent">{requiredFieldsList}</span>
          </p>
        </div>
        <button
          onClick={handleAISuggestMapping}
          disabled={aiMappingLoading || state.headers.length === 0}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          {aiMappingLoading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          Sugerir con IA
        </button>
      </div>

      <MappingGrid
        headers={state.headers}
        mapping={state.columnMapping}
        requiredFields={kindCfg.requiredFields}
        onChange={handleMappingChange}
      />

      {/* Invert sign toggle — only for account_statement */}
      {kindCfg.hasInvertSign && (
        <div className="flex items-center gap-3 rounded-md border border-amber-400/20 bg-amber-400/5 px-4 py-3">
          <div className="flex flex-col gap-0.5 flex-1">
            <span className="text-xs font-medium text-amber-400">
              Invertir signo de montos
            </span>
            <span className="text-xs text-muted-foreground">
              Activá si los débitos aparecen como positivos y necesitás invertirlos.
            </span>
          </div>
          <button
            onClick={() => onUpdate({ invertSign: !state.invertSign })}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              state.invertSign ? "bg-amber-400" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                state.invertSign ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      )}

      {/* Account selector — conditional on kind */}
      {kindCfg.defaultAccountRequired && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Cuenta destino <span className="text-red-400">*</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            {kind === "sku_costs_simple"
              ? "No aplica para costos de SKUs."
              : "Todos los gastos importados se registrarán en esta cuenta."}
          </p>
          <select
            value={state.accountId}
            onChange={(e) => onUpdate({ accountId: e.target.value })}
            className="w-72 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">— Seleccioná una cuenta —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Missing required fields hint */}
      {!requiredOk && missingRequired.length > 0 && (
        <div className="rounded-md border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-400">
          Faltan mapear: {missingRequired.join(", ")}
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          disabled={loading}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
        >
          ← Atrás
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed || loading}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Analizar {state.allRows.length} filas →
        </button>
      </div>
    </div>
  );
}
