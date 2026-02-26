"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Plus, Megaphone } from "lucide-react";

const MOCK_HISTORY = [
  { week: "2026-02-17", spend: 185000, platform: "Meta Ads" },
  { week: "2026-02-10", spend: 172000, platform: "Meta Ads" },
  { week: "2026-02-03", spend: 195000, platform: "Meta Ads" },
  { week: "2026-01-27", spend: 160000, platform: "Meta Ads" },
  { week: "2026-01-20", spend: 148000, platform: "Google Ads" },
  { week: "2026-01-13", spend: 155000, platform: "Meta Ads" },
];

export default function AdsSpendPage() {
  const [weekStart, setWeekStart] = useState("");
  const [spend, setSpend] = useState("");

  return (
    <AppShell title="Ads Spend">
      <div className="flex flex-col gap-6">
        {/* Entry form */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
            <Megaphone size={14} className="text-accent" />
            Registrar gasto semanal
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">
                Inicio de semana
              </label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent [color-scheme:dark]"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">
                Gasto total ($)
              </label>
              <input
                type="number"
                value={spend}
                onChange={(e) => setSpend(e.target.value)}
                placeholder="185000"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors shrink-0">
              <Plus size={14} />
              Agregar
            </button>
          </div>
        </div>

        {/* History */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">
              Historial de gasto en ads
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Semana
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Plataforma
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Gasto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_HISTORY.map((row) => (
                  <tr
                    key={row.week}
                    className="transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-foreground">
                      {row.week}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {row.platform}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-foreground">
                      ${row.spend.toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
