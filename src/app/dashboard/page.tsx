"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AdSafeBudgetCard } from "@/components/dashboard/AdSafeBudgetCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { TopSKUsTable } from "@/components/dashboard/TopSKUsTable";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { WhatIfModal } from "@/components/dashboard/WhatIfModal";
import { TrendingUp, Package, Wallet, Zap } from "lucide-react";
import { useT } from "@/contexts/LocaleContext";
import { costsApi } from "@/lib/api";
import type { CostStats } from "@/types/finance";

const MOCK_SKUS = [
  { sku: "REMERA-BAS-001", unitsSold: 124, netMargin: 38200, netMarginPct: 32, stock: 89,  missingCost: false },
  { sku: "JEAN-SLM-042",   unitsSold: 87,  netMargin: 52100, netMarginPct: 28, stock: 34,  missingCost: false },
  { sku: "CAMP-OVR-015",   unitsSold: 63,  netMargin: 29800, netMarginPct: 18, stock: 122, missingCost: true  },
  { sku: "BUZO-HVY-008",   unitsSold: 45,  netMargin: 41500, netMarginPct: 35, stock: 15,  missingCost: false },
  { sku: "PANT-CRG-023",   unitsSold: 38,  netMargin: 12400, netMarginPct: 11, stock: 67,  missingCost: true  },
  { sku: "SHORT-DEP-009",  unitsSold: 72,  netMargin: 18900, netMarginPct: 22, stock: 45,  missingCost: false },
];

export default function DashboardPage() {
  const t = useT();
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [costStats, setCostStats] = useState<CostStats | null>(null);

  // Fetch real cost stats; fall back gracefully if backend not available
  useEffect(() => {
    costsApi.stats().then(setCostStats).catch(() => {});
  }, []);

  // Use real missing count when available, otherwise fall back to mock
  const missingCount =
    costStats !== null
      ? costStats.missing_count
      : MOCK_SKUS.filter((s) => s.missingCost).length;

  return (
    <AppShell title={t("dashboard.title")}>
      <div className="flex flex-col gap-5">
        {missingCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <AlertBanner message={t("dashboard.missingCosts", { count: missingCount })} />
            </div>
            <Link
              href="/costs?missing_only=true"
              className="shrink-0 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-400/20 transition-colors"
            >
              Resolver →
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="flex-1">
            <AdSafeBudgetCard
              budget={185000}
              risk="green"
              bullets={[
                t("dashboard.netMargin") + " semanal positivo y estable.",
                "Capital inmovilizado dentro del rango saludable.",
                "Caja disponible cubre 3 semanas de operación.",
              ]}
            />
          </div>
          <div className="flex items-stretch lg:w-48">
            <button
              onClick={() => setWhatIfOpen(true)}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/50 p-5 text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <Zap size={20} />
              <span className="text-xs font-medium">{t("dashboard.simulateAds")}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KPICard
            title={t("dashboard.netMargin")}
            value="$192.900"
            subtitle={t("dashboard.weekly")}
            icon={TrendingUp}
            trend={{ value: "+4.2%", positive: true }}
          />
          <KPICard
            title={t("dashboard.tiedUpCapital")}
            value="$1.240.000"
            subtitle={t("dashboard.inventoryCost")}
            icon={Package}
            trend={{ value: "-2.1%", positive: true }}
          />
          <KPICard
            title={t("dashboard.availableCash")}
            value="$890.000"
            subtitle={t("dashboard.buffer", { weeks: "3.2" })}
            icon={Wallet}
          />
        </div>

        <TopSKUsTable rows={MOCK_SKUS} />

        <WhatIfModal open={whatIfOpen} onClose={() => setWhatIfOpen(false)} />
      </div>
    </AppShell>
  );
}
