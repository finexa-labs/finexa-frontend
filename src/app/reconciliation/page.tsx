"use client";

import { useCallback, useEffect, useState } from "react";
import { Info, CheckCircle, XCircle, Lock, ChevronRight, FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BankIcon } from "@/components/finance/BankIcon";
import { getBankConfig } from "@/lib/argentineBanks";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/EmptyState";
import { accountsApi, categoriesApi, expensesApi, reconciliationApi } from "@/lib/api";
import type {
  Account,
  Category,
  ReconciliationBalance,
  ReconciliationSession,
  ReconciliationSuggestion,
  SessionDetail,
} from "@/types/finance";
import { useT } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function weekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=dom
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

function fmt(n: number | null) {
  if (n == null) return "—";
  return `$${Math.abs(n).toLocaleString("es-AR")}`;
}

// ─── Step 1: Crear sesión ─────────────────────────────────────────────────────

function StepCreateSession({
  onCreated,
}: {
  onCreated: (s: ReconciliationSession) => void;
}) {
  const t = useT();
  const { start, end } = weekRange();
  const [from, setFrom]     = useState(start);
  const [to, setTo]         = useState(end);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await reconciliationApi.createSession(from, to);
      onCreated(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto">
      <div>
        <h2 className="text-sm font-medium text-foreground">{t("reconciliation.newSession")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Elegí el período de cierre. Por defecto, la semana actual.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("reconciliation.periodStart")}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("reconciliation.periodEnd")} (exclusivo)</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
      </div>

      {error && <ErrorState message={error} />}

      <button onClick={handleCreate} disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
        {loading ? t("common.loading") : t("reconciliation.newSession")}
        {!loading && <ChevronRight size={15} />}
      </button>
    </div>
  );
}

// ─── Step 2: Declarar saldos ──────────────────────────────────────────────────

