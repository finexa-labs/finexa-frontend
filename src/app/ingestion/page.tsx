"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import {
  Plug,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";

const CONNECTORS = [
  {
    name: "Tiendanube",
    description: "Sincroniza ordenes, productos e inventario.",
    status: "connected" as const,
    disabled: false,
  },
  {
    name: "Mock Mode",
    description: "Genera datos de prueba para testear el sistema.",
    status: "disconnected" as const,
    disabled: false,
    toggle: true,
  },
  {
    name: "Shopify",
    description: "Integracion con Shopify Storefront.",
    status: "coming_soon" as const,
    disabled: true,
  },
];

const MOCK_RUNS = [
  { id: "run-0042", entity: "Ordenes", status: "success", started: "2026-02-25 10:00", finished: "2026-02-25 10:02" },
  { id: "run-0041", entity: "Inventario", status: "success", started: "2026-02-25 09:58", finished: "2026-02-25 09:59" },
  { id: "run-0040", entity: "Ordenes", status: "failed", started: "2026-02-24 10:00", finished: "2026-02-24 10:01" },
  { id: "run-0039", entity: "Inventario", status: "success", started: "2026-02-24 09:58", finished: "2026-02-24 09:59" },
  { id: "run-0038", entity: "Ordenes", status: "success", started: "2026-02-23 10:00", finished: "2026-02-23 10:03" },
];

const STATUS_CONFIG = {
  connected: { label: "Conectado", color: "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" },
  disconnected: { label: "Desconectado", color: "bg-muted border-border text-muted-foreground" },
  coming_soon: { label: "Proximamente", color: "bg-muted border-border text-muted-foreground" },
};

const RUN_STATUS_CONFIG = {
  success: { label: "OK", icon: CheckCircle2, color: "text-emerald-400" },
  failed: { label: "Error", icon: XCircle, color: "text-red-400" },
  running: { label: "Ejecutando", icon: Loader2, color: "text-accent" },
};

export default function IngestionPage() {
  const [mockEnabled, setMockEnabled] = useState(false);

  return (
    <AppShell title="Ingestion">
      <div className="flex flex-col gap-6">
        {/* Connectors */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Conectores
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CONNECTORS.map((c) => {
              const statusCfg = STATUS_CONFIG[c.status];
              return (
                <div
                  key={c.name}
                  className={cn(
                    "rounded-lg border border-border bg-card p-5 flex flex-col gap-4",
                    c.disabled && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Plug size={16} className="text-accent" />
                      <h3 className="text-sm font-medium text-foreground">
                        {c.name}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-medium",
                        c.name === "Mock Mode" && mockEnabled
                          ? STATUS_CONFIG.connected.color
                          : statusCfg.color
                      )}
                    >
                      {c.name === "Mock Mode" && mockEnabled
                        ? "Activo"
                        : statusCfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.description}
                  </p>
                  {c.toggle ? (
                    <button
                      onClick={() => setMockEnabled((v) => !v)}
                      className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {mockEnabled ? (
                        <ToggleRight size={22} className="text-accent" />
                      ) : (
                        <ToggleLeft size={22} />
                      )}
                      {mockEnabled ? "Desactivar" : "Activar"}
                    </button>
                  ) : c.disabled ? (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock size={12} />
                      Proximamente
                    </span>
                  ) : (
                    <button className="self-start rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
                      Conectar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sync actions */}
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
            <RefreshCw size={14} />
            Sincronizar ordenes
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <RefreshCw size={14} />
            Sincronizar inventario
          </button>
        </div>

        {/* Runs history */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">
              Historial de ingesta
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Run ID
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Entidad
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Inicio
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Fin
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_RUNS.map((run) => {
                  const cfg =
                    RUN_STATUS_CONFIG[
                      run.status as keyof typeof RUN_STATUS_CONFIG
                    ];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr
                      key={run.id}
                      className="transition-colors hover:bg-secondary/30"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-foreground">
                        {run.id}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {run.entity}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("flex items-center gap-1.5", cfg.color)}>
                          <StatusIcon size={14} />
                          <span className="text-xs font-medium">
                            {cfg.label}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {run.started}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {run.finished}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
