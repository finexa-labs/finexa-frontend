"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp } from "lucide-react";

type RiskLevel = "green" | "yellow" | "red";

interface Recommendation {
  week: string;
  budget: number;
  risk: RiskLevel;
  bullets: string[];
  calculation: string;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; icon: typeof ShieldCheck }> = {
  green: { label: "Seguro", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: ShieldCheck },
  yellow: { label: "Precaucion", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", icon: ShieldAlert },
  red: { label: "Riesgo alto", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", icon: ShieldX },
};

const MOCK_RECS: Recommendation[] = [
  {
    week: "2026-02-17",
    budget: 185000,
    risk: "green",
    bullets: [
      "Margen neto semanal positivo y estable.",
      "Capital inmovilizado dentro del rango saludable.",
      "Caja disponible cubre 3 semanas de operacion.",
    ],
    calculation:
      "Budget = min(margen_neto_semanal * 0.4, caja_disponible / semanas_buffer) = min(192900 * 0.4, 890000 / 3.2) = min(77160, 278125) = $185.000 (ajustado por riesgo bajo).",
  },
  {
    week: "2026-02-10",
    budget: 172000,
    risk: "yellow",
    bullets: [
      "Margen neto semanal descendio 3.1% vs semana anterior.",
      "Inventario alto en 2 SKUs de baja rotacion.",
      "Caja disponible cubre 2.5 semanas.",
    ],
    calculation:
      "Budget = min(margen_neto_semanal * 0.35, caja_disponible / semanas_buffer) = min(186000 * 0.35, 820000 / 2.5) = min(65100, 328000) = $172.000 (ajustado por riesgo medio).",
  },
  {
    week: "2026-02-03",
    budget: 145000,
    risk: "red",
    bullets: [
      "Margen neto cayo 8% en 2 semanas consecutivas.",
      "Capital inmovilizado excede el 60% de caja.",
      "Se recomienda reducir inversion publicitaria.",
    ],
    calculation:
      "Budget = min(margen_neto_semanal * 0.25, caja_disponible * 0.15) = min(175000 * 0.25, 740000 * 0.15) = min(43750, 111000) = $145.000 (ajustado por riesgo alto).",
  },
];

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [expanded, setExpanded] = useState(false);
  const config = RISK_CONFIG[rec.risk];
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-xs text-muted-foreground">
              Semana {rec.week}
            </span>
            <span
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                config.bg,
                config.color
              )}
            >
              <Icon size={12} />
              {config.label}
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            ${rec.budget.toLocaleString("es-AR")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ad Safe Budget recomendado
          </p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-1.5">
        {rec.bullets.map((b, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <span
              className={cn(
                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                config.color.replace("text-", "bg-")
              )}
            />
            {b}
          </li>
        ))}
      </ul>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? "Ocultar calculo" : "Ver calculo"}
      </button>

      {expanded && (
        <div className="mt-3 rounded-md border border-border bg-background p-4">
          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
            {rec.calculation}
          </p>
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <AppShell title="Recomendaciones">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-muted-foreground">
          Tu margen real no es el que crees. Estas recomendaciones integran
          margen, inventario y caja para darte un presupuesto seguro de ads.
        </p>
        {MOCK_RECS.map((rec) => (
          <RecommendationCard key={rec.week} rec={rec} />
        ))}
      </div>
    </AppShell>
  );
}
