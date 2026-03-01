import { cn } from "@/lib/utils";

type Variant = "green" | "yellow" | "red" | "blue" | "gray";

const VARIANTS: Record<Variant, string> = {
  green:  "bg-emerald-400/10 border-emerald-400/20 text-emerald-400",
  yellow: "bg-amber-400/10 border-amber-400/20 text-amber-400",
  red:    "bg-red-400/10 border-red-400/20 text-red-400",
  blue:   "bg-blue-400/10 border-blue-400/20 text-blue-400",
  gray:   "bg-secondary border-border text-muted-foreground",
};

interface BadgeProps {
  label: string;
  variant?: Variant;
  className?: string;
}

export function Badge({ label, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: "confirmed" | "pending" | "needs_review" }) {
  const map = {
    confirmed:    { label: "Confirmado",            variant: "green"  },
    pending:      { label: "Pendiente",              variant: "yellow" },
    needs_review: { label: "Pendiente de categorizar", variant: "yellow" },
  } as const;
  const { label, variant } = map[status];
  return <Badge label={label} variant={variant} />;
}
