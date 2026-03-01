"use client";

import { PreviewTable } from "../components/PreviewTable";
import type { WizardState } from "../types";

interface PreviewStepProps {
  state: WizardState;
  onUpdate: (partial: Partial<WizardState>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PreviewStep({ state, onUpdate, onBack, onNext }: PreviewStepProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
          {state.allRows.length} filas
        </span>
        <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
          {state.headers.length} columnas
        </span>
        {state.sourceType === "google_sheets" && state.sheetsSpreadsheetName && (
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
            {state.sheetsSpreadsheetName} › {state.sheetsTabName}
          </span>
        )}
        {state.sourceType === "csv" && state.csvFileName && (
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
            {state.csvFileName}
          </span>
        )}
      </div>

      {/* Detected columns */}
      {state.headers.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Columnas detectadas
          </h3>
          <div className="flex flex-wrap gap-2">
            {state.headers.map((h, i) => (
              <span
                key={i}
                className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs text-foreground font-mono"
              >
                {i + 1}: {h || "(vacío)"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Preview table */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Vista previa (primeras 5 filas)
        </h3>
        <PreviewTable headers={state.headers} rows={state.sampleRows} maxRows={5} />
      </div>

      {/* Date format hint */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Formato de fecha (opcional)
        </label>
        <select
          value={state.dateFormat}
          onChange={(e) => onUpdate({ dateFormat: e.target.value })}
          className="w-64 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Auto-detectar</option>
          <option value="%d/%m/%Y">DD/MM/YYYY (ej: 31/12/2024)</option>
          <option value="%Y-%m-%d">YYYY-MM-DD (ej: 2024-12-31)</option>
          <option value="%m/%d/%Y">MM/DD/YYYY (ej: 12/31/2024)</option>
          <option value="%d-%m-%Y">DD-MM-YYYY (ej: 31-12-2024)</option>
        </select>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          ← Atrás
        </button>
        <button
          onClick={onNext}
          disabled={state.headers.length === 0}
          className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Configurar mapeo →
        </button>
      </div>
    </div>
  );
}
