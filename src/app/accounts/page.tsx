"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Archive, X, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BankIcon } from "@/components/finance/BankIcon";
import { LoadingState, ErrorState } from "@/components/ui/EmptyState";
import { accountsApi } from "@/lib/api";
import { ARGENTINA_BANKS, getBankConfig } from "@/lib/argentineBanks";
import type { Account } from "@/types/finance";
import { cn } from "@/lib/utils";

// ─── Color swatches ──────────────────────────────────────────────────────────

const PRESET_COLORS = ["#6366f1", "#ec0000", "#00b1ea", "#388e3c", "#f9a825", "#7c3aed"];

// ─── CajaFormModal ───────────────────────────────────────────────────────────

interface CajaFormModalProps {
  open: boolean;
  initial?: Account;
  onClose: () => void;
  onSaved: () => void;
}

function CajaFormModal({ open, initial, onClose, onSaved }: CajaFormModalProps) {
  const [bankTypeId, setBankTypeId] = useState(initial?.bank_type ?? "");
  const [name, setName]             = useState(initial?.name ?? "");
  const [currency, setCurrency]     = useState(initial?.currency ?? "ARS");
  const [color, setColor]           = useState(initial?.color ?? "#6366f1");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Reset when opening for a different account
  useEffect(() => {
    if (open) {
      setBankTypeId(initial?.bank_type ?? "");
      setName(initial?.name ?? "");
      setCurrency(initial?.currency ?? "ARS");
      setColor(initial?.color ?? "#6366f1");
      setError(null);
    }
  }, [open, initial]);

  const handleBankSelect = (id: string) => {
    setBankTypeId(id);
    const cfg = getBankConfig(id);
    if (cfg) setColor(cfg.defaultColor);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        await accountsApi.update(initial.id, { name: name.trim(), bank_type: bankTypeId || null, color, currency });
      } else {
        await accountsApi.create({ name: name.trim(), type: "BANK", currency, bank_type: bankTypeId || null, color });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const wallets = ARGENTINA_BANKS.filter((b) => b.category === "wallet");
  const banks   = ARGENTINA_BANKS.filter((b) => b.category === "bank");
  const others  = ARGENTINA_BANKS.filter((b) => b.category === "other");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            {initial ? "Editar caja" : "Nueva caja"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {error && <ErrorState message={error} />}

          {/* Bank/wallet picker */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Banco / billetera</p>
            <div className="flex flex-col gap-2">
              {[{ label: "Billeteras digitales", items: wallets }, { label: "Bancos", items: banks }, { label: "Otros", items: others }].map(({ label, items }) => (
                <div key={label}>
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleBankSelect(b.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                          bankTypeId === b.id
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-muted-foreground hover:border-accent/40 hover:text-foreground"
                        )}
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                          style={{ backgroundColor: b.defaultColor }}
                        >
                          {b.abbr.slice(0, 2)}
                        </span>
                        {b.name}
                        {bankTypeId === b.id && <Check size={10} />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre personalizado <span className="text-red-400">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ej. "Mi Santander personal"'
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Currency */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Moneda</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ARS">ARS — Peso argentino</option>
              <option value="USD">USD — Dólar</option>
            </select>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Color</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                title="Color personalizado"
              />
              <div className="ml-2 flex items-center gap-2 text-xs text-muted-foreground">
                <BankIcon bankType={bankTypeId || null} color={color} size="sm" name={name || "?"} />
                <span>Vista previa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CajaCard ────────────────────────────────────────────────────────────────

interface CajaCardProps {
  account: Account;
  onEdit: () => void;
  onArchive: () => void;
}

function CajaCard({ account, onEdit, onArchive }: CajaCardProps) {
  const cfg = getBankConfig(account.bank_type);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <BankIcon bankType={account.bank_type} color={account.color ?? "#6366f1"} size="lg" name={account.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{account.name}</p>
          <p className="text-xs text-muted-foreground">{cfg?.name ?? account.type} · {account.currency}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil size={11} />
          Editar
        </button>
        <button
          onClick={onArchive}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors"
        >
          <Archive size={11} />
          Archivar
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const [accounts, setAccounts]   = useState<Account[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Account | undefined>(undefined);

  const load = async () => {
    try {
      const list = await accountsApi.list();
      setAccounts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cuentas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleArchive = async (id: string) => {
    try {
      await accountsApi.update(id, { status: "archived" } as Partial<Account>);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al archivar");
    }
  };

  const openNew = () => { setEditing(undefined); setModalOpen(true); };
  const openEdit = (acc: Account) => { setEditing(acc); setModalOpen(true); };

  const active   = accounts.filter((a) => a.status === "active");
  const archived = accounts.filter((a) => a.status === "archived");

  return (
    <AppShell title="Cajas">
      <div className="flex flex-col gap-8 max-w-3xl">

        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} />}

        {!loading && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">Cajas activas</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Cada caja representa una cuenta bancaria o billetera digital.
                </p>
              </div>
              <button
                onClick={openNew}
                className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
              >
                <Plus size={14} />
                Nueva caja
              </button>
            </div>

            {/* Active cajas */}
            {active.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12">
                <p className="text-sm text-muted-foreground">No tenés cajas activas aún.</p>
                <button
                  onClick={openNew}
                  className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
                >
                  <Plus size={14} />
                  Crear primera caja
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((acc) => (
                  <CajaCard
                    key={acc.id}
                    account={acc}
                    onEdit={() => openEdit(acc)}
                    onArchive={() => handleArchive(acc.id)}
                  />
                ))}
              </div>
            )}

            {/* Archived */}
            {archived.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Archivadas ({archived.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {archived.map((acc) => {
                    const cfg = getBankConfig(acc.bank_type);
                    return (
                      <div key={acc.id} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-2.5 opacity-60">
                        <BankIcon bankType={acc.bank_type} color={acc.color ?? "#6366f1"} size="sm" name={acc.name} />
                        <span className="text-sm text-muted-foreground">{acc.name}</span>
                        <span className="text-xs text-muted-foreground/60">{cfg?.name ?? acc.type} · {acc.currency}</span>
                        <button
                          onClick={() => accountsApi.update(acc.id, { status: "active" } as Partial<Account>).then(load)}
                          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Restaurar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

      </div>

      <CajaFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </AppShell>
  );
}
