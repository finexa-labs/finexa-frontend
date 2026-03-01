"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { importsApi } from "./api";
import {
  DOCUMENT_KIND_CONFIG,
  detectDocumentKind,
  type DocumentKind,
  type KindDetectionResult,
} from "./documentKindConfig";
import { KindStep } from "./steps/KindStep";
import { SourceStep } from "./steps/SourceStep";
import { PreviewStep } from "./steps/PreviewStep";
import { MappingStep } from "./steps/MappingStep";
import { ReviewStep } from "./steps/ReviewStep";
import type { ColumnMapping, ImportRowDecision, RowDecision, WizardState } from "./types";
import { useDocAI } from "@/modules/intelligence/hooks/useDocAI";

// ─── Initial state ────────────────────────────────────────────────────────────

const EMPTY_MAPPING: ColumnMapping = {
  date: null,
  amount: null,
  currency: null,
  counterparty: null,
  note: null,
  category: null,
  account: null,
  sku: null,
  stock_qty: null,
  spend_platform: null,
  week_start: null,
};

const INITIAL_STATE: WizardState = {
  step: "kind",
  documentKind: "generic_custom",
  sourceType: "csv",
  csvContent: "",
  csvFileName: "",
  sheetsSpreadsheetId: "",
  sheetsSpreadsheetName: "",
  sheetsTabName: "",
  headers: [],
  allRows: [],
  sampleRows: [],
  runId: null,
  run: null,
  columnMapping: EMPTY_MAPPING,
  accountId: "",
  dateFormat: "",
  invertSign: false,
  decisions: [],
};

// ─── Steps config ─────────────────────────────────────────────────────────────

const STEPS: { key: WizardState["step"]; label: string }[] = [
  { key: "kind", label: "0. Tipo" },
  { key: "source", label: "1. Fuente" },
  { key: "preview", label: "2. Vista previa" },
  { key: "mapping", label: "3. Mapeo" },
  { key: "review", label: "4. Revisión" },
];

// ─── Wizard ───────────────────────────────────────────────────────────────────

interface DocumentIngestionWizardProps {
  initialAccountId?: string;
  initialKind?: string;
}

