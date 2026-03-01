"use client";

import { useState } from "react";
import { Check, X, Pencil, AlertTriangle } from "lucide-react";
import { useT } from "@/contexts/LocaleContext";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { ExpenseDraft } from "../types";

interface Props {
  draft: ExpenseDraft;
  onConfirm: (draft: ExpenseDraft) => void;
  onDiscard: () => void;
}

export function DraftCardExpense({ draft, onConfirm, onDiscard }: Props) {
  const t = useT();
  const [edited, setEdited] = useState<ExpenseDraft>({ ...draft });

  function field(label: string, value: string | null, onChange: (v: string) => void) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-accent/30 bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pencil size={13} className="text-accent" />
          <span className="text-xs font-medium text-foreground">
            {t("intelligence.smartEntry.draftReady")}
          </span>
        </div>
        <ConfidenceBadge confidence={edited.confidence} />
      </div>

      {edited.warnings.length > 0 && (
        <div className="flex flex-col gap-1">
          {edited.warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-yellow-400">
              <AlertTriangle size={11} />
              {w}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {field(t("expenses.amount"), edited.amount_value, (v) =>
          setEdited((d) => ({ ...d, amount_value: v }))
        )}
        {field(t("expenses.currency"), edited.amount_currency, (v) =>
          setEdited((d) => ({ ...d, amount_currency: v }))
        )}
        {field(t("expenses.date"), edited.date, (v) =>
          setEdited((d) => ({ ...d, date: v }))
        )}
        {field(t("expenses.counterparty"), edited.counterparty, (v) =>
          setEdited((d) => ({ ...d, counterparty: v }))
        )}
        {field(t("expenses.category"), edited.category_slug, (v) =>
          setEdited((d) => ({ ...d, category_slug: v }))
        )}
        {field(t("expenses.note"), edited.note, (v) =>
          setEdited((d) => ({ ...d, note: v }))
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onConfirm(edited)}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          <Check size={12} />
          {t("common.confirm")}
        </button>
        <button
          onClick={onDiscard}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={12} />
          {t("common.discard")}
        </button>
      </div>
    </div>
  );
}
