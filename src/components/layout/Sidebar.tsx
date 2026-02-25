import Link from "next/link";
import { LayoutDashboard, Settings, TrendingUp, Upload, FileDown } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",    href: "/dashboard",   icon: LayoutDashboard },
  { label: "Onboarding",   href: "/onboarding",  icon: Settings },
  { label: "Métricas",     href: "/metrics",     icon: TrendingUp },
  { label: "Cargar datos", href: "/uploads",     icon: Upload },
  { label: "Exports",      href: "/exports",     icon: FileDown },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <span className="text-lg font-bold text-finexa-600">Finexa Labs</span>
        <span className="ml-2 text-xs text-gray-400">MVP v0.1</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-finexa-50 hover:text-finexa-700 transition-colors"
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
