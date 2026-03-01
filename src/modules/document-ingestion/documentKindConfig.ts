/**
 * documentKindConfig.ts
 *
 * Fuente de verdad central para la taxonomía de tipos de documento.
 * El backend tiene un espejo en document_kind_config.py.
 *
 * Cada kind define:
 * - qué campos son requeridos / opcionales
 * - sinónimos de columnas para auto-mapping
 * - estrategia de dedup
 * - target de commit
 * - si el commit está habilitado en MVP
 */

import type { LucideIcon } from "lucide-react";
import {
  BarChart2,
  Building2,
  DollarSign,
  FileText,
  HelpCircle,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import type { MappingField } from "./types";

// ─── DocumentKind enum ────────────────────────────────────────────────────────

export type DocumentKind =
  | "expenses_general"
  | "account_statement"
  | "ads_spend"
  | "sku_costs_simple"
  | "purchases_invoices"
  | "payroll"
  | "inventory_snapshot"
  | "sales_export"
  | "generic_custom";

export type DedupStrategy = "strict" | "standard" | "none";
export type CommitTarget =
  | "expenses"
  | "costs"
  | "ads_spend"
  | "inventory"
  | "analysis_only";

// ─── Extended mapping fields ──────────────────────────────────────────────────

export type ExtendedMappingField =
  | MappingField
  | "sku"
  | "stock_qty"
  | "spend_platform"
  | "week_start";

// ─── Config shape ─────────────────────────────────────────────────────────────

export interface DocumentKindConfig {
  icon: LucideIcon;
  /** i18n key prefix: ingestion.documentKinds.<kind>.* */
  labelKey: string;
  descriptionKey: string;
  exampleKey: string;
  requiredFields: ExtendedMappingField[];
  optionalFields: ExtendedMappingField[];
  /** Synonym headers per field for auto-mapping boost */
  headerSynonyms: Partial<Record<ExtendedMappingField, string[]>>;
  /** Canonical synonym headers at kind level (for auto-detect heuristic) */
  headerFingerprint: string[];
  defaultCurrency: string;
  defaultAccountRequired: boolean;
  dedupStrategy: DedupStrategy;
  commitTarget: CommitTarget;
  commitEnabled: boolean;
  /** Show "invert sign" toggle in MappingStep */
  hasInvertSign: boolean;
}

// ─── Config per kind ──────────────────────────────────────────────────────────

export const DOCUMENT_KIND_CONFIG: Record<DocumentKind, DocumentKindConfig> = {
  expenses_general: {
    icon: FileText,
    labelKey: "ingestion.documentKinds.expenses_general.title",
    descriptionKey: "ingestion.documentKinds.expenses_general.description",
    exampleKey: "ingestion.documentKinds.expenses_general.example",
    requiredFields: ["date", "amount"],
    optionalFields: ["currency", "counterparty", "note", "category", "account"],
    headerSynonyms: {
      date: ["fecha", "date", "dia", "fec"],
      amount: ["monto", "importe", "amount", "total", "valor"],
      counterparty: ["proveedor", "beneficiario", "contraparte"],
      note: ["detalle", "concepto", "descripcion", "nota"],
    },
    headerFingerprint: ["fecha", "monto", "concepto", "detalle", "gasto"],
    defaultCurrency: "ARS",
    defaultAccountRequired: true,
    dedupStrategy: "standard",
    commitTarget: "expenses",
    commitEnabled: true,
    hasInvertSign: false,
  },

  account_statement: {
    icon: Building2,
    labelKey: "ingestion.documentKinds.account_statement.title",
    descriptionKey: "ingestion.documentKinds.account_statement.description",
    exampleKey: "ingestion.documentKinds.account_statement.example",
    requiredFields: ["date", "amount"],
    optionalFields: ["currency", "counterparty", "note", "category"],
    headerSynonyms: {
      date: ["fecha", "date", "f. movimiento", "fec. mov"],
      amount: ["monto", "importe", "débito", "credito", "amount", "valor", "debit", "credit"],
      note: ["descripcion", "concepto", "detalle", "movimiento", "referencia"],
      counterparty: ["origen", "destino", "remitente"],
    },
    headerFingerprint: [
      "saldo", "movimiento", "extracto", "debito", "credito", "cbvu", "cvu",
      "mercadopago", "banco", "statement",
    ],
    defaultCurrency: "ARS",
    defaultAccountRequired: true,
    dedupStrategy: "strict",
    commitTarget: "expenses",
    commitEnabled: true,
    hasInvertSign: true,
  },

  sku_costs_simple: {
    icon: DollarSign,
    labelKey: "ingestion.documentKinds.sku_costs_simple.title",
    descriptionKey: "ingestion.documentKinds.sku_costs_simple.description",
    exampleKey: "ingestion.documentKinds.sku_costs_simple.example",
    requiredFields: ["sku", "amount"],
    optionalFields: ["currency", "note"],
    headerSynonyms: {
      sku: ["sku", "codigo", "código", "item", "product_code", "ref", "referencia", "art"],
      amount: [
        "costo", "cost", "precio", "price", "unit_cost", "costo_unitario",
        "effective_unit_cost_value", "valor", "amount",
      ],
      currency: ["moneda", "currency"],
      note: ["nombre", "descripcion", "producto", "variante", "product_name"],
    },
    headerFingerprint: ["sku", "costo", "cost", "unit_cost", "costo_unitario", "precio_costo"],
    defaultCurrency: "ARS",
    defaultAccountRequired: false,
    dedupStrategy: "none",
    commitTarget: "costs",
    commitEnabled: true,
    hasInvertSign: false,
  },

  purchases_invoices: {
    icon: ShoppingCart,
    labelKey: "ingestion.documentKinds.purchases_invoices.title",
    descriptionKey: "ingestion.documentKinds.purchases_invoices.description",
    exampleKey: "ingestion.documentKinds.purchases_invoices.example",
    requiredFields: ["date", "amount", "counterparty"],
    optionalFields: ["currency", "note", "category"],
    headerSynonyms: {
      date: ["fecha", "date", "fecha factura", "fecha emision"],
      amount: ["total", "importe", "monto", "amount", "subtotal", "neto"],
      counterparty: ["proveedor", "supplier", "vendedor", "empresa"],
      note: ["nro factura", "factura", "numero", "comprobante", "concepto"],
    },
    headerFingerprint: ["factura", "proveedor", "supplier", "invoice", "compra", "nro"],
    defaultCurrency: "ARS",
    defaultAccountRequired: true,
    dedupStrategy: "standard",
    commitTarget: "expenses",
    commitEnabled: true,
    hasInvertSign: false,
  },

  payroll: {
    icon: Users,
    labelKey: "ingestion.documentKinds.payroll.title",
    descriptionKey: "ingestion.documentKinds.payroll.description",
    exampleKey: "ingestion.documentKinds.payroll.example",
    requiredFields: ["date", "amount", "counterparty"],
    optionalFields: ["currency", "note", "category"],
    headerSynonyms: {
      date: ["fecha", "periodo", "mes", "fecha pago", "pay_date"],
      amount: ["sueldo", "salario", "importe", "total", "monto", "haberes", "amount"],
      counterparty: ["empleado", "nombre", "employee", "apellido y nombre"],
      note: ["concepto", "legajo", "cuil", "posicion", "cargo"],
    },
    headerFingerprint: ["sueldo", "salario", "empleado", "payroll", "nomina", "haberes", "legajo"],
    defaultCurrency: "ARS",
    defaultAccountRequired: true,
    dedupStrategy: "standard",
    commitTarget: "expenses",
    commitEnabled: true,
    hasInvertSign: false,
  },

  ads_spend: {
    icon: TrendingUp,
    labelKey: "ingestion.documentKinds.ads_spend.title",
    descriptionKey: "ingestion.documentKinds.ads_spend.description",
    exampleKey: "ingestion.documentKinds.ads_spend.example",
    requiredFields: ["date", "amount"],
    optionalFields: ["currency", "note", "spend_platform", "week_start"],
    headerSynonyms: {
      date: ["date", "fecha", "week", "semana", "week_start", "periodo"],
      amount: ["spend", "gasto", "amount", "cost", "costo", "importe"],
      note: ["campaign", "campana", "campaña", "ad_name", "anuncio"],
      spend_platform: ["platform", "plataforma", "red", "canal", "source"],
    },
    headerFingerprint: ["ads", "spend", "campaign", "impression", "click", "cpm", "cpc", "roas"],
    defaultCurrency: "USD",
    defaultAccountRequired: true,
    dedupStrategy: "none",
    commitTarget: "expenses",
    commitEnabled: true,
    hasInvertSign: false,
  },

  inventory_snapshot: {
    icon: Package,
    labelKey: "ingestion.documentKinds.inventory_snapshot.title",
    descriptionKey: "ingestion.documentKinds.inventory_snapshot.description",
    exampleKey: "ingestion.documentKinds.inventory_snapshot.example",
    requiredFields: ["sku", "stock_qty"],
    optionalFields: ["note"],
    headerSynonyms: {
      sku: ["sku", "codigo", "item", "product_code"],
      stock_qty: ["stock", "cantidad", "qty", "quantity", "disponible"],
      note: ["producto", "nombre", "variante"],
    },
    headerFingerprint: ["stock", "inventory", "cantidad", "qty", "disponible"],
    defaultCurrency: "ARS",
    defaultAccountRequired: false,
    dedupStrategy: "none",
    commitTarget: "inventory",
    commitEnabled: false,
    hasInvertSign: false,
  },

  sales_export: {
    icon: BarChart2,
    labelKey: "ingestion.documentKinds.sales_export.title",
    descriptionKey: "ingestion.documentKinds.sales_export.description",
    exampleKey: "ingestion.documentKinds.sales_export.example",
    requiredFields: ["date", "amount"],
    optionalFields: ["note", "counterparty", "sku"],
    headerSynonyms: {
      date: ["fecha", "date", "order_date", "fecha orden"],
      amount: ["total", "amount", "revenue", "venta", "importe"],
      sku: ["sku", "product_id", "item_id"],
      counterparty: ["cliente", "customer", "comprador"],
    },
    headerFingerprint: ["order", "venta", "revenue", "pedido", "orden", "customer", "cliente"],
    defaultCurrency: "ARS",
    defaultAccountRequired: false,
    dedupStrategy: "none",
    commitTarget: "analysis_only",
    commitEnabled: false,
    hasInvertSign: false,
  },

  generic_custom: {
    icon: HelpCircle,
    labelKey: "ingestion.documentKinds.generic_custom.title",
    descriptionKey: "ingestion.documentKinds.generic_custom.description",
    exampleKey: "ingestion.documentKinds.generic_custom.example",
    requiredFields: ["date", "amount"],
    optionalFields: ["currency", "counterparty", "note", "category", "account"],
    headerSynonyms: {},
    headerFingerprint: [],
    defaultCurrency: "ARS",
    defaultAccountRequired: false,
    dedupStrategy: "standard",
    commitTarget: "expenses",
    commitEnabled: true,
    hasInvertSign: false,
  },
};

// ─── Auto-detect heuristic ────────────────────────────────────────────────────

export interface KindDetectionResult {
  kind: DocumentKind;
  confidence: "high" | "medium" | "low";
  score: number;
}

/**
 * Detects the most likely DocumentKind from the CSV/Sheet headers.
 * Returns the top match with a confidence level.
 */
export function detectDocumentKind(headers: string[]): KindDetectionResult {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  let bestKind: DocumentKind = "generic_custom";
  let bestScore = 0;

  const kinds = Object.keys(DOCUMENT_KIND_CONFIG) as DocumentKind[];

  for (const kind of kinds) {
    if (kind === "generic_custom") continue;
    const config = DOCUMENT_KIND_CONFIG[kind];
    let score = 0;

    for (const fingerprint of config.headerFingerprint) {
      if (normalizedHeaders.some((h) => h.includes(fingerprint))) {
        score++;
      }
    }

    // Bonus: if required field synonyms match
    for (const field of config.requiredFields) {
      const synonyms = config.headerSynonyms[field] ?? [];
      if (normalizedHeaders.some((h) => synonyms.some((s) => h.includes(s)))) {
        score += 0.5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestKind = kind;
    }
  }

  const maxPossible =
    (DOCUMENT_KIND_CONFIG[bestKind]?.headerFingerprint.length ?? 0) +
    (DOCUMENT_KIND_CONFIG[bestKind]?.requiredFields.length ?? 0) * 0.5;

  const ratio = maxPossible > 0 ? bestScore / maxPossible : 0;
  const confidence: "high" | "medium" | "low" =
    ratio >= 0.6 ? "high" : ratio >= 0.3 ? "medium" : "low";

  return { kind: bestKind, confidence, score: bestScore };
}

// ─── Ordered list for the KindStep UI ────────────────────────────────────────

export const DOCUMENT_KIND_ORDER: DocumentKind[] = [
  "expenses_general",
  "account_statement",
  "purchases_invoices",
  "payroll",
  "sku_costs_simple",
  "ads_spend",
  "inventory_snapshot",
  "sales_export",
  "generic_custom",
];
