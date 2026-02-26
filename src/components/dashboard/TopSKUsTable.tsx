import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface SKURow {
  sku: string;
  unitsSold: number;
  netMargin: number;
  netMarginPct: number;
  stock: number;
  missingCost: boolean;
}

interface TopSKUsTableProps {
  rows: SKURow[];
}

export function TopSKUsTable({ rows }: TopSKUsTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">Top SKUs</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                SKU
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Uds. vendidas
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Margen neto
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Margen %
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Stock
              </th>
              <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Calidad
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr
                key={row.sku}
                className="transition-colors hover:bg-secondary/30"
              >
                <td className="px-5 py-3 font-mono text-xs text-foreground">
                  {row.sku}
                </td>
                <td className="px-5 py-3 text-right text-muted-foreground">
                  {row.unitsSold}
                </td>
                <td className="px-5 py-3 text-right font-medium text-foreground">
                  ${row.netMargin.toLocaleString("es-AR")}
                </td>
                <td
                  className={cn(
                    "px-5 py-3 text-right font-semibold",
                    row.netMarginPct >= 20
                      ? "text-emerald-400"
                      : row.netMarginPct >= 10
                        ? "text-amber-400"
                        : "text-red-400"
                  )}
                >
                  {row.netMarginPct}%
                </td>
                <td className="px-5 py-3 text-right text-muted-foreground">
                  {row.stock}
                </td>
                <td className="px-5 py-3 text-center">
                  {row.missingCost ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                      <AlertTriangle size={11} />
                      Sin costo
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
