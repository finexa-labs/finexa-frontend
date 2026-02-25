import type { SKUMargin } from "@/types/financial";

export function MarginTable({ margins }: { margins: SKUMargin[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-medium text-gray-500">Margen por SKU</h2>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th className="px-6 py-3 text-left">SKU</th>
            <th className="px-6 py-3 text-right">Ingreso neto</th>
            <th className="px-6 py-3 text-right">Costo total</th>
            <th className="px-6 py-3 text-right">Margen neto</th>
            <th className="px-6 py-3 text-right">Margen %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {margins.map((m) => (
            <tr key={m.sku} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-3 font-mono text-gray-800">{m.sku}</td>
              <td className="px-6 py-3 text-right">${Number(m.net_revenue).toLocaleString("es-AR")}</td>
              <td className="px-6 py-3 text-right">${Number(m.total_cost).toLocaleString("es-AR")}</td>
              <td className="px-6 py-3 text-right font-medium">${Number(m.net_margin).toLocaleString("es-AR")}</td>
              <td className={`px-6 py-3 text-right font-semibold ${m.net_margin_pct >= 20 ? "text-green-600" : "text-orange-500"}`}>
                {m.net_margin_pct}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
