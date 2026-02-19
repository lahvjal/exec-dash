"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";

const settingsNav = [
  { label: "Goals",              href: "/settings/goals"          },
  { label: "KPI Management",     href: "/settings/kpis"           },
  { label: "KPI Documentation",  href: "/settings/documentation"  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="flex">
        {/* Left sidebar */}
        <aside className="w-52 shrink-0 sticky top-[65px] h-[calc(100vh-65px)] border-r border-black bg-white flex flex-col pt-6 px-4 gap-1">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Settings
          </p>
          {settingsNav.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                isActive(href)
                  ? "text-black font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
