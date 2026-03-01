import { cn } from "@/lib/utils";

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({ message, icon, className, children }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-center",
        className
      )}
    >
      {icon && <div className="text-muted-foreground/40">{icon}</div>}
      <p className="text-sm text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">
      {message}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-14">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  );
}
