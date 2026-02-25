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
  recommended_ads_budget: number;
  explanation: string;
}

export interface DashboardSummary {
  survival_score: FinancialSurvivalScore;
  cash_flow: CashFlow;
  top_margins: SKUMargin[];
}
