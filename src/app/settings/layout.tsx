"use client";

import { usePathname } from "next/navigation";
import { Target, Database, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";

const settingsNav = [
  { label: "Overview", href: "/settings", icon: LayoutDashboard, exact: true },
  { label: "Goals",    href: "/settings/goals", icon: Target, exact: false },
  { label: "KPIs",    href: "/settings/kpis",  icon: Database, exact: false },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname?.startsWith(href);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shared navbar — same as dashboard */}
      <Header />

      {/* Settings sub-navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-[52px] z-40">
        <div className="px-5">
          <nav className="flex items-center gap-1 h-11">
            {settingsNav.map(({ label, href, icon: Icon, exact }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(href, exact)
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <main>{children}</main>
    </div>
  );
}
