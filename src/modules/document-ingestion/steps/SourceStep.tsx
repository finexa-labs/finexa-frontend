"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, Loader2, RefreshCw, Sheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { googleApi } from "../api";
import { parseCSV } from "../utils";
import type { GoogleStatus, ImportSourceType, SheetItem, TabItem, WizardState } from "../types";

interface SourceStepProps {
  state: WizardState;
  onUpdate: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onDetectKind?: (headers: string[], sampleRows: string[][]) => void;
}

export function SourceStep({ state, onUpdate, onNext, onDetectKind }: SourceStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Google Sheets state
  const [gStatus, setGStatus] = useState<GoogleStatus | null>(null);
  const [gLoading, setGLoading] = useState(false);
  const [sheets, setSheets] = useState<SheetItem[]>([]);
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [tabsLoading, setTabsLoading] = useState(false);

  useEffect(() => {
    googleApi.status().then(setGStatus).catch(() => {});
  }, []);

  // Load sheets when google is connected
  useEffect(() => {
    if (state.sourceType === "google_sheets" && gStatus?.connected) {
      setSheetsLoading(true);
      googleApi.listSheets()
        .then(setSheets)
        .catch(() => setSheets([]))
        .finally(() => setSheetsLoading(false));
    }
  }, [state.sourceType, gStatus?.connected]);

  // Load tabs when spreadsheet selected
  useEffect(() => {
    if (state.sheetsSpreadsheetId) {
      setTabsLoading(true);
      googleApi.listTabs(state.sheetsSpreadsheetId)
        .then(setTabs)
        .catch(() => setTabs([]))
        .finally(() => setTabsLoading(false));
    }
  }, [state.sheetsSpreadsheetId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      handleCsvContent(raw, file.name);
    };
    reader.readAsText(file, "utf-8");
  }

  function handleCsvContent(raw: string, fileName = "paste.csv") {
    setCsvError(null);
    try {
      const { headers, rows } = parseCSV(raw);
      if (headers.length === 0) {
        setCsvError("No se detectaron columnas en el CSV.");
        return;
      }
      const sample = rows.slice(0, 10);
      onUpdate({
        csvContent: raw,
        csvFileName: fileName,
        headers,
        allRows: rows,
        sampleRows: sample,
      });
      // Pass headers AND sample rows so the parent doesn't need to read stale state
      onDetectKind?.(headers, sample.slice(0, 3));
    } catch {
      setCsvError("Error al parsear el CSV. Verificá el formato.");
    }
  }

  function openOAuthPopup() {
    const url = googleApi.authStartUrl();
    const popup = window.open(url, "google_oauth", "width=520,height=620");
    if (!popup) return;
    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        setGLoading(true);
        googleApi.status()
          .then(setGStatus)
          .finally(() => setGLoading(false));
      }
    }, 500);
  }

  async function handleSheetsNext() {
    if (!state.sheetsSpreadsheetId || !state.sheetsTabName) return;
    try {
      const data = await googleApi.allRows(state.sheetsSpreadsheetId, state.sheetsTabName);
      const sample = data.all_rows.slice(0, 10);
      onUpdate({
        headers: data.headers,
        allRows: data.all_rows,
        sampleRows: sample,
      });
      onDetectKind?.(data.headers, sample.slice(0, 3));
      onNext();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al leer la hoja";
      setCsvError(msg);
    }
  }

  const canProceedCsv = state.headers.length > 0 && state.allRows.length > 0;
  const canProceedSheets =
    state.sheetsSpreadsheetId && state.sheetsTabName && state.headers.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Source type selector */}
      <div className="flex gap-3">
        {(["csv", "google_sheets"] as ImportSourceType[]).map((type) => (
          <button
            key={type}
            onClick={() => onUpdate({ sourceType: type })}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
              state.sourceType === type
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {type === "csv" ? <FileText size={16} /> : <Sheet size={16} />}
            {type === "csv" ? "CSV / Planilla" : "Google Sheets"}
          </button>
        ))}
      </div>

      {/* CSV panel */}
      {state.sourceType === "csv" && (
        <div className="flex flex-col gap-4">
          {/* File dropzone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors"
          >
            <FileText size={24} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {state.csvFileName || "Arrastrá o hacé click para seleccionar un CSV"}
            </span>
            {state.csvFileName && (
              <span className="text-xs text-accent">{state.csvFileName}</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleFileChange} />

          {/* Paste textarea */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              O pegá el contenido del CSV
            </label>
            <textarea
              rows={6}
              placeholder={"fecha,monto,detalle\n01/01/2024,1500,Proveedor X"}
              value={state.csvContent}
              onChange={(e) => {
                onUpdate({ csvContent: e.target.value });
                if (e.target.value.trim()) handleCsvContent(e.target.value);
              }}
              className="rounded-md border border-border bg-secondary px-3 py-2 text-xs font-mono text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {csvError && (
            <div className="rounded-md bg-red-400/10 border border-red-400/20 px-3 py-2 text-xs text-red-400">
              {csvError}
            </div>
          )}

          {canProceedCsv && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span>✓</span>
              <span>{state.allRows.length} filas detectadas, {state.headers.length} columnas</span>
            </div>
          )}

          <button
            disabled={!canProceedCsv}
            onClick={onNext}
            className="self-end rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Google Sheets panel */}
      {state.sourceType === "google_sheets" && (
        <div className="flex flex-col gap-4">
          {/* Connection status */}
          {!gStatus?.connected ? (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8">
              <Sheet size={32} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Conectá tu cuenta de Google para importar desde Sheets
              </p>
              <button
                onClick={openOAuthPopup}
                disabled={gLoading}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60"
              >
                {gLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                Conectar con Google
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <span>✓</span>
                <span>Conectado como {gStatus.email}</span>
                <button
                  onClick={openOAuthPopup}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                  title="Reconectar"
                >
                  <RefreshCw size={12} />
                </button>
              </div>

              {/* Spreadsheet selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Planilla
                </label>
                {sheetsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 size={12} className="animate-spin" />
                    Cargando planillas...
                  </div>
                ) : (
                  <select
                    value={state.sheetsSpreadsheetId}
                    onChange={(e) => {
                      const selected = sheets.find((s) => s.id === e.target.value);
                      onUpdate({
                        sheetsSpreadsheetId: e.target.value,
                        sheetsSpreadsheetName: selected?.name ?? "",
                        sheetsTabName: "",
                      });
                      setTabs([]);
                    }}
                    className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">— Seleccioná una planilla —</option>
                    {sheets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tab selector */}
              {state.sheetsSpreadsheetId && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Hoja
                  </label>
                  {tabsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 size={12} className="animate-spin" />
                      Cargando hojas...
                    </div>
                  ) : (
                    <select
                      value={state.sheetsTabName}
                      onChange={(e) => onUpdate({ sheetsTabName: e.target.value })}
                      className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">— Seleccioná una hoja —</option>
                      {tabs.map((t) => (
                        <option key={t.id} value={t.title}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          {csvError && (
            <div className="rounded-md bg-red-400/10 border border-red-400/20 px-3 py-2 text-xs text-red-400">
              {csvError}
            </div>
          )}

          <button
            disabled={!canProceedSheets}
            onClick={handleSheetsNext}
            className="self-end rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cargar datos →
          </button>
        </div>
      )}
    </div>
  );
}
