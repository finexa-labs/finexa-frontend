"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/EmptyState";
import { useT } from "@/contexts/LocaleContext";
import { catalogApi, costsApi } from "@/lib/api";
import type { BulkCostResult, CostConfidence, CostSKU, CostStats } from "@/types/finance";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  Download,
  Filter,
  Layers,
  Lock,
  Pencil,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── CSV utilities ────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if ((ch === "," || ch === "\t") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw
    .trim()
    .split("\n")
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/"/g, "").trim()
  );

  // normalize header aliases
  const normalizeHeader = (h: string): string => {
    if (h === "cost_value" || h === "costo" || h === "cost") return "effective_unit_cost_value";
    if (h === "currency" || h === "moneda") return "effective_unit_cost_currency";
    if (h === "confidence" || h === "confianza") return "cost_confidence";
    if (h === "name" || h === "nombre") return "product_name";
    if (h === "variant" || h === "variante") return "variant_name";
    return h;
  };

  const normHeaders = headers.map(normalizeHeader);

  return lines
    .slice(1)
    .map((line) => {
      const values = parseCSVLine(line);
      const row: Record<string, string> = {};
      normHeaders.forEach((h, i) => {
        row[h] = values[i] ?? "";
      });
      return row;
    })
    .filter((r) => r.sku?.trim());
}

