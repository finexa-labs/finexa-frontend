import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  message: string;
}

export function AlertBanner({ message }: AlertBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3">
      <AlertTriangle size={16} className="shrink-0 text-amber-400" />
      <p className="text-sm text-amber-200/80">{message}</p>
    </div>
  );
}