function StepDeclareBalances({
  session,
  accounts,
  onDeclared,
}: {
  session: ReconciliationSession;
  accounts: Account[];
  onDeclared: (balances: ReconciliationBalance[]) => void;
}) {
  const t = useT();
  const [balances, setBalances] = useState<Record<string, string>>(() =>
    Object.fromEntries(accounts.filter((a) => a.status === "active").map((a) => [a.id, ""]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.status === "active");
  const allFilled = activeAccounts.every((a) => balances[a.id] !== "");

  const handleDeclare = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = activeAccounts.map((a) => ({
        account_id: a.id,
        declared_balance_value: Number(balances[a.id] || 0),
        currency: a.currency,
      }));
      const result = await reconciliationApi.declareBalances(session.id, payload);
      onDeclared(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-medium text-foreground">{t("reconciliation.declareBalances")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Ingresá el saldo real de cada cuenta al cierre del período ({session.period_start} → {session.period_end}).
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {activeAccounts.map((acc) => {
          const bankCfg = getBankConfig(acc.bank_type);
          return (
          <div key={acc.id} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
            <BankIcon bankType={acc.bank_type} color={acc.color} size="md" name={acc.name} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{acc.name}</p>
              <p className="text-xs text-muted-foreground">{bankCfg?.name ?? acc.type} · {acc.currency}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">$</span>
              <input
                type="number"
                step="0.01"
                value={balances[acc.id] ?? ""}
                onChange={(e) => setBalances((b) => ({ ...b, [acc.id]: e.target.value }))}
                placeholder="0.00"
                className="w-32 rounded-md border border-border bg-background px-3 py-1.5 text-right text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        );
        })}
      </div>

      {error && <ErrorState message={error} />}

      <button onClick={handleDeclare} disabled={loading || !allFilled}
        className="flex items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
        {loading ? t("common.loading") : t("reconciliation.compute")}
        {!loading && <ChevronRight size={15} />}
      </button>
    </div>
  );
}

// ─── Step 3: Resultados + sugerencias ────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number | null }) {
  const t = useT();
  if (delta == null) return <span className="text-xs text-muted-foreground">—</span>;
  if (Math.abs(delta) < 0.01) return <Badge label={t("reconciliation.deltaOk")} variant="green" />;
  return (
    <span className={cn("text-sm font-semibold", delta < 0 ? "text-red-400" : "text-amber-400")}>
      {delta > 0 ? "+" : ""}
      {delta.toLocaleString("es-AR")}
    </span>
  );
}

function SuggestionCard({
  suggestion,
  accounts,
  categories,
  onConfirm,
  onDiscard,
}: {
  suggestion: ReconciliationSuggestion;
  accounts: Account[];
  categories: Category[];
  onConfirm: (id: string) => Promise<void>;
  onDiscard: (id: string) => Promise<void>;
}) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const payload = suggestion.payload_json;

  if (suggestion.status !== "proposed") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 opacity-60">
        {suggestion.status === "confirmed"
          ? <CheckCircle size={14} className="text-emerald-400" />
          : <XCircle size={14} className="text-muted-foreground" />}
        <span className="text-xs text-muted-foreground">{payload.label}</span>
        <Badge label={t(`reconciliation.suggestion${suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}` as never) || suggestion.status}
          variant={suggestion.status === "confirmed" ? "green" : "gray"} className="ml-auto" />
      </div>
    );
  }

  const accountName = accounts.find((a) => a.id === payload.account_id)?.name ?? "Cuenta";
  const categoryName = categories.find((c) => c.id === payload.category_id)?.name ?? payload.category_slug;

  return (
    <>
      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">{payload.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {accountName} · ${Number(payload.amount_value).toLocaleString("es-AR")} {payload.amount_currency}
              {" · "}{categoryName}
            </p>
            {payload.note && (
              <p className="mt-1 text-xs text-muted-foreground/70 italic">{payload.note}</p>
            )}
          </div>
          <Badge
            label={payload.delta_direction === "negative" ? "Gasto faltante" : "Sobrante"}
            variant={payload.delta_direction === "negative" ? "red" : "yellow"}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
            disabled={confirming}
          >
            <CheckCircle size={12} />
            {t("reconciliation.confirmSuggestion")}
          </button>
          <button
            onClick={async () => {
              setDiscarding(true);
              try { await onDiscard(suggestion.id); } finally { setDiscarding(false); }
            }}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            disabled={discarding}
          >
            <XCircle size={12} />
            {t("reconciliation.discardSuggestion")}
          </button>
        </div>
      </div>

      {/* Confirm modal: preview del gasto a crear */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar — gasto a registrar" size="sm">
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-border bg-secondary/30 p-3 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Cuenta</span><span className="text-foreground">{accountName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Monto</span><span className="text-foreground">${Number(payload.amount_value).toLocaleString("es-AR")} {payload.amount_currency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span className="text-foreground">{payload.date}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Categoría</span><span className="text-foreground">{categoryName}</span></div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmOpen(false)} className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">{t("common.cancel")}</button>
            <button
              onClick={async () => {
                setConfirming(true);
                try { await onConfirm(suggestion.id); setConfirmOpen(false); } finally { setConfirming(false); }
              }}
              disabled={confirming}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {confirming ? t("common.loading") : t("reconciliation.confirmSuggestion")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function StepResults({
  detail,
  accounts,
  categories,
  onRefresh,
  onClose,
}: {
  detail: SessionDetail;
  accounts: Account[];
  categories: Category[];
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const pending = detail.suggestions.filter((s) => s.status === "proposed");
  const canClose = pending.length === 0;

  const handleConfirm = async (id: string) => {
    await reconciliationApi.confirmSuggestion(id);
    await onRefresh();
  };

  const handleDiscard = async (id: string) => {
    await reconciliationApi.discardSuggestion(id);
    await onRefresh();
  };

  const handleClose = async () => {
    setClosing(true);
    setError(null);
    try {
      await reconciliationApi.closeSession(detail.session.id);
      await onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* MVP hint */}
      <div className="flex items-start gap-2 rounded-md border border-blue-400/20 bg-blue-400/5 px-3 py-2 text-xs text-blue-400">
        <Info size={13} className="mt-0.5 shrink-0" />
        {t("reconciliation.mvpHint")}
      </div>

      {/* Tabla de balances */}
      <div>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Balances por cuenta</h3>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Cuenta</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("reconciliation.declared")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("reconciliation.expected")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("reconciliation.delta")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {detail.balances.map((b) => {
                const acc = accounts.find((a) => a.id === b.account_id);
                const bankCfg = getBankConfig(acc?.bank_type);
                const hasDiscrepancy = b.delta_value != null && Math.abs(b.delta_value) > 0.01;
                return (
                  <tr key={b.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {acc && <BankIcon bankType={acc.bank_type} color={acc.color} size="sm" name={acc.name} />}
                        <div>
                          <p className="text-sm font-medium text-foreground">{acc?.name ?? b.account_id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{bankCfg?.name ?? acc?.type} · {b.currency}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm text-foreground">{fmt(b.declared_balance_value)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm text-muted-foreground">{fmt(b.expected_balance_value)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DeltaBadge delta={b.delta_value} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasDiscrepancy && (
                        <button
                          onClick={() => router.push(`/ingestion?account=${b.account_id}&kind=account_statement`)}
                          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors"
                        >
                          <FileUp size={11} />
                          Subir extracto
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sugerencias */}
      {detail.suggestions.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("reconciliation.suggestions")}
          </h3>
          <div className="flex flex-col gap-2">
            {detail.suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                accounts={accounts}
                categories={categories}
                onConfirm={handleConfirm}
                onDiscard={handleDiscard}
              />
            ))}
          </div>
        </div>
      )}

      {/* Close */}
      <div className="border-t border-border pt-4">
        {error && <ErrorState message={error} />}
        {canClose ? (
          <div className="flex flex-col gap-3">
            <div className="text-xs text-emerald-400">{t("reconciliation.allHandled")}</div>
            <button onClick={handleClose} disabled={closing}
              className="flex items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
              <Lock size={14} />
              {closing ? t("common.loading") : t("reconciliation.closeSession")}
            </button>
          </div>
        ) : (
          <p className="text-xs text-amber-400">
            {t("reconciliation.pendingSuggestions", { count: pending.length })}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FlowStep = "create" | "declare" | "results";

export default function ReconciliationPage() {
  const t = useT();

  const [accounts, setAccounts]       = useState<Account[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const [step, setStep]               = useState<FlowStep>("create");
  const [session, setSession]         = useState<ReconciliationSession | null>(null);
  const [detail, setDetail]           = useState<SessionDetail | null>(null);

  useEffect(() => {
    Promise.all([accountsApi.list(), categoriesApi.list()])
      .then(([acc, cats]) => { setAccounts(acc); setCategories(cats); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadDetail = useCallback(async (sessionId: string) => {
    const d = await reconciliationApi.getSession(sessionId);
    setDetail(d);
  }, []);

  const handleSessionCreated = (s: ReconciliationSession) => {
    setSession(s);
    setStep("declare");
  };

  const handleBalancesDeclared = async () => {
    if (!session) return;
    const computed = await reconciliationApi.compute(session.id);
    setDetail(computed);
    setStep("results");
  };

  const handleRefresh = async () => {
    if (!session) return;
    await loadDetail(session.id);
  };

  const STEPS = [
    { key: "create",  label: "1. Período" },
    { key: "declare", label: "2. Saldos" },
    { key: "results", label: "3. Desvíos" },
  ] as const;

  if (loading) return <AppShell title={t("reconciliation.title")}><LoadingState /></AppShell>;

  return (
    <AppShell title={t("reconciliation.title")}>
      <div className="flex flex-col gap-6 max-w-2xl">
        {/* Stepper */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                step === s.key ? "bg-accent text-accent-foreground"
                  : STEPS.indexOf(STEPS.find((x) => x.key === step)!) > i
                    ? "bg-emerald-400/20 text-emerald-400"
                    : "bg-secondary text-muted-foreground"
              )}>
                {i + 1}
              </div>
              <span className={cn("text-xs", step === s.key ? "text-foreground font-medium" : "text-muted-foreground")}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-muted-foreground/40" />}
            </div>
          ))}
        </div>

        {error && <ErrorState message={error} />}

        {step === "create" && (
          <StepCreateSession onCreated={handleSessionCreated} />
        )}

        {step === "declare" && session && (
          <StepDeclareBalances
            session={session}
            accounts={accounts}
            onDeclared={handleBalancesDeclared}
          />
        )}

        {step === "results" && detail && (
          <StepResults
            detail={detail}
            accounts={accounts}
            categories={categories}
            onRefresh={handleRefresh}
            onClose={() => setStep("create")}
          />
        )}
      </div>
    </AppShell>
  );
}
