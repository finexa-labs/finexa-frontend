import { cn } from "@/lib/utils";

interface Props {
  confidence: number; // 0.0 – 1.0
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: Props) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 80
      ? "text-emerald-400 bg-emerald-400/10"
      : pct >= 50
      ? "text-yellow-400 bg-yellow-400/10"
      : "text-red-400 bg-red-400/10";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        color,
        className
      )}
    >
      {pct}%
    </span>
  );
}
