"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AdSafeBudgetCard } from "@/components/dashboard/AdSafeBudgetCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { TopSKUsTable } from "@/components/dashboard/TopSKUsTable";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { WhatIfModal } from "@/components/dashboard/WhatIfModal";
import { TrendingUp, Package, Wallet, Zap } from "lucide-react";

const MOCK_SKUS = [
  { sku: "REMERA-BAS-001", unitsSold: 124, netMargin: 38200, netMarginPct: 32, stock: 89, missingCost: false },
  { sku: "JEAN-SLM-042", unitsSold: 87, netMargin: 52100, netMarginPct: 28, stock: 34, missingCost: false },
  { sku: "CAMP-OVR-015", unitsSold: 63, netMargin: 29800, netMarginPct: 18, stock: 122, missingCost: true },
  { sku: "BUZO-HVY-008", unitsSold: 45, netMargin: 41500, netMarginPct: 35, stock: 15, missingCost: false },
  { sku: "PANT-CRG-023", unitsSold: 38, netMargin: 12400, netMarginPct: 11, stock: 67, missingCost: true },
  { sku: "SHORT-DEP-009", unitsSold: 72, netMargin: 18900, netMarginPct: 22, stock: 45, missingCost: false },
];

export default function DashboardPage() {
  const [whatIfOpen, setWhatIfOpen] = useState(false);

  const missingCount = MOCK_SKUS.filter((s) => s.missingCost).length;

  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-5">
        {/* Alert banner */}
        {missingCount > 0 && (
          <AlertBanner
            message={`Faltan costos para ${missingCount} SKUs. La recomendacion se degrada.`}
          />
        )}

        {/* Hero card + What-if */}
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="flex-1">
            <AdSafeBudgetCard
              budget={185000}
              risk="green"
              bullets={[
                "Margen neto semanal positivo y estable.",
                "Capital inmovilizado dentro del rango saludable.",
                "Caja disponible cubre 3 semanas de operacion.",
              ]}
            />
          </div>
          <div className="flex items-stretch lg:w-48">
            <button
              onClick={() => setWhatIfOpen(true)}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/50 p-5 text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <Zap size={20} />
              <span className="text-xs font-medium">Simular +20% Ads</span>
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KPICard
            title="Margen neto"
            value="$192.900"
            subtitle="semanal"
            icon={TrendingUp}
            trend={{ value: "+4.2%", positive: true }}
          />
          <KPICard
            title="Capital inmovilizado"
            value="$1.240.000"
            subtitle="costo de inventario"
            icon={Package}
            trend={{ value: "-2.1%", positive: true }}
          />
          <KPICard
            title="Caja disponible"
            value="$890.000"
            subtitle="buffer: 3.2 semanas"
            icon={Wallet}
          />
        </div>

        {/* Top SKUs table */}
        <TopSKUsTable rows={MOCK_SKUS} />

        {/* What-if modal */}
        <WhatIfModal
          open={whatIfOpen}
          onClose={() => setWhatIfOpen(false)}
        />
      </div>
    </AppShell>
  );
}
