"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Play, Calendar } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/EmptyState";
import { accountsApi, categoriesApi, recurringApi, expensesApi } from "@/lib/api";
import type { Account, Category, RecurringInstance, RecurringRule } from "@/types/finance";
import { useT } from "@/contexts/LocaleContext";

// ─── Rule Form ────────────────────────────────────────────────────────────────

function RuleForm({
  accounts, categories, initial, onSave, onCancel,
}: {
  accounts: Account[];
  categories: Category[];
  initial?: Partial<RecurringRule>;
  onSave: (data: unknown) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useT();
  const [name, setName]               = useState(initial?.name ?? "");
  const [amount, setAmount]           = useState(String(initial?.amount_value ?? ""));
  const [currency, setCurrency]       = useState(initial?.amount_currency ?? "ARS");
  const [categoryId, setCategoryId]   = useState(initial?.category_id ?? "");
  const [frequency, setFrequency]     = useState(initial?.cadence?.frequency ?? "monthly");
  const [dayOfMonth, setDayOfMonth]   = useState(String(initial?.cadence?.day_of_month ?? "1"));
  const [dayOfWeek, setDayOfWeek]     = useState(String(initial?.cadence?.day_of_week ?? "0"));
  const [accountId, setAccountId]     = useState(initial?.default_account_id ?? "");
  const [autoConfirm, setAutoConfirm] = useState(initial?.auto_confirm ?? false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    setSaving(true);
    setError(null);
    try {
      const cadence: RecurringRule["cadence"] = { frequency: frequency as RecurringRule["cadence"]["frequency"] };
      if (frequency === "monthly") cadence.day_of_month = Number(dayOfMonth);
      if (frequency === "weekly") cadence.day_of_week = Number(dayOfWeek);

      await onSave({
        name,
        amount_value: Number(amount),
        amount_currency: currency,
        category_id: categoryId || null,
        cadence,
        default_account_id: accountId || null,
        auto_confirm: autoConfirm,
        status: "active",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <ErrorState message={error} />}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("recurring.name")} *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("expenses.amount")} *</label>
          <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("expenses.currency")}</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
            <option>ARS</option><option>USD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("recurring.cadence")} *</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as "daily" | "weekly" | "monthly" | "yearly")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
            <option value="monthly">{t("recurring.cadenceMonthly")}</option>
            <option value="weekly">{t("recurring.cadenceWeekly")}</option>
            <option value="daily">{t("recurring.cadenceDaily")}</option>
            <option value="yearly">{t("recurring.cadenceYearly")}</option>
          </select>
        </div>
        {frequency === "monthly" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("recurring.dayOfMonth")}</label>
            <input type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
        )}
        {frequency === "weekly" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("recurring.dayOfWeek")}</label>
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
              <option value="0">Lunes</option><option value="1">Martes</option>
              <option value="2">Miércoles</option><option value="3">Jueves</option>
              <option value="4">Viernes</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("expenses.category")} ({t("common.optional")})</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="">—</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("recurring.defaultAccount")} ({t("common.optional")})</label>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="">—</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input type="checkbox" checked={autoConfirm} onChange={(e) => setAutoConfirm(e.target.checked)}
          className="accent-accent" />
        {t("recurring.autoConfirm")}
        <span className="text-xs text-muted-foreground">(requiere cuenta por defecto)</span>
      </label>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t("common.cancel")}
        </button>
        <button type="submit" disabled={saving}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
          {saving ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </form>
  );
}

// ─── Generate Modal ───────────────────────────────────────────────────────────

