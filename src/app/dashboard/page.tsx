import { AppShell } from "@/components/layout/AppShell";
import { SurvivalScoreCard } from "@/components/metrics/SurvivalScoreCard";
import { CashFlowCard } from "@/components/metrics/CashFlowCard";
import { MarginTable } from "@/components/metrics/MarginTable";
import { getDashboardSummary } from "@/lib/api";

export default async function DashboardPage() {
  const data = await getDashboardSummary();

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h1>

        {/* Fila principal: Score + Caja */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SurvivalScoreCard score={data.survival_score} />
          <CashFlowCard cashFlow={data.cash_flow} />
        </div>

        {/* Tabla de márgenes por SKU */}
        <MarginTable margins={data.top_margins} />
      </div>
    </AppShell>
  );
}