export function DocumentIngestionWizard({ initialAccountId, initialKind }: DocumentIngestionWizardProps = {}) {
  const [state, setState] = useState<WizardState>(() => ({
    ...INITIAL_STATE,
    ...(initialAccountId ? { accountId: initialAccountId } : {}),
    ...(initialKind ? { documentKind: initialKind } : {}),
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [committed, setCommitted] = useState(false);
  const [kindDetection, setKindDetection] = useState<KindDetectionResult | null>(null);
  const docAI = useDocAI();

  function update(partial: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...partial }));
  }

  function goTo(step: WizardState["step"]) {
    update({ step });
    setError(null);
  }

  // ── Kind auto-detect (called by SourceStep after parsing headers + rows) ───

  function handleDetectKind(headers: string[], sampleRows: string[][]) {
    const result = detectDocumentKind(headers);
    setKindDetection(result);
    // Trigger AI kind detection — sampleRows are passed directly (not from stale state)
    if (headers.length > 0) {
      docAI.detectKind(headers, sampleRows);
    }
  }

  // ── Step 0: Kind → Source ─────────────────────────────────────────────────

  function handleKindNext() {
    goTo("source");
  }

  // ── Source → Preview ──────────────────────────────────────────────────────

  function handleSourceNext() {
    goTo("preview");
  }

  // ── Preview → Mapping ─────────────────────────────────────────────────────

  function handlePreviewNext() {
    goTo("mapping");
  }

  // ── Mapping → Review (analyze) ────────────────────────────────────────────

  async function handleMappingNext() {
    setLoading(true);
    setError(null);
    try {
      const kind = state.documentKind;
      const kindCfg = DOCUMENT_KIND_CONFIG[kind as DocumentKind] ?? DOCUMENT_KIND_CONFIG.generic_custom;

      // Create run if not yet created
      let runId = state.runId;
      if (!runId) {
        const run = await importsApi.createRun({
          headers: state.headers,
          all_rows: state.allRows,
          account_id: state.accountId || null,
          document_kind: kind,
          currency_default: kindCfg.defaultCurrency,
        });
        runId = run.id;
        update({ runId, run });
      }

      // Analyze with kind-aware mapping
      const analyzed = await importsApi.analyzeRun(runId, {
        all_rows: state.allRows,
        column_mapping: state.columnMapping,
        account_id: state.accountId || null,
        date_format: state.dateFormat || null,
      });

      const decisions = await importsApi.getDecisions(runId);

      update({
        run: analyzed,
        decisions,
        step: "review",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al analizar");
    } finally {
      setLoading(false);
    }
  }

  // ── Decision change ───────────────────────────────────────────────────────

  async function handleDecisionChange(decisionId: string, decision: RowDecision) {
    try {
      const updated = await importsApi.patchDecision(decisionId, decision);
      setState((prev) => ({
        ...prev,
        decisions: prev.decisions.map((d) =>
          d.id === decisionId ? (updated as ImportRowDecision) : d
        ),
        run: prev.run
          ? { ...prev.run, stats: recalcStats(prev.decisions.map((d) => d.id === decisionId ? { ...d, decision } : d)) }
          : prev.run,
      }));
    } catch {
      // Optimistic update
      setState((prev) => ({
        ...prev,
        decisions: prev.decisions.map((d) =>
          d.id === decisionId ? { ...d, decision } : d
        ),
        run: prev.run
          ? { ...prev.run, stats: recalcStats(prev.decisions.map((d) => d.id === decisionId ? { ...d, decision } : d)) }
          : prev.run,
      }));
    }
  }

  // ── Commit ────────────────────────────────────────────────────────────────

  async function handleCommit() {
    if (!state.runId) return;
    setLoading(true);
    setError(null);
    try {
      const done = await importsApi.commitRun(state.runId);
      update({ run: done });
      setCommitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setLoading(false);
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  function handleReset() {
    setState(INITIAL_STATE);
    setError(null);
    setCommitted(false);
    setKindDetection(null);
    docAI.dismissKind();
    docAI.dismissMapping();
  }

  // ─────────────────────────────────────────────────────────────────────────

  const currentStepIdx = STEPS.findIndex((s) => s.key === state.step);
  const kind = state.documentKind as DocumentKind;
  const kindCfg = DOCUMENT_KIND_CONFIG[kind] ?? DOCUMENT_KIND_CONFIG.generic_custom;
  const KindIcon = kindCfg.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                i === currentStepIdx
                  ? "bg-accent/10 text-accent"
                  : i < currentStepIdx
                  ? "text-muted-foreground"
                  : "text-muted-foreground/40"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  i < currentStepIdx
                    ? "bg-accent text-accent-foreground"
                    : i === currentStepIdx
                    ? "border border-accent text-accent"
                    : "border border-border text-muted-foreground/40"
                )}
              >
                {i < currentStepIdx ? "✓" : i}
              </span>
              {s.label.replace(/^\d+\. /, "")}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px w-5", i < currentStepIdx ? "bg-accent/40" : "bg-border")} />
            )}
          </div>
        ))}

        {/* Selected kind badge */}
        {state.step !== "kind" && state.documentKind !== "generic_custom" && (
          <div className="ml-auto flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs text-accent">
            <KindIcon size={12} />
            {kind.replace(/_/g, " ")}
          </div>
        )}

        {/* Reset button */}
        {(committed || state.step !== "kind") && (
          <button
            onClick={handleReset}
            className="ml-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Nueva importación
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="rounded-lg border border-border bg-card p-6">
        {state.step === "kind" && (
          <KindStep
            selectedKind={state.documentKind}
            detection={kindDetection}
            aiSuggestion={docAI.kindSuggestion}
            onSelect={(k) => update({ documentKind: k })}
            onNext={handleKindNext}
            onDismissAiSuggestion={docAI.dismissKind}
          />
        )}
        {state.step === "source" && (
          <SourceStep
            state={state}
            onUpdate={update}
            onNext={handleSourceNext}
            onDetectKind={handleDetectKind}
          />
        )}
        {state.step === "preview" && (
          <PreviewStep
            state={state}
            onUpdate={update}
            onBack={() => goTo("source")}
            onNext={handlePreviewNext}
          />
        )}
        {state.step === "mapping" && (
          <MappingStep
            state={state}
            onUpdate={update}
            onBack={() => goTo("preview")}
            onNext={handleMappingNext}
            loading={loading}
          />
        )}
        {state.step === "review" && (
          <ReviewStep
            state={state}
            onUpdate={update}
            onBack={() => goTo("mapping")}
            onCommit={handleCommit}
            onDecisionChange={handleDecisionChange}
            loading={loading}
            committed={committed}
          />
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function recalcStats(decisions: ImportRowDecision[]) {
  return {
    to_import: decisions.filter((d) => d.decision === "import").length,
    to_skip: decisions.filter((d) => d.decision === "skip").length,
    needs_review: decisions.filter((d) => d.decision === "needs_user_action").length,
    errors: decisions.filter((d) => d.decision === "error").length,
    total: decisions.length,
  };
}
