import { AppShell } from "@/components/layout/AppShell";
import { FileDown, FileSpreadsheet, ShieldCheck, ClipboardList } from "lucide-react";

const EXPORTS = [
  {
    title: "Reporte de margen",
    description: "Margen neto por SKU con detalle de costos, ingresos y comisiones.",
    icon: FileSpreadsheet,
    endpoint: "/metrics/margin",
  },
  {
    title: "Snapshot de inventario",
    description: "Stock valorizado por SKU con dias estimados a caja.",
    icon: ClipboardList,
    endpoint: "/metrics/capital",
  },
  {
    title: "Recomendaciones",
    description: "Historial completo de Ad Safe Budgets con calculo y riesgo.",
    icon: ShieldCheck,
    endpoint: "/recommendations/history",
  },
  {
    title: "Log de ingesta",
    description: "Registro de sincronizaciones para auditoria y trazabilidad.",
    icon: FileDown,
    endpoint: "/commerce/ingest/runs",
  },
];

export default function ExportsPage() {
  return (
    <AppShell title="Exports / Audit">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Auditable y reproducible. Descarga cualquier calculo en CSV.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EXPORTS.map((exp) => {
            const Icon = exp.icon;
            return (
              <div
                key={exp.endpoint}
                className="flex items-start gap-4 rounded-lg border border-border bg-card p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10">
                  <Icon size={18} className="text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-foreground">
                    {exp.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {exp.description}
                  </p>
                  <button className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors">
                    <FileDown size={13} />
                    Exportar CSV
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
