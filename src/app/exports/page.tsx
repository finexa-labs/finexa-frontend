import { AppShell } from "@/components/layout/AppShell";

const EXPORTS = [
  {
    title: "Margen por SKU",
    description: "Ingresos netos, costos y margen neto para cada producto.",
    endpoint: "/metrics/margin",
  },
  {
    title: "Capital inmovilizado",
    description: "Stock valorizado por SKU con días estimados hasta caja.",
    endpoint: "/metrics/capital",
  },
  {
    title: "Recomendaciones",
    description: "Historial de recomendaciones de presupuesto con explicación.",
    endpoint: "/recommendations/history",
  },
  {
    title: "Runs de ingesta",
    description: "Log completo de sincronizaciones para auditoría.",
    endpoint: "/commerce/ingest/runs",
  },
];

export default function ExportsPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Descargá cualquier cálculo en CSV para auditoría o análisis externo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPORTS.map((exp) => (
            <div
              key={exp.endpoint}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-4"
            >
              <div>
                <h3 className="font-medium text-gray-900">{exp.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{exp.description}</p>
              </div>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}${exp.endpoint}?format=csv`}
                className="shrink-0 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                CSV
              </a>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
