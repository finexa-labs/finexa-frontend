import { truncate } from "../utils";

interface PreviewTableProps {
  headers: string[];
  rows: string[][];
  maxRows?: number;
}

export function PreviewTable({ headers, rows, maxRows = 5 }: PreviewTableProps) {
  const displayRows = rows.slice(0, maxRows);

  if (headers.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-secondary/40">
            <th className="px-3 py-2 text-left text-muted-foreground font-medium w-8">#</th>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-muted-foreground font-medium whitespace-nowrap"
              >
                {h || `Col ${i + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {displayRows.map((row, ri) => (
            <tr key={ri} className="hover:bg-secondary/20 transition-colors">
              <td className="px-3 py-2 text-muted-foreground/60">{ri + 1}</td>
              {headers.map((_, ci) => (
                <td key={ci} className="px-3 py-2 text-foreground">
                  {truncate(row[ci], 30)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
          + {rows.length - maxRows} fila(s) más
        </div>
      )}
    </div>
  );
}
