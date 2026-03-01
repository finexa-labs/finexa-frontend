"use client";

import { Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/contexts/LocaleContext";
import type { KindSuggestion } from "../types";

interface Props {
  suggestion: KindSuggestion;
  onApply: (kind: string) => void;
  onDismiss: () => void;
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
  medium: "text-yellow-400 border-yellow-400/20 bg-yellow-400/5",
  low: "text-muted-foreground border-border bg-card/40",
};

export function KindSuggestionBanner({ suggestion, onApply, onDismiss }: Props) {
  const t = useT();
  const color = CONFIDENCE_COLOR[suggestion.confidence] ?? CONFIDENCE_COLOR.low;

  return (
    <div className={cn("rounded-md border px-3 py-2.5 text-xs flex flex-col gap-2", color)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles size={12} />
          {t("intelligence.docAi.kindSuggestion")}
          <span className="font-bold">
            {t(`ingestion.documentKinds.${suggestion.kind}.title` as never) ?? suggestion.kind}
          </span>
          <span className="opacity-60">
            ({t(`ingestion.step0.confidence${suggestion.confidence.charAt(0).toUpperCase() + suggestion.confidence.slice(1)}` as never)})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onApply(suggestion.kind)}
            className="inline-flex items-center gap-0.5 rounded bg-accent/20 px-2 py-0.5 text-accent hover:bg-accent/30 transition-colors"
          >
            {t("ingestion.step0.applyDetection")}
            <ChevronRight size={10} />
          </button>
          <button
            onClick={onDismiss}
            className="rounded px-2 py-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      {suggestion.reasons.length > 0 && (
        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
          {suggestion.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
