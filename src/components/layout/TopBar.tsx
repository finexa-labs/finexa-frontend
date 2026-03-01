"use client";

import { Menu, RefreshCw, Download, User } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useT } from "@/contexts/LocaleContext";

interface TopBarProps {
  title?: string;
  onMenuClick: () => void;
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const t = useT();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("topbar.ariaOpenMenu")}
        >
          <Menu size={20} />
        </button>
        {title && (
          <h1 className="text-sm font-medium text-foreground">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Week selector */}
        <span className="hidden sm:inline-flex items-center rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          {t("topbar.thisWeek")}
        </span>

        <button className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
          <RefreshCw size={13} />
          <span className="hidden sm:inline">{t("topbar.sync")}</span>
        </button>

        <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Download size={13} />
          <span className="hidden sm:inline">{t("topbar.export")}</span>
        </button>

        <LanguageSwitcher />

        <div className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
          <User size={14} />
        </div>
      </div>
    </header>
  );
}
