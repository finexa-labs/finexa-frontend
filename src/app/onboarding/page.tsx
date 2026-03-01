"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ingestOrders, ingestInventory } from "@/lib/api";
import type { CommercePlatform, CommerceIngestRequest } from "@/types/financial";

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORMS: { id: CommercePlatform; label: string }[] = [
  { id: "tiendanube", label: "Tiendanube" },
  { id: "shopify",    label: "Shopify" },
  { id: "woocommerce", label: "WooCommerce" },
];

const CREDENTIAL_FIELDS: Record<
  CommercePlatform,
  { key: string; label: string; placeholder: string; sensitive?: boolean }[]
> = {
  tiendanube: [
    { key: "store_id",     label: "ID de tienda",    placeholder: "123456" },
    { key: "access_token", label: "Access token",    placeholder: "tu-token-de-acceso",    sensitive: true },
  ],
  shopify: [
    { key: "shop_domain",  label: "Dominio de tienda", placeholder: "mi-tienda.myshopify.com" },
    { key: "access_token", label: "Access token",       placeholder: "shpat_xxxxxxxxxxxx",   sensitive: true },
  ],
  woocommerce: [
    { key: "site_url",        label: "URL del sitio",  placeholder: "https://mi-tienda.com" },
    { key: "consumer_key",    label: "Consumer key",   placeholder: "ck_xxxxxxxxxxxx",  sensitive: true },
    { key: "consumer_secret", label: "Consumer secret", placeholder: "cs_xxxxxxxxxxxx", sensitive: true },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<CommercePlatform | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [ingestStatus, setIngestStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  function handlePlatformSelect(platform: CommercePlatform) {
    setSelectedPlatform(platform);
    setCredentials({});
    setIngestStatus("idle");
  }

  function handleCredentialChange(key: string, value: string) {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  }

  async function handleIngest() {
    if (!selectedPlatform) return;

    const req: CommerceIngestRequest = {
      platform: selectedPlatform,
      credentials: credentials as never,
    };

    setIngestStatus("loading");
    try {
      await Promise.all([ingestOrders(req), ingestInventory(req)]);
      setIngestStatus("ok");
    } catch {
      setIngestStatus("error");
    }
  }

  const fields = selectedPlatform ? CREDENTIAL_FIELDS[selectedPlatform] : [];
  const allFilled = fields.length > 0 && fields.every((f) => credentials[f.key]?.trim());

  return (
    <AppShell>
      <div className="p-6 space-y-8 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración inicial</h1>
          <p className="text-sm text-gray-500 mt-1">
            Conectá tu plataforma e-commerce y cargá los datos base para empezar.
          </p>
        </div>

        {/* Paso 1 — Selector de plataforma */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">1. Conectar plataforma</h2>
          <div className="grid grid-cols-3 gap-3">
            {PLATFORMS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handlePlatformSelect(id)}
                className={`border-2 rounded-lg p-4 text-sm font-medium transition-colors ${
                  selectedPlatform === id
                    ? "border-finexa-500 bg-finexa-50 text-finexa-700"
                    : "border-gray-200 text-gray-600 hover:border-finexa-300 hover:text-finexa-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Formulario dinámico de credenciales */}
          {selectedPlatform && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                Credenciales de {PLATFORMS.find((p) => p.id === selectedPlatform)?.label}
              </p>
              {fields.map(({ key, label, placeholder, sensitive }) => {
                const inputId = `credential-${key}`;
                return (
                  <div key={key} className="space-y-1">
                    <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
                      {label}
                    </label>
                    <input
                      id={inputId}
                      type={sensitive ? "password" : "text"}
                      placeholder={placeholder}
                      value={credentials[key] ?? ""}
                      onChange={(e) => handleCredentialChange(key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-finexa-500 focus:border-transparent"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Paso 2 — Cargar costos */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">2. Cargar costos por SKU</h2>
          <p className="text-sm text-gray-500">
            CSV con columnas:{" "}
            <code className="bg-gray-100 px-1 rounded">sku, product_cost, logistics_cost, other_cost</code>
          </p>
          <input
            type="file"
            accept=".csv"
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-finexa-50 file:text-finexa-700 hover:file:bg-finexa-100"
          />
        </section>

        {/* Paso 3 — Primera ingesta */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">3. Primera ingesta</h2>
          <p className="text-sm text-gray-500">
            Sincronizá órdenes e inventario desde tu plataforma conectada.
          </p>

          <button
            onClick={handleIngest}
            disabled={!allFilled || ingestStatus === "loading"}
            className="px-4 py-2 bg-finexa-600 text-white text-sm font-medium rounded-md hover:bg-finexa-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ingestStatus === "loading" ? "Sincronizando…" : "Iniciar ingesta"}
          </button>

          {ingestStatus === "ok" && (
            <p className="text-sm text-green-600 font-medium">
              ✓ Ingesta iniciada correctamente.
            </p>
          )}
          {ingestStatus === "error" && (
            <p className="text-sm text-red-600 font-medium">
              Error al conectar con el backend. Revisá las credenciales e intentá de nuevo.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
