import { AppShell } from "@/components/layout/AppShell";

export default function OnboardingPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-8 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración inicial</h1>
          <p className="text-sm text-gray-500 mt-1">
            Conectá tu plataforma e-commerce y cargá los datos base para empezar.
          </p>
        </div>

        {/* Paso 1 — Conectar plataforma */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">1. Conectar plataforma</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="border-2 border-finexa-500 rounded-lg p-4 text-sm font-medium text-finexa-700 hover:bg-finexa-50 transition-colors">
              Tiendanube
            </button>
            <button className="border-2 border-gray-200 rounded-lg p-4 text-sm text-gray-400 cursor-not-allowed" disabled>
              Shopify (próximamente)
            </button>
          </div>
        </section>

        {/* Paso 2 — Cargar costos */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">2. Cargar costos por SKU</h2>
          <p className="text-sm text-gray-500">
            CSV con columnas: <code className="bg-gray-100 px-1 rounded">sku, product_cost, logistics_cost, other_cost</code>
          </p>
          <input
            type="file"
            accept=".csv"
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-finexa-50 file:text-finexa-700 hover:file:bg-finexa-100"
          />
        </section>

        {/* Paso 3 — Primera sincronización */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">3. Primera ingesta</h2>
          <p className="text-sm text-gray-500">
            Sincronizá órdenes e inventario desde tu plataforma conectada.
          </p>
          <button className="px-4 py-2 bg-finexa-600 text-white text-sm font-medium rounded-md hover:bg-finexa-700 transition-colors">
            Iniciar ingesta
          </button>
        </section>
      </div>
    </AppShell>
  );
}
