"use client";

import { AlertTriangle } from "lucide-react";
import { useT } from "@/contexts/LocaleContext";

interface Props {
  reason: string; // LimitsError code
}

export function LimitsBanner({ reason }: Props) {
  const t = useT();

  const messageKey =
    reason === "monthly_limit_exceeded"
      ? "intelligence.errors.monthlyLimitExceeded"
      : reason === "smart_entry_disabled"
      ? "intelligence.errors.smartEntryDisabled"
      : reason === "doc_ai_disabled"
      ? "intelligence.errors.docAiDisabled"
      : "intelligence.errors.intelligenceDisabled";

  return (
    <div className="flex items-start gap-2 rounded-md border border-yellow-400/20 bg-yellow-400/5 px-3 py-2 text-xs text-yellow-400">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      <span>{t(messageKey)}</span>
    </div>
  );
}
