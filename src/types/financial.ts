export interface SKUMargin {
  sku: string;
  gross_revenue: number;
  net_revenue: number;
  total_cost: number;
  net_margin: number;
  net_margin_pct: number;
}

export interface CashFlow {
  immobilized_capital: number;
  days_to_cash: number;
  current_cash_position: number;
}

export interface FinancialSurvivalScore {
  score: number;
  label: "Crítico" | "Precaución" | "Saludable" | "Óptimo";
  color?: string;
  recommended_ads_budget: number;
  explanation: string | string[];
  llm_insight?: string;
}

export interface DashboardSummary {
  survival_score: FinancialSurvivalScore;
  cash_flow: CashFlow;
  top_margins: SKUMargin[];
}

// Commerce platform types
export type CommercePlatform = "tiendanube" | "shopify" | "woocommerce";

export interface TiendanubeCredentials {
  store_id: string;
  access_token: string;
}

export interface ShopifyCredentials {
  shop_domain: string;
  access_token: string;
}

export interface WooCommerceCredentials {
  site_url: string;
  consumer_key: string;
  consumer_secret: string;
}

export type PlatformCredentials =
  | TiendanubeCredentials
  | ShopifyCredentials
  | WooCommerceCredentials;

export interface CommerceIngestRequest {
  platform: CommercePlatform;
  credentials: PlatformCredentials;
}

// Unified inventory types
export interface UnifiedInventoryItem {
  sku: string;
  units_available: number;
  units_reserved: number;
  source_platform: CommercePlatform;
  snapshot_at: string;
  had_conflict: boolean;
  resolution: string;
}

export interface UnifiedInventoryResponse {
  items: UnifiedInventoryItem[];
  total_skus: number;
  conflicted_skus: number;
  unresolved_skus: number;
  warnings: string[];
  computed_at: string;
}

export interface InventorySourceEntry {
  sku: string;
  primary_platform: CommercePlatform;
}

export interface InventorySourcesResponse {
  entries: InventorySourceEntry[];
}
