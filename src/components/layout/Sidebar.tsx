"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plug,
  DollarSign,
  Megaphone,
  Lightbulb,
  FileDown,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Activity,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ingestion", href: "/ingestion", icon: Plug },
  { label: "Costos", href: "/costs", icon: DollarSign },
  { label: "Ads Spend", href: "/ads-spend", icon: Megaphone },
  { label: "Recomendaciones", href: "/recommendations", icon: Lightbulb },
  { label: "Exports / Audit", href: "/exports", icon: FileDown },
];

const ADMIN_ITEMS = [
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20">
          <span className="text-sm font-bold text-accent">FX</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-wide text-foreground">
            FINEXA
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onMobileClose}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-sidebar-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                  )}
                  <Icon
                    size={18}
                    className={cn(
                      "shrink-0",
                      isActive ? "text-accent" : "text-sidebar-foreground"
                    )}
                  />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Separator */}
        <div className="my-4 h-px bg-sidebar-border" />

        <ul className="flex flex-col gap-1">
          {ADMIN_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onMobileClose}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-sidebar-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                  )}
                  <Icon
                    size={18}
                    className={cn(
                      "shrink-0",
                      isActive ? "text-accent" : "text-sidebar-foreground"
                    )}
                  />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        {!collapsed ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity size={12} className="text-success" />
              <span>Conectado</span>
              <span className="ml-auto">Sync: hace 2h</span>
            </div>
            <a
              href="#"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare size={12} />
              <span>Enviar feedback</span>
            </a>
          </div>
        ) : (
          <div className="flex justify-center">
            <Activity size={14} className="text-success" />
          </div>
        )}
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center border-t border-sidebar-border py-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={onMobileClose}
          className="absolute right-3 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar menu"
        >
          <X size={20} />
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-in-out",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
