"use client";

import { Bell, Settings, User, Target, Database } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isGoalsPage = pathname === "/goals";
  const isKPIsPage = pathname === "/kpis";
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo & Title */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image
            src="/logo/aveyo-logo.svg"
            alt="Aveyo Logo"
            width={112}
            height={24}
            priority
            className="h-6 w-auto"
          />
          <div className="h-6 w-px bg-slate-200 ml-1" />
          <div>
            <p className="text-xs text-slate-500 font-medium">KPI Dashboard</p>
          </div>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <Link
            href="/kpis"
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              isKPIsPage
                ? "bg-blue-100 text-blue-600"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
            title="Manage KPIs"
          >
            <Database className="h-5 w-5" />
          </Link>
          <Link
            href="/goals"
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              isGoalsPage
                ? "bg-blue-100 text-blue-600"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
            title="Manage Goals"
          >
            <Target className="h-5 w-5" />
          </Link>
          <div className="ml-2 h-6 w-px bg-slate-200" />
          <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600">
              <User className="h-4 w-4" />
            </div>
            <span className="font-medium">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}

