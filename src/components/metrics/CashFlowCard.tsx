import type { CashFlow } from "@/types/financial";

export function CashFlowCard({ cashFlow }: { cashFlow: CashFlow }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-sm font-medium text-gray-500">Estado de Caja</h2>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-400">Caja disponible</p>
          <p className="text-lg font-bold text-gray-900">
            ${Number(cashFlow.current_cash_position).toLocaleString("es-AR")}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Capital inmovilizado</p>
          <p className="text-lg font-bold text-orange-600">
            ${Number(cashFlow.immobilized_capital).toLocaleString("es-AR")}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Días a caja</p>
          <p className="text-lg font-bold text-gray-900">{cashFlow.days_to_cash}d</p>
        </div>
      </div>
    </div>
  );
}
