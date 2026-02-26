"use client";

import { useState } from "react";
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WhatIfModalProps {
  open: boolean;
  onClose: () => void;
}

export function WhatIfModal({ open, onClose }: WhatIfModalProps) {
  const [increase, setIncrease] = useState(20);

  if (!open) return null;

  // Mock impact calculations
  const currentBudget = 185000;
  const newBudget = currentBudget * (1 + increase / 100);
  const marginImpact = increase > 30 ? -2.1 : increase > 15 ? -0.5 : 0.3;
  const cashImpact = increase > 30 ? "Tension alta" : increase > 15 ? "Moderado" : "Sin impacto";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">
            Simular cambio en Ads
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Incremento de gasto en ads
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={-50}
                max={100}
                value={increase}
                onChange={(e) => setIncrease(Number(e.target.value))}
                className="flex-1 accent-accent"
              />
              <span className="w-14 text-right text-sm font-semibold text-foreground">
                {increase > 0 ? "+" : ""}
                {increase}%
              </span>
            </div>
          </div>

          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Impacto estimado
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Nuevo presupuesto
                </span>
                <span className="text-sm font-semibold text-foreground">
                  ${Math.round(newBudget).toLocaleString("es-AR")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Impacto en margen
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  {marginImpact > 0 ? (
                    <TrendingUp size={14} className="text-emerald-400" />
                  ) : marginImpact < 0 ? (
                    <TrendingDown size={14} className="text-red-400" />
                  ) : (
                    <Minus size={14} className="text-muted-foreground" />
                  )}
                  <span
                    className={
                      marginImpact > 0
                        ? "text-emerald-400"
                        : marginImpact < 0
                          ? "text-red-400"
                          : "text-muted-foreground"
                    }
                  >
                    {marginImpact > 0 ? "+" : ""}
                    {marginImpact}%
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Tension de caja
                </span>
                <span className="text-sm font-medium text-foreground">
                  {cashImpact}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Este presupuesto esta calculado para no tensionar caja.
          </p>
        </div>
      </div>
    </div>
  );
}
