import { AlertTriangle, Check, SkipForward, XCircle } from "lucide-react";
import type { ImportRowDecision, RowDecision } from "../types";
import { decisionColor, decisionLabel, truncate } from "../utils";

interface DedupCardProps {
  decision: ImportRowDecision;
  categoryName?: string;
  counterpartyName?: string;
  onChangeDecision: (id: string, decision: RowDecision) => void;
}

const DECISION_ICON = {
  import: Check,
  skip: SkipForward,
  needs_user_action: AlertTriangle,
  error: XCircle,
};

export function DedupCard({
  decision,
  categoryName,
  counterpartyName,
  onChangeDecision,
}: DedupCardProps) {
  const mapped = decision.mapped;
  const Icon = DECISION_ICON[decision.decision as keyof typeof DECISION_ICON] ?? Check;

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      {/* Row info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              #{decision.row_index + 1}
            </span>
            {mapped?.date && (
              <span className="text-xs text-foreground">{mapped.date}</span>
            )}
            {mapped?.amount_value && (
              <span className="text-sm font-semibold text-foreground">
                {mapped.amount_currency} {parseFloat(mapped.amount_value).toLocaleString("es-AR")}
              </span>
            )}
          </div>
          {mapped?.counterparty && (
            <span className="text-xs text-muted-foreground truncate">
              {truncate(mapped.counterparty, 50)}
            </span>
          )}
          {mapped?.note && (
            <span className="text-xs text-muted-foreground/70 italic truncate">
              {truncate(mapped.note, 60)}
            </span>
          )}
          {categoryName && (
            <span className="text-xs text-accent/80">{categoryName}</span>
          )}
        </div>

        {/* Decision badge */}
        <div className={`flex items-center gap-1 shrink-0 ${decisionColor(decision.decision)}`}>
          <Icon size={14} />
          <span className="text-xs font-medium">{decisionLabel(decision.decision)}</span>
        </div>
      </div>

      {/* Dedup warning */}
      {decision.dedup_score !== null && decision.dedup_score > 0.5 && (
        <div className="rounded-md bg-amber-400/10 border border-amber-400/20 px-3 py-2 text-xs text-amber-400">
          Posible duplicado (score: {(decision.dedup_score * 100).toFixed(0)}%)
        </div>
      )}

      {/* Error detail */}
      {decision.error_detail && (
        <div className="rounded-md bg-red-400/10 border border-red-400/20 px-3 py-2 text-xs text-red-400">
          {decision.error_detail}
        </div>
      )}

      {/* Action buttons */}
      {decision.decision !== "error" && (
        <div className="flex items-center gap-2 pt-1">
          {decision.decision !== "import" && (
            <button
              onClick={() => onChangeDecision(decision.id, "import")}
              className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-400/20 transition-colors"
            >
              Importar
            </button>
          )}
          {decision.decision !== "skip" && (
            <button
              onClick={() => onChangeDecision(decision.id, "skip")}
              className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Omitir
            </button>
          )}
        </div>
      )}
    </div>
  );
}
