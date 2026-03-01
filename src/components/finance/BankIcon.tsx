import { getBankConfig } from "@/lib/argentineBanks";
import { cn } from "@/lib/utils";

interface BankIconProps {
  bankType?: string | null;
  color: string;
  size?: "sm" | "md" | "lg";
  name?: string;
  className?: string;
}

const SIZE_CLASSES = {
  sm: { container: "h-7 w-7 text-[10px]", font: "font-semibold" },
  md: { container: "h-9 w-9 text-xs",     font: "font-bold"    },
  lg: { container: "h-12 w-12 text-sm",   font: "font-bold"    },
};

export function BankIcon({ bankType, color, size = "md", name, className }: BankIconProps) {
  const config = getBankConfig(bankType);
  const abbr = config?.abbr ?? (name ? name.slice(0, 2).toUpperCase() : "??");
  const { container, font } = SIZE_CLASSES[size];

  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full text-white", container, font, className)}
      style={{ backgroundColor: color }}
      title={config?.name ?? name}
    >
      {abbr}
    </div>
  );
}