function GenerateModal({ rule, onClose, onDone }: { rule: RecurringRule; onClose: () => void; onDone: () => void }) {
  const t = useT();
  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const [from, setFrom] = useState(today);
  const [to, setTo]   = useState(nextMonth);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ count: number } | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const instances = await recurringApi.generate(rule.id, from, to);
      setResult({ count: instances.length });
      setTimeout(() => { onDone(); onClose(); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{rule.name} — {rule.amount_value} {rule.amount_currency}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
      </div>
      {error && <ErrorState message={error} />}
      {result && <div className="rounded-md bg-emerald-400/10 px-3 py-2 text-xs text-emerald-400">{result.count} ocurrencias generadas</div>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">{t("common.cancel")}</button>
        <button onClick={handleGenerate} disabled={loading}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
          {loading ? t("common.loading") : t("recurring.generate")}
        </button>
      </div>
    </div>
  );
}

// ─── Register Payment Modal ───────────────────────────────────────────────────

function RegisterPaymentModal({ instance, rules, accounts, categories, onClose, onDone }: {
  instance: RecurringInstance;
  rules: RecurringRule[];
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useT();
  const rule = rules.find((r) => r.id === instance.rule_id);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const [accountId, setAccountId]   = useState(rule?.default_account_id ?? "");
  const [amount, setAmount]         = useState(String(rule?.amount_value ?? ""));
  const [currency, setCurrency]     = useState(rule?.amount_currency ?? "ARS");
  const [categoryId, setCategoryId] = useState(rule?.category_id ?? "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await expensesApi.create({
        account_id: accountId,
        amount: { value: Number(amount), currency },
        date: instance.due_date,
        category_id: categoryId || null,
      });
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      {error && <ErrorState message={error} />}
      <p className="text-xs text-muted-foreground">Vencimiento: <strong className="text-foreground">{instance.due_date}</strong></p>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("expenses.account")} *</label>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="">—</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("expenses.amount")} *</label>
          <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("expenses.currency")}</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
            <option>ARS</option><option>USD</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("expenses.category")}</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="">— Sin categoría</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">{t("common.cancel")}</button>
        <button type="submit" disabled={saving} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
          {saving ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "rules" | "instances";
const RULE_STATUS_VARIANT = { active: "green", paused: "yellow", archived: "gray" } as const;
const INSTANCE_STATUS_VARIANT = { pending: "yellow", confirmed: "green", skipped: "gray" } as const;

export default function RecurringPage() {
  const t = useT();
  const [tab, setTab]           = useState<Tab>("rules");
  const [rules, setRules]       = useState<RecurringRule[]>([]);
  const [instances, setInstances] = useState<RecurringInstance[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [ruleFormOpen, setRuleFormOpen]       = useState(false);
  const [editRule, setEditRule]               = useState<RecurringRule | null>(null);
  const [generateRule, setGenerateRule]       = useState<RecurringRule | null>(null);
  const [registerInstance, setRegisterInstance] = useState<RecurringInstance | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, inst, acc, cats] = await Promise.all([
        recurringApi.listRules(),
        recurringApi.listInstances(),
        accountsApi.list(),
        categoriesApi.list(),
      ]);
      setRules(r);
      setInstances(inst);
      setAccounts(acc);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleSaveRule = async (data: unknown) => {
    if (editRule) {
      await recurringApi.updateRule(editRule.id, data as Partial<RecurringRule>);
    } else {
      await recurringApi.createRule(data as Omit<RecurringRule, "id" | "owner_id" | "next_due_date">);
    }
    setRuleFormOpen(false);
    setEditRule(null);
    load();
  };

  return (
    <AppShell title={t("recurring.title")}>
      <div className="flex flex-col gap-5">
        {/* Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-md border border-border overflow-hidden text-xs font-medium">
            {(["rules", "instances"] as Tab[]).map((t_) => (
              <button key={t_} onClick={() => setTab(t_)}
                className={`px-4 py-2 transition-colors ${tab === t_ ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {t_ === "rules" ? t("recurring.rules") : t("recurring.instances")}
              </button>
            ))}
          </div>
          {tab === "rules" && (
            <button onClick={() => { setEditRule(null); setRuleFormOpen(true); }}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
              <Plus size={13} />
              {t("recurring.newRule")}
            </button>
          )}
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : tab === "rules" ? (
          rules.length === 0 ? (
            <EmptyState message={t("recurring.noRules")} />
          ) : (
            <div className="flex flex-col gap-3">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {rule.amount_value.toLocaleString("es-AR")} {rule.amount_currency}
                        {" · "}{rule.cadence.frequency}
                        {rule.next_due_date && ` · próximo: ${rule.next_due_date}`}
                      </p>
                    </div>
                    <Badge label={t(`recurring.status${rule.status.charAt(0).toUpperCase() + rule.status.slice(1)}` as never) || rule.status}
                      variant={RULE_STATUS_VARIANT[rule.status]} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setGenerateRule(rule)}
                      className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Play size={11} /> {t("recurring.generate")}
                    </button>
                    <button onClick={() => { setEditRule(rule); setRuleFormOpen(true); }}
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {t("common.edit")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          instances.length === 0 ? (
            <EmptyState message={t("recurring.noInstances")} />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Vencimiento", "Regla", "Estado", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {instances.map((inst) => {
                    const rule = rules.find((r) => r.id === inst.rule_id);
                    return (
                      <tr key={inst.id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-4 py-3 text-xs text-foreground">{inst.due_date}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{rule?.name ?? inst.rule_id.slice(0, 8)}</td>
                        <td className="px-4 py-3">
                          <Badge label={t(`recurring.instance${inst.status.charAt(0).toUpperCase() + inst.status.slice(1)}` as never) || inst.status}
                            variant={INSTANCE_STATUS_VARIANT[inst.status]} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {inst.status === "pending" && (
                            <button onClick={() => setRegisterInstance(inst)}
                              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                              <Calendar size={11} /> {t("recurring.registerPayment")}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <Modal open={ruleFormOpen} onClose={() => { setRuleFormOpen(false); setEditRule(null); }}
        title={editRule ? t("recurring.editRule") : t("recurring.newRule")} size="md">
        <RuleForm accounts={accounts} categories={categories} initial={editRule ?? undefined}
          onSave={handleSaveRule} onCancel={() => { setRuleFormOpen(false); setEditRule(null); }} />
      </Modal>

      {generateRule && (
        <Modal open onClose={() => setGenerateRule(null)} title={t("recurring.generateRange")} size="sm">
          <GenerateModal rule={generateRule} onClose={() => setGenerateRule(null)} onDone={load} />
        </Modal>
      )}

      {registerInstance && (
        <Modal open onClose={() => setRegisterInstance(null)} title={t("recurring.registerPayment")} size="md">
          <RegisterPaymentModal instance={registerInstance} rules={rules} accounts={accounts}
            categories={categories} onClose={() => setRegisterInstance(null)} onDone={load} />
        </Modal>
      )}
    </AppShell>
  );
}