function rowsToApiFormat(rows: Record<string, string>[]) {
  return rows.map((r) => ({
    sku: r.sku?.trim() ?? "",
    product_name: r.product_name?.trim() || null,
    variant_name: r.variant_name?.trim() || null,
    effective_unit_cost_value:
      r.effective_unit_cost_value?.trim()
        ? parseFloat(r.effective_unit_cost_value)
        : null,
    effective_unit_cost_currency: (r.effective_unit_cost_currency?.trim() || "ARS").toUpperCase(),
    cost_confidence: r.cost_confidence?.trim() || "high",
    valid_from: r.valid_from?.trim() || null,
  }));
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Confidence badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: CostConfidence }) {
  if (level === "high") return <Badge label="Alta" variant="green" />;
  if (level === "medium") return <Badge label="Media" variant="yellow" />;
  return <Badge label="Baja" variant="red" />;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function CostStatusBadge({ sku }: { sku: CostSKU }) {
  if (sku.effective_unit_cost_value === null)
    return <Badge label="Falta costo" variant="yellow" />;
  if (sku.cost_confidence === "low")
    return <Badge label="Baja confianza" variant="red" />;
  return <Badge label="OK" variant="green" />;
}

// ─── Bulk CSV Modal ───────────────────────────────────────────────────────────

function BulkCsvModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (stats: CostStats) => void;
}) {
  const t = useT();
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [step, setStep] = useState<"input" | "preview" | "result">("input");
  const [result, setResult] = useState<BulkCostResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setRaw("");
    setRows([]);
    setStep("input");
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRaw(text);
      setRows(parseCSV(text));
      setStep("preview");
    };
    reader.readAsText(file);
  }

  function handlePreview() {
    const parsed = parseCSV(raw);
    setRows(parsed);
    setStep("preview");
  }

  async function handleUpload() {
    setLoading(true);
    try {
      const apiRows = rowsToApiFormat(rows);
      const res = await costsApi.bulk(apiRows, "csv");
      setResult(res);
      setStep("result");
      if (res.errors.length === 0) {
        onSuccess(res.stats);
        setTimeout(handleClose, 1500);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadErrors() {
    if (!result) return;
    const lines = [
      "row,sku,error",
      ...result.errors.map((e) => `${e.row},${e.sku},"${e.error}"`),
    ];
    downloadCsv("errores-costos.csv", lines.join("\n"));
  }

  return (
    <Modal open={open} onClose={handleClose} title={t("costs.bulk.title")} size="lg">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{t("costs.bulk.description")}</p>

        {step === "input" && (
          <>
            {/* Dropzone */}
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card/50 p-6 transition-colors hover:border-accent hover:bg-accent/5"
            >
              <Upload size={20} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t("costs.bulk.dropzone")}</span>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>

            <p className="text-xs text-muted-foreground">{t("costs.bulk.format")}</p>
            <p className="rounded bg-secondary px-3 py-1.5 font-mono text-xs text-muted-foreground">
              {t("costs.bulk.example")}
            </p>

            {/* Or paste */}
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={t("costs.bulk.pastePlaceholder")}
              rows={6}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={handleClose}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handlePreview}
                disabled={!raw.trim()}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                {t("costs.bulk.preview").replace("{count}", "")}
              </button>
            </div>
          </>
        )}

        {step === "preview" && (
          <>
            <p className="text-sm text-muted-foreground">
              {t("costs.bulk.preview").replace("{count}", String(rows.length))}
            </p>
            <div className="max-h-64 overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50 sticky top-0">
                  <tr>
                    {["SKU", "Nombre", "Costo", "Moneda", "Confianza"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-secondary/20">
                      <td className="px-3 py-2 font-mono text-foreground">{r.sku}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.product_name || "—"}</td>
                      <td className="px-3 py-2 text-right text-foreground">
                        {r.effective_unit_cost_value || "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {r.effective_unit_cost_currency || "ARS"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {r.cost_confidence || "high"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between gap-2">
              <button
                onClick={() => setStep("input")}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("common.back")}
              </button>
              <button
                onClick={handleUpload}
                disabled={loading || rows.length === 0}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                {loading
                  ? t("common.loading")
                  : t("costs.bulk.upload").replace("{count}", String(rows.length))}
              </button>
            </div>
          </>
        )}

        {step === "result" && result && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              {result.created.length > 0 && (
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-400">
                  ✓ {t("costs.bulk.resultCreated").replace("{count}", String(result.created.length))}
                </span>
              )}
              {result.updated.length > 0 && (
                <span className="rounded-full bg-blue-400/10 px-3 py-1 text-sm text-blue-400">
                  ↻ {t("costs.bulk.resultUpdated").replace("{count}", String(result.updated.length))}
                </span>
              )}
              {result.errors.length > 0 && (
                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-sm text-amber-400">
                  ⚠ {t("costs.bulk.resultErrors").replace("{count}", String(result.errors.length))}
                </span>
              )}
            </div>

            {result.errors.length > 0 && (
              <>
                <div className="max-h-40 overflow-auto rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-amber-400">
                      Fila {e.row} ({e.sku}): {e.error}
                    </p>
                  ))}
                </div>
                <button
                  onClick={handleDownloadErrors}
                  className="flex items-center gap-1.5 self-start text-xs text-muted-foreground hover:text-foreground"
                >
                  <Download size={12} />
                  {t("costs.bulk.downloadErrors")}
                </button>
              </>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Paste Modal ──────────────────────────────────────────────────────────────

function PasteModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (stats: CostStats) => void;
}) {
  const t = useT();
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [step, setStep] = useState<"input" | "preview" | "result">("input");
  const [result, setResult] = useState<BulkCostResult | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setRaw("");
    setRows([]);
    setStep("input");
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handlePreview() {
    // For paste, try CSV first; if single-column, treat as SKU list
    let parsed = parseCSV(raw);
    if (parsed.length === 0) {
      // Treat as plain SKU list, one per line
      parsed = raw
        .trim()
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => ({ sku: l.trim() }));
    }
    setRows(parsed);
    setStep("preview");
  }

  async function handleUpload() {
    setLoading(true);
    try {
      const apiRows = rowsToApiFormat(rows);
      const res = await costsApi.bulk(apiRows, "paste");
      setResult(res);
      setStep("result");
      if (res.errors.length === 0) {
        onSuccess(res.stats);
        setTimeout(handleClose, 1500);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={t("costs.paste.title")} size="lg">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{t("costs.paste.description")}</p>

        {step === "input" && (
          <>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={t("costs.paste.placeholder")}
              rows={8}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleClose}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handlePreview}
                disabled={!raw.trim()}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                {t("costs.paste.preview").replace("{count}", "")}
              </button>
            </div>
          </>
        )}

        {step === "preview" && (
          <>
            <p className="text-sm text-muted-foreground">
              {t("costs.paste.preview").replace("{count}", String(rows.length))}
            </p>
            <div className="max-h-64 overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50 sticky top-0">
                  <tr>
                    {["SKU", "Nombre", "Costo"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-secondary/20">
                      <td className="px-3 py-2 font-mono text-foreground">{r.sku}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.product_name || "—"}</td>
                      <td className="px-3 py-2 text-right text-foreground">
                        {r.effective_unit_cost_value || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between gap-2">
              <button onClick={() => setStep("input")} className="text-sm text-muted-foreground hover:text-foreground">
                {t("common.back")}
              </button>
              <button
                onClick={handleUpload}
                disabled={loading || rows.length === 0}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                {loading
                  ? t("common.loading")
                  : t("costs.paste.upload").replace("{count}", String(rows.length))}
              </button>
            </div>
          </>
        )}

        {step === "result" && result && (
          <div className="flex flex-col gap-3">
            <span className="text-sm text-emerald-400">
              ✓ {result.created.length} creados, {result.updated.length} actualizados
            </span>
            {result.errors.length > 0 && (
              <div className="rounded border border-amber-400/20 bg-amber-400/5 p-3">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-amber-400">
                    Fila {e.row}: {e.error}
                  </p>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={handleClose} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90">
                {t("common.close")}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Mass Edit Modal ──────────────────────────────────────────────────────────

function MassEditModal({
  open,
  selectedSkus,
  onClose,
  onSuccess,
}: {
  open: boolean;
  selectedSkus: string[];
  onClose: () => void;
  onSuccess: (stats: CostStats) => void;
}) {
  const t = useT();
  const [action, setAction] = useState<"cost" | "confidence" | "currency">("cost");
  const [costValue, setCostValue] = useState("");
  const [clearCost, setClearCost] = useState(false);
  const [confidence, setConfidence] = useState("high");
  const [currency, setCurrency] = useState("ARS");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);

  function reset() {
    setCostValue("");
    setClearCost(false);
    setAction("cost");
    setSuccess(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleApply() {
    setLoading(true);
    try {
      const patch: Record<string, unknown> = {};
      if (action === "cost") {
        patch.effective_unit_cost_value = clearCost ? null : parseFloat(costValue);
      } else if (action === "confidence") {
        patch.cost_confidence = confidence;
      } else {
        patch.effective_unit_cost_currency = currency;
      }

      const res = await costsApi.applyBulkEdit(selectedSkus, patch);
      setSuccess(res.updated_count);
      onSuccess(res.stats);
      setTimeout(handleClose, 1500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    action === "confidence" ||
    action === "currency" ||
    clearCost ||
    (costValue.trim() !== "" && !isNaN(parseFloat(costValue)) && parseFloat(costValue) >= 0);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t("costs.massEdit.title").replace("{count}", String(selectedSkus.length))}
      size="md"
    >
      {success !== null ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <Check size={32} className="text-emerald-400" />
          <p className="text-sm text-foreground">
            {t("costs.massEdit.success").replace("{count}", String(success))}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t("costs.massEdit.description")}</p>

          {/* Action selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("costs.massEdit.action")}</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as "cost" | "confidence" | "currency")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="cost">{t("costs.massEdit.actionSetCost")}</option>
              <option value="confidence">{t("costs.massEdit.actionSetConfidence")}</option>
              <option value="currency">{t("costs.massEdit.actionSetCurrency")}</option>
            </select>
          </div>

          {/* Value input depending on action */}
          {action === "cost" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">{t("costs.massEdit.newValue")}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costValue}
                  onChange={(e) => { setCostValue(e.target.value); setClearCost(false); }}
                  disabled={clearCost}
                  placeholder="0.00"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-40"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearCost}
                  onChange={(e) => { setClearCost(e.target.checked); setCostValue(""); }}
                  className="rounded"
                />
                {t("costs.massEdit.clearCost")}
              </label>
            </div>
          )}

          {action === "confidence" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("costs.massEdit.newValue")}</label>
              <select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="high">{t("costs.toolbar.confidenceHigh")}</option>
                <option value="medium">{t("costs.toolbar.confidenceMedium")}</option>
                <option value="low">{t("costs.toolbar.confidenceLow")}</option>
              </select>
            </div>
          )}

          {action === "currency" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("costs.massEdit.newValue")}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
                <option value="BRL">BRL</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={handleClose} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              {t("common.cancel")}
            </button>
            <button
              onClick={handleApply}
              disabled={loading || !canSubmit}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
            >
              {loading
                ? t("common.loading")
                : t("costs.massEdit.confirm").replace("{count}", String(selectedSkus.length))}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Catalog Import Modal ─────────────────────────────────────────────────────

function CatalogImportModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useT();
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<{ sku: string; product_name?: string; variant_name?: string }[]>([]);
  const [step, setStep] = useState<"input" | "preview" | "result">("input");
  const [result, setResult] = useState<BulkCostResult | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() { setRaw(""); setRows([]); setStep("input"); setResult(null); }
  function handleClose() { reset(); onClose(); }

  function handlePreview() {
    const parsed = parseCSV(raw);
    const mapped = parsed.map((r) => ({
      sku: r.sku?.trim() ?? "",
      product_name: r.product_name?.trim() || undefined,
      variant_name: r.variant_name?.trim() || undefined,
    }));
    setRows(mapped.filter((r) => r.sku));
    setStep("preview");
  }

  async function handleUpload() {
    setLoading(true);
    try {
      const res = await catalogApi.importSkus(rows);
      setResult(res);
      setStep("result");
      onSuccess();
      if (res.errors.length === 0) setTimeout(handleClose, 1500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={t("costs.catalogImport.title")} size="lg">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{t("costs.catalogImport.description")}</p>

        {step === "input" && (
          <>
            <p className="text-xs text-muted-foreground">{t("costs.catalogImport.format")}</p>
            <p className="rounded bg-secondary px-3 py-1.5 font-mono text-xs text-muted-foreground">
              {t("costs.catalogImport.example")}
            </p>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={t("costs.catalogImport.placeholder")}
              rows={7}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="flex justify-end gap-2">
              <button onClick={handleClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{t("common.cancel")}</button>
              <button onClick={handlePreview} disabled={!raw.trim()} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50">
                {t("costs.paste.preview").replace("{count}", "")}
              </button>
            </div>
          </>
        )}

        {step === "preview" && (
          <>
            <p className="text-sm text-muted-foreground">{rows.length} SKUs detectados</p>
            <div className="max-h-52 overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50 sticky top-0"><tr>
                  {["SKU", "Nombre", "Variante"].map((h) => <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r, i) => (
                    <tr key={i}><td className="px-3 py-2 font-mono text-foreground">{r.sku}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.product_name || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.variant_name || "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between gap-2">
              <button onClick={() => setStep("input")} className="text-sm text-muted-foreground hover:text-foreground">{t("common.back")}</button>
              <button onClick={handleUpload} disabled={loading || rows.length === 0} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50">
                {loading ? t("common.loading") : t("costs.catalogImport.upload").replace("{count}", String(rows.length))}
              </button>
            </div>
          </>
        )}

        {step === "result" && result && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-emerald-400">✓ {result.created.length} SKUs importados, {result.updated.length} actualizados</p>
            {result.errors.length > 0 && (
              <div className="rounded border border-amber-400/20 bg-amber-400/5 p-3">
                {result.errors.map((e, i) => <p key={i} className="text-xs text-amber-400">Fila {e.row}: {e.error}</p>)}
              </div>
            )}
            <div className="flex justify-end"><button onClick={handleClose} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90">{t("common.close")}</button></div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Pro Tab ──────────────────────────────────────────────────────────────────

const PRO_CARDS = [
  { key: "bom", icon: Layers, color: "text-blue-400", bg: "bg-blue-400/10" },
  { key: "roll", icon: RefreshCw, color: "text-purple-400", bg: "bg-purple-400/10" },
  { key: "routes", icon: Filter, color: "text-amber-400", bg: "bg-amber-400/10" },
  { key: "overhead", icon: Sparkles, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { key: "versioning", icon: CircleSlash, color: "text-rose-400", bg: "bg-rose-400/10" },
] as const;

function ProTab() {
  const t = useT();
  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-400/20 bg-blue-400/5 px-4 py-4">
        <Lock size={18} className="mt-0.5 shrink-0 text-blue-400" />
        <div>
          <p className="text-sm font-medium text-blue-400">{t("costs.pro.banner")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("costs.pro.bannerDesc")}</p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRO_CARDS.map(({ key, icon: Icon, color, bg }) => (
          <div
            key={key}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
          >
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", bg)}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t(`costs.pro.cards.${key}.title` as never)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(`costs.pro.cards.${key}.desc` as never)}
              </p>
            </div>
            <div className="rounded-md bg-secondary px-3 py-2">
              <p className="font-mono text-xs text-muted-foreground">
                {t(`costs.pro.cards.${key}.example` as never)}
              </p>
            </div>
            <button
              disabled
              className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground opacity-50 cursor-not-allowed"
            >
              <Lock size={12} />
              {t("costs.pro.ctaDisabled")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Simple Tab ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

function SimpleTab() {
  const t = useT();

  // Data state
  const [items, setItems] = useState<CostSKU[]>([]);
  const [stats, setStats] = useState<CostStats>({ total_count: 0, missing_count: 0, low_confidence_count: 0 });
  const [page, setPage] = useState({ offset: 0, limit: PAGE_SIZE, total: 0, has_more: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [confidenceFilter, setConfidenceFilter] = useState("");

  // Inline edit
  const [editingCell, setEditingCell] = useState<{ sku: string; field: "cost" | "name" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingSkus, setSavingSkus] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modals
  const [bulkCsvOpen, setBulkCsvOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [massEditOpen, setMassEditOpen] = useState(false);
  const [catalogImportOpen, setCatalogImportOpen] = useState(false);

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Load data ──
  const loadData = useCallback(
    async (offset = 0) => {
      setLoading(true);
      setError(null);
      try {
        const result = await costsApi.list({
          search: debouncedSearch || undefined,
          missing_only: missingOnly || undefined,
          confidence: confidenceFilter || undefined,
          limit: PAGE_SIZE,
          offset,
        });
        setItems(result.items);
        setStats(result.stats);
        setPage(result.page);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, missingOnly, confidenceFilter]
  );

  useEffect(() => {
    loadData(0);
  }, [loadData]);

  // ── Inline edit ──
  function startEdit(sku: string, field: "cost" | "name", currentValue: string) {
    setEditingCell({ sku, field });
    setEditValue(currentValue);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function commitEdit() {
    if (!editingCell) return;
    const { sku, field } = editingCell;
    setEditingCell(null);

    const patch: Record<string, unknown> = {};
    if (field === "cost") {
      const parsed = editValue.trim() === "" ? null : parseFloat(editValue);
      if (editValue.trim() !== "" && (isNaN(parsed as number) || (parsed as number) < 0)) return;
      patch.effective_unit_cost_value = parsed;
    } else {
      patch.product_name = editValue.trim() || null;
    }

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => {
        if (item.sku !== sku) return item;
        if (field === "cost") return { ...item, effective_unit_cost_value: patch.effective_unit_cost_value as number | null };
        return { ...item, product_name: patch.product_name as string | null };
      })
    );

    setSavingSkus((prev) => new Set(prev).add(sku));
    try {
      const updated = await costsApi.patch(sku, patch);
      setItems((prev) => prev.map((item) => (item.sku === sku ? updated : item)));
      // Refresh stats (missing count might change)
      const freshStats = await costsApi.stats();
      setStats(freshStats);
    } catch {
      loadData(page.offset); // revert on error
    } finally {
      setSavingSkus((prev) => { const s = new Set(prev); s.delete(sku); return s; });
    }
  }

  async function handleConfidenceChange(sku: string, confidence: string) {
    // Optimistic
    setItems((prev) => prev.map((item) => item.sku === sku ? { ...item, cost_confidence: confidence as CostConfidence } : item));
    try {
      await costsApi.patch(sku, { cost_confidence: confidence });
      const freshStats = await costsApi.stats();
      setStats(freshStats);
    } catch {
      loadData(page.offset);
    }
  }

  async function handleCurrencyChange(sku: string, currency: string) {
    setItems((prev) => prev.map((item) => item.sku === sku ? { ...item, effective_unit_cost_currency: currency } : item));
    try {
      await costsApi.patch(sku, { effective_unit_cost_currency: currency });
    } catch {
      loadData(page.offset);
    }
  }

  // ── Selection ──
  function toggleSelectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.sku)));
    }
  }

  function toggleSelect(sku: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  }

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && selected.size < items.length;

  // ── Pagination ──
  const from = page.total === 0 ? 0 : page.offset + 1;
  const to = Math.min(page.offset + items.length, page.total);

  function handlePrev() {
    const newOffset = Math.max(0, page.offset - PAGE_SIZE);
    loadData(newOffset);
  }

  function handleNext() {
    if (page.has_more) loadData(page.offset + PAGE_SIZE);
  }

  // ── Refresh after modal actions ──
  function handleBulkSuccess(newStats: CostStats) {
    setStats(newStats);
    loadData(0);
    setSelected(new Set());
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent";

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("costs.toolbar.search")}
              className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Missing only toggle */}
          <button
            onClick={() => setMissingOnly((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors",
              missingOnly
                ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <AlertTriangle size={13} />
            {t("costs.toolbar.missingOnly")}
          </button>

          {/* Confidence filter */}
          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">{t("costs.toolbar.confidenceAll")}</option>
            <option value="high">{t("costs.toolbar.confidenceHigh")}</option>
            <option value="medium">{t("costs.toolbar.confidenceMedium")}</option>
            <option value="low">{t("costs.toolbar.confidenceLow")}</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            {/* Import SKUs */}
            <button
              onClick={() => setCatalogImportOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download size={13} />
              {t("costs.toolbar.importSkus")}
            </button>

            {/* Paste */}
            <button
              onClick={() => setPasteOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil size={13} />
              {t("costs.toolbar.paste")}
            </button>

            {/* CSV */}
            <button
              onClick={() => setBulkCsvOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              <Upload size={13} />
              {t("costs.toolbar.bulkCsv")}
            </button>

            {/* Mass edit (only if selection) */}
            {selected.size > 0 && (
              <button
                onClick={() => setMassEditOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent hover:bg-accent/20 transition-colors"
              >
                <Sparkles size={13} />
                {t("costs.toolbar.massEdit").replace("{count}", String(selected.size))}
              </button>
            )}
          </div>
        </div>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-border bg-secondary/50 px-3 py-0.5 text-xs text-muted-foreground">
            {t("costs.toolbar.chipTotal").replace("{count}", String(stats.total_count))}
          </span>
          {stats.missing_count > 0 && (
            <button
              onClick={() => setMissingOnly(true)}
              className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 text-xs text-amber-400 hover:bg-amber-400/20 transition-colors"
            >
              {t("costs.toolbar.chipMissing").replace("{count}", String(stats.missing_count))}
            </button>
          )}
          {stats.low_confidence_count > 0 && (
            <button
              onClick={() => setConfidenceFilter("low")}
              className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-0.5 text-xs text-red-400 hover:bg-red-400/20 transition-colors"
            >
              {t("costs.toolbar.chipLowConf").replace("{count}", String(stats.low_confidence_count))}
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : items.length === 0 ? (
          <EmptyState
            message={t("costs.table.noData")}
            icon={<CircleSlash size={32} />}
          >
            {stats.total_count === 0 && (
              <button
                onClick={() => setCatalogImportOpen(true)}
                className="mt-2 text-sm text-accent hover:text-accent/80"
              >
                {t("costs.table.importCta")}
              </button>
            )}
          </EmptyState>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    {[
                      t("costs.table.sku"),
                      t("costs.table.name"),
                      t("costs.table.stock"),
                      t("costs.table.cost"),
                      t("costs.table.currency"),
                      t("costs.table.confidence"),
                      t("costs.table.validFrom"),
                      t("costs.table.status"),
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => {
                    const isMissing = item.effective_unit_cost_value === null;
                    const isEditing = (field: "cost" | "name") =>
                      editingCell?.sku === item.sku && editingCell?.field === field;
                    const isSaving = savingSkus.has(item.sku);
                    const isSelected = selected.has(item.sku);

                    return (
                      <tr
                        key={item.sku}
                        className={cn(
                          "transition-colors",
                          isSelected ? "bg-accent/5" : "hover:bg-secondary/30",
                          isMissing && "border-l-2 border-l-amber-400/40"
                        )}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.sku)}
                            className="rounded"
                          />
                        </td>

                        {/* SKU */}
                        <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                          {item.sku}
                        </td>

                        {/* Name — inline editable */}
                        <td className="px-4 py-3 min-w-[160px]">
                          {isEditing("name") ? (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitEdit();
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              onBlur={commitEdit}
                              className="w-full rounded border border-accent bg-background px-2 py-1 text-sm text-foreground focus:outline-none"
                            />
                          ) : (
                            <button
                              onClick={() => startEdit(item.sku, "name", item.product_name ?? "")}
                              className="group flex w-full items-center gap-1 text-left text-muted-foreground hover:text-foreground"
                            >
                              <span className="flex-1 truncate">
                                {item.product_name ?? "—"}
                                {item.variant_name && (
                                  <span className="ml-1 text-xs opacity-60">
                                    / {item.variant_name}
                                  </span>
                                )}
                              </span>
                              <Pencil size={11} className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                            </button>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.stock_qty != null ? (
                            <span>
                              {item.stock_qty.toLocaleString("es-AR")}
                              {item.stock_source === "commerce_sync" && (
                                <span className="ml-1 text-xs opacity-50">
                                  {t("costs.table.stockEstimated")}
                                </span>
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Cost — inline editable */}
                        <td className="px-4 py-3 min-w-[130px]">
                          {isEditing("cost") ? (
                            <div className="flex flex-col gap-0.5">
                              <input
                                ref={inputRef}
                                type="number"
                                min="0"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitEdit();
                                  if (e.key === "Escape") setEditingCell(null);
                                }}
                                onBlur={commitEdit}
                                placeholder={t("costs.table.editPlaceholder")}
                                className="w-full rounded border border-accent bg-background px-2 py-1 text-sm text-right text-foreground focus:outline-none"
                              />
                              <span className="text-right text-xs text-muted-foreground opacity-60">
                                {t("costs.table.savingHint")}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                startEdit(
                                  item.sku,
                                  "cost",
                                  item.effective_unit_cost_value != null
                                    ? String(item.effective_unit_cost_value)
                                    : ""
                                )
                              }
                              disabled={isSaving}
                              className={cn(
                                "group flex w-full items-center justify-end gap-1 text-right transition-colors",
                                isMissing
                                  ? "text-amber-400/80 hover:text-amber-400"
                                  : "text-foreground hover:text-foreground"
                              )}
                            >
                              <span className="flex-1 text-right">
                                {isSaving ? (
                                  <RefreshCw size={12} className="ml-auto animate-spin text-accent" />
                                ) : item.effective_unit_cost_value != null ? (
                                  `$${item.effective_unit_cost_value.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                                ) : (
                                  <span className="italic opacity-60">—</span>
                                )}
                              </span>
                              <Pencil size={11} className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                            </button>
                          )}
                        </td>

                        {/* Currency */}
                        <td className="px-4 py-3">
                          <select
                            value={item.effective_unit_cost_currency}
                            onChange={(e) => handleCurrencyChange(item.sku, e.target.value)}
                            className="rounded border border-border bg-transparent px-1.5 py-0.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                          >
                            <option>ARS</option>
                            <option>USD</option>
                            <option>BRL</option>
                          </select>
                        </td>

                        {/* Confidence */}
                        <td className="px-4 py-3">
                          <select
                            value={item.cost_confidence}
                            onChange={(e) => handleConfidenceChange(item.sku, e.target.value)}
                            className={cn(
                              "rounded border bg-transparent px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent",
                              item.cost_confidence === "high" &&
                                "border-emerald-400/30 text-emerald-400",
                              item.cost_confidence === "medium" &&
                                "border-amber-400/30 text-amber-400",
                              item.cost_confidence === "low" && "border-red-400/30 text-red-400"
                            )}
                          >
                            <option value="high">{t("costs.toolbar.confidenceHigh")}</option>
                            <option value="medium">{t("costs.toolbar.confidenceMedium")}</option>
                            <option value="low">{t("costs.toolbar.confidenceLow")}</option>
                          </select>
                        </td>

                        {/* Valid from */}
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {item.valid_from ?? "—"}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <CostStatusBadge sku={item} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-xs text-muted-foreground">
                {t("costs.table.showing")
                  .replace("{from}", String(from))
                  .replace("{to}", String(to))
                  .replace("{total}", String(page.total))}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  disabled={page.offset === 0}
                  className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={handleNext}
                  disabled={!page.has_more}
                  className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <BulkCsvModal
        open={bulkCsvOpen}
        onClose={() => setBulkCsvOpen(false)}
        onSuccess={handleBulkSuccess}
      />
      <PasteModal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onSuccess={handleBulkSuccess}
      />
      <MassEditModal
        open={massEditOpen}
        selectedSkus={Array.from(selected)}
        onClose={() => setMassEditOpen(false)}
        onSuccess={(newStats) => {
          setStats(newStats);
          loadData(page.offset);
          setSelected(new Set());
          setMassEditOpen(false);
        }}
      />
      <CatalogImportModal
        open={catalogImportOpen}
        onClose={() => setCatalogImportOpen(false)}
        onSuccess={() => loadData(0)}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CostsPage() {
  const t = useT();
  const [activeTab, setActiveTab] = useState<"simple" | "pro">("simple");

  return (
    <AppShell title={t("costs.title")}>
      <div className="flex flex-col gap-5">
        {/* Tab switcher */}
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1 self-start">
          {(["simple", "pro"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "pro" && <Lock size={12} />}
              {t(`costs.tabs.${tab}` as never)}
            </button>
          ))}
        </div>

        {activeTab === "simple" ? <SimpleTab /> : <ProTab />}
      </div>
    </AppShell>
  );
}
