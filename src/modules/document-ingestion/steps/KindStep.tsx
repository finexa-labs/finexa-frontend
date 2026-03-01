"use client";

import { cn } from "@/lib/utils";
import {
  DOCUMENT_KIND_CONFIG,
  DOCUMENT_KIND_ORDER,
  type DocumentKind,
  type KindDetectionResult,
} from "../documentKindConfig";
import type { KindSuggestion } from "@/modules/intelligence/types";
import { KindSuggestionBanner } from "@/modules/intelligence/components/KindSuggestionBanner";

interface KindStepProps {
  selectedKind: string;
  detection: KindDetectionResult | null;
  aiSuggestion?: KindSuggestion | null;
  onSelect: (kind: DocumentKind) => void;
  onNext: () => void;
  onDismissAiSuggestion?: () => void;
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  low: "text-muted-foreground border-border bg-secondary",
};

// Short descriptions shown below the label on each card
const KIND_EXAMPLE: Record<DocumentKind, string> = {
  expenses_general: "fecha, monto, detalle",
  account_statement: "fecha, débito/crédito, saldo",
  purchases_invoices: "fecha, proveedor, nro. factura, total",
  payroll: "empleado, sueldo, período",
  sku_costs_simple: "sku, costo_unitario",
  ads_spend: "semana, plataforma, spend",
  inventory_snapshot: "sku, stock",
  sales_export: "fecha, orden, cliente, total",
  generic_custom: "cualquier formato",
};

export function KindStep({
  selectedKind,
  detection,
  aiSuggestion,
  onSelect,
  onNext,
  onDismissAiSuggestion,
}: KindStepProps) {
  const detectedConfig =
    detection && DOCUMENT_KIND_CONFIG[detection.kind as DocumentKind];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">
          ¿Qué tipo de documento vas a importar?
        </h3>
        <p className="text-xs text-muted-foreground">
          Esto guía el auto-mapeo de columnas, las validaciones y el destino del commit.
        </p>
      </div>

      {/* AI kind suggestion */}
      {aiSuggestion && onDismissAiSuggestion && (
        <KindSuggestionBanner
          suggestion={aiSuggestion}
          onApply={(kind) => onSelect(kind as DocumentKind)}
          onDismiss={onDismissAiSuggestion}
        />
      )}

      {/* Auto-detect suggestion (heuristic) */}
      {detection && detection.score > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/50 px-4 py-3">
          <div className="flex flex-col gap-0.5 flex-1">
            <span className="text-xs text-muted-foreground">Detectado automáticamente</span>
            <span className="text-sm font-medium text-foreground">
              {detectedConfig
                ? detection.kind.replace(/_/g, " ")
                : detection.kind}
            </span>
          </div>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-xs font-medium",
              CONFIDENCE_COLOR[detection.confidence]
            )}
          >
            {CONFIDENCE_LABEL[detection.confidence]}
          </span>
          <button
            onClick={() => onSelect(detection.kind as DocumentKind)}
            className="rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}

      {/* Kind grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOCUMENT_KIND_ORDER.map((kind) => {
          const cfg = DOCUMENT_KIND_CONFIG[kind];
          const Icon = cfg.icon;
          const isSelected = selectedKind === kind;

          return (
            <button
              key={kind}
              onClick={() => onSelect(kind)}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                isSelected
                  ? "border-accent bg-accent/10"
                  : "border-border bg-card hover:border-accent/40 hover:bg-secondary/50"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon
                  size={16}
                  className={isSelected ? "text-accent" : "text-muted-foreground"}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-accent" : "text-foreground"
                  )}
                >
                  {kind === "generic_custom"
                    ? "No estoy seguro"
                    : kind.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                </span>
                {!cfg.commitEnabled && (
                  <span className="ml-auto rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-xs text-amber-400">
                    solo análisis
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {kind === "expenses_general" && "Gastos corrientes del negocio (facturas, servicios, etc.)"}
                {kind === "account_statement" && "Extracto bancario o movimientos de MercadoPago"}
                {kind === "purchases_invoices" && "Compras a proveedores con número de factura"}
                {kind === "payroll" && "Liquidación de sueldos y honorarios"}
                {kind === "sku_costs_simple" && "Costos unitarios por SKU para el módulo de Costos"}
                {kind === "ads_spend" && "Gastos en publicidad (Meta Ads, Google Ads, etc.)"}
                {kind === "inventory_snapshot" && "Snapshot de stock por SKU (solo análisis)"}
                {kind === "sales_export" && "Exportación de ventas/órdenes (solo análisis)"}
                {kind === "generic_custom" && "Formato libre — configurá el mapeo manualmente"}
              </p>
              <span className="text-xs text-muted-foreground/60 font-mono truncate">
                {KIND_EXAMPLE[kind]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Nav */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          disabled={!selectedKind}
          className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
