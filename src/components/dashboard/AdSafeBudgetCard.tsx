"use client";

import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

type RiskLevel = "green" | "yellow" | "red";

interface AdSafeBudgetCardProps {
  budget: number;
  risk: RiskLevel;
  bullets: string[];
}

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; color: string; bg: string; icon: typeof ShieldCheck }
> = {
  green: {
    label: "Seguro",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
    icon: ShieldCheck,
  },
  yellow: {
    label: "Precaucion",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    icon: ShieldAlert,
  },
  red: {
    label: "Riesgo alto",
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
    icon: ShieldX,
  },
};

export function AdSafeBudgetCard({ budget, risk, bullets }: AdSafeBudgetCardProps) {
  const config = RISK_CONFIG[risk];
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Ad Safe Budget
          </p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            ${budget.toLocaleString("es-AR")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Presupuesto semanal recomendado
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1",
            config.bg
          )}
        >
          <Icon size={14} className={config.color} />
          <span className={cn("text-xs font-medium", config.color)}>
            {config.label}
          </span>
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <ul className="flex flex-col gap-2">
          {bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", config.color.replace("text-", "bg-"))} />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
