"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";

const settingsNav = [
  { label: "Overview", href: "/settings",       exact: true  },
  { label: "Goals",    href: "/settings/goals",  exact: false },
  { label: "KPIs",    href: "/settings/kpis",   exact: false },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname?.startsWith(href);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Settings sub-navigation — same style as main header nav links */}
      <div className="bg-white border-b border-black sticky top-[65px] z-40">
        <div className="flex items-center gap-1 px-5 h-11">
          {settingsNav.map(({ label, href, exact }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 text-sm transition-colors ${
                isActive(href, exact)
                  ? "text-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <main>{children}</main>
    </div>
  );
}
