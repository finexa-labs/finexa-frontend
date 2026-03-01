"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Upload, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Modal } from "@/components/ui/Modal";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/EmptyState";
import { CounterpartySelect } from "@/components/finance/CounterpartySelect";
import { BankIcon } from "@/components/finance/BankIcon";
import { accountsApi, categoriesApi, expensesApi } from "@/lib/api";
import type { Account, Category, Counterparty, Expense, ExpenseStatus } from "@/types/finance";
import { useT } from "@/contexts/LocaleContext";
import { useSmartEntry } from "@/modules/intelligence/hooks/useSmartEntry";
import { DraftCardExpense } from "@/modules/intelligence/components/DraftCardExpense";
import { LimitsBanner } from "@/modules/intelligence/components/LimitsBanner";

// ─── Expense Form ─────────────────────────────────────────────────────────────

interface ExpenseFormProps {
  accounts: Account[];
  categories: Category[];
  initial?: Partial<Expense>;
  onSave: (data: unknown) => Promise<void>;
  onCancel: () => void;
}

function ExpenseForm({ accounts, categories, initial, onSave, onCancel }: ExpenseFormProps) {
  const t = useT();
  const today = new Date().toISOString().split("T")[0];

  const [accountId, setAccountId]       = useState(initial?.account_id ?? "");
  const [amount, setAmount]             = useState(String(initial?.amount_value ?? ""));
  const [currency, setCurrency]         = useState(initial?.amount_currency ?? "ARS");
  const [date, setDate]                 = useState(initial?.date ?? today);
  const [categoryId, setCategoryId]     = useState(initial?.category_id ?? "");
  const [counterparty, setCounterparty] = useState<Counterparty | null>(null);
  const [note, setNote]                 = useState(initial?.note ?? "");
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const isValid = accountId && Number(amount) > 0 && date;
  const willNeedsReview = !categoryId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        account_id: accountId,
        amount: { value: Number(amount), currency },
        date,
        category_id: categoryId || null,
        counterparty_id: counterparty?.id ?? null,
        note: note || null,
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

      {willNeedsReview && (
        <div className="flex items-start gap-2 rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-400">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          {t("expenses.needsReviewHint")}
        </div>
      )}

      {/* Cuenta + Monto */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {t("expenses.account")} <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-2">
            {accountId && (() => {
              const acc = accounts.find((a) => a.id === accountId);
              return acc ? <BankIcon bankType={acc.bank_type} color={acc.color} size="sm" name={acc.name} /> : null;
            })()}
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">—</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {t("expenses.amount")} <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-20 rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option>ARS</option>
              <option>USD</option>
              <option>BRL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fecha */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {t("expenses.date")} <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Categoría */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {t("expenses.category")}{" "}
          <span className="text-muted-foreground/60">({t("common.optional")})</span>
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">— Sin categoría (needs_review)</option>
          {["fixed", "variable", "special"].map((type) => {
            const cats = categories.filter((c) => c.type === type);
            if (!cats.length) return null;
            return (
              <optgroup key={type} label={type.charAt(0).toUpperCase() + type.slice(1)}>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      {/* Contraparte */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {t("counterparty.label")}{" "}
          <span className="text-muted-foreground/60">({t("common.optional")})</span>
        </label>
        <CounterpartySelect value={counterparty} onChange={setCounterparty} />
      </div>

      {/* Nota */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {t("expenses.note")}{" "}
          <span className="text-muted-foreground/60">({t("common.optional")})</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Factura #123, etc."
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          disabled={!isValid || saving}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {saving ? t("common.loading") : t("common.save")}
          {willNeedsReview && !saving && (
            <span className="ml-1.5 text-xs opacity-70">(needs_review)</span>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Bulk Upload Modal ────────────────────────────────────────────────────────

function BulkUploadModal({
  accounts,
  onClose,
  onDone,
}: {
  accounts: Account[];
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useT();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<unknown[]>([]);
  const [result, setResult] = useState<{ created: number; errors: { row: number; error: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = () => {
    const lines = csv.trim().split("\n").filter(Boolean);
    const rows = lines.map((line, i) => {
      const [account_id, amount_value, amount_currency, date, category_id, note] = line.split(",").map((s) => s.trim());
      return { row: i, account_id, amount_value: Number(amount_value), amount_currency: amount_currency || "ARS", date, category_id: category_id || null, note: note || null };
    });
    setPreview(rows);
  };

  const handleUpload = async () => {
    if (!preview.length) return;
    setLoading(true);
    setError(null);
    try {
      const res = await expensesApi.bulk(preview as Parameters<typeof expensesApi.bulk>[0]);
      setResult({ created: res.created.length, errors: res.errors });
      if (res.errors.length === 0) {
        setTimeout(() => { onDone(); onClose(); }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">{t("bulk.csvFormat")}</p>

      <textarea
        value={csv}
        onChange={(e) => { setCsv(e.target.value); setPreview([]); setResult(null); }}
        placeholder={`${accounts[0]?.id ?? "account-uuid"}, 15000, ARS, 2024-01-15, , Proveedor X`}
        rows={6}
        className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
      />

      {error && <ErrorState message={error} />}

      {result && (
        <div className={`rounded-md px-3 py-2 text-xs ${result.errors.length === 0 ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"}`}>
          <p>{t("bulk.success", { count: result.created })}</p>
          {result.errors.map((e) => (
            <p key={e.row}>{t("bulk.rowError", { row: e.row + 1, error: e.error })}</p>
          ))}
        </div>
      )}

      {preview.length > 0 && !result && (
        <p className="text-xs text-muted-foreground">{preview.length} filas parseadas</p>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => parseCSV()}
          disabled={!csv.trim()}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {t("bulk.preview")}
        </button>
        <button
          onClick={handleUpload}
          disabled={!preview.length || loading}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("bulk.upload", { count: preview.length })}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const t = useT();

  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [accounts, setAccounts]     = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [formOpen, setFormOpen]     = useState(false);
  const [bulkOpen, setBulkOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [pendingDraft, setPendingDraft] = useState<import("@/modules/intelligence/types").ExpenseDraft | null>(null);

  const smartEntry = useSmartEntry();

  // Filtros
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [exp, acc, cats] = await Promise.all([
        expensesApi.list({ status: filterStatus || undefined, limit: 200 }),
        accountsApi.list(),
        categoriesApi.list(),
      ]);
      setExpenses(exp);
      setAccounts(acc);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [filterStatus, t]);

  useEffect(() => { load(); }, [load]);

  const accountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name ?? id.slice(0, 8);

  const handleSave = async (data: unknown) => {
    if (editTarget) {
      await expensesApi.update(editTarget.id, data as Parameters<typeof expensesApi.update>[1]);
    } else {
      await expensesApi.create(data as Parameters<typeof expensesApi.create>[0]);
    }
    setFormOpen(false);
    setEditTarget(null);
    setPendingDraft(null);
    load();
  };

  // Build Expense-compatible initial from AI draft
  const draftInitial = pendingDraft && !editTarget ? {
    amount_value: Number(pendingDraft.amount_value ?? 0) as unknown as import("@/types/finance").Expense["amount_value"],
    amount_currency: pendingDraft.amount_currency,
    date: pendingDraft.date ?? undefined,
    note: pendingDraft.note ?? undefined,
    account_id: pendingDraft.account_id ?? undefined,
  } : undefined;

  return (
    <AppShell title={t("expenses.title")}>
      <div className="flex flex-col gap-5">

        {/* Smart Entry */}
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            <span className="text-xs font-medium text-foreground">{t("smartEntry.label")}</span>
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">Beta</span>
          </div>

          {smartEntry.state.status !== "draft" && smartEntry.state.status !== "confirmed" && (
            <div className="flex gap-2">
              <input
                type="text"
                value={smartEntry.state.text}
                onChange={(e) => smartEntry.setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") smartEntry.generate(); }}
                placeholder={t("smartEntry.placeholder")}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                onClick={() => smartEntry.generate()}
                disabled={!smartEntry.state.text.trim() || smartEntry.state.status === "loading"}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {smartEntry.state.status === "loading" ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                {t("smartEntry.button")}
              </button>
            </div>
          )}

          {smartEntry.state.status === "error" && smartEntry.state.error && (
            ["intelligence_disabled", "smart_entry_disabled", "doc_ai_disabled", "monthly_limit_exceeded"]
              .includes(smartEntry.state.error) ? (
              <LimitsBanner reason={smartEntry.state.error} />
            ) : (
              <div className="rounded-md border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-400">
                {smartEntry.state.error}
              </div>
            )
          )}

          {smartEntry.state.status === "draft" && smartEntry.state.draft && (
            <DraftCardExpense
              draft={smartEntry.state.draft}
              onConfirm={(draft) => {
                smartEntry.confirm(draft);
                setPendingDraft(draft);
                setEditTarget(null);
                setFormOpen(true);
              }}
              onDiscard={() => smartEntry.discard()}
            />
          )}

          {smartEntry.state.status === "confirmed" && (
            <p className="text-xs text-emerald-400">{t("intelligence.smartEntry.draftConfirmed")}</p>
          )}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ExpenseStatus | "")}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">{t("common.all")}</option>
              <option value="confirmed">{t("expenses.statusConfirmed")}</option>
              <option value="needs_review">{t("expenses.statusNeedsReview")}</option>
              <option value="pending">{t("expenses.statusPending")}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Upload size={13} />
              {t("expenses.bulkUpload")}
            </button>
            <button
              onClick={() => { setEditTarget(null); setFormOpen(true); }}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              <Plus size={13} />
              {t("expenses.new")}
            </button>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : expenses.length === 0 ? (
          <EmptyState message={t("expenses.noExpenses")} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Fecha", "Cuenta", "Monto", "Categoría", "Contraparte", "Estado"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="cursor-pointer transition-colors hover:bg-secondary/30"
                      onClick={() => { setEditTarget(exp); setFormOpen(true); }}
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground">{exp.date}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{accountName(exp.account_id)}</td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        ${Number(exp.amount_value).toLocaleString("es-AR")}
                        <span className="ml-1 text-xs text-muted-foreground">{exp.amount_currency}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {exp.category_id ? "—" : (
                          <span className="text-amber-400 text-xs">Sin categoría</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {exp.counterparty_id ? exp.counterparty_id.slice(0, 8) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={exp.status} />
                        {exp.is_owner_withdrawal && (
                          <Badge label="Retiro dueño" variant="blue" className="ml-1" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Form modal */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); setPendingDraft(null); }}
        title={editTarget ? t("expenses.edit") : t("expenses.new")}
        size="md"
      >
        <ExpenseForm
          accounts={accounts}
          categories={categories}
          initial={editTarget ?? draftInitial}
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditTarget(null); setPendingDraft(null); }}
        />
      </Modal>

      {/* Bulk modal */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={t("bulk.title")}
        size="lg"
      >
        <BulkUploadModal
          accounts={accounts}
          onClose={() => setBulkOpen(false)}
          onDone={load}
        />
      </Modal>
    </AppShell>
  );
}
