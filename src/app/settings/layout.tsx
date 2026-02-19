"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Home, Target, Database, LayoutDashboard, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";

const ORG_CHART_URL =
  process.env.NEXT_PUBLIC_ORG_CHART_URL || "http://localhost:5173";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Settings Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Settings Title */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <SettingsIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">Settings</span>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex items-center gap-1">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/settings"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Overview
                </Link>
                <Link
                  href="/settings/goals"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/settings/goals"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Target className="h-4 w-4" />
                  Goals
                </Link>
                <Link
                  href="/settings/kpis"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/settings/kpis"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Database className="h-4 w-4" />
                  KPIs
                </Link>
              </nav>
            </div>

            {/* User Info and Org Chart link */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">{user?.email}</span>
              </div>
              <a
                href={ORG_CHART_URL}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
              >
                ← Org Chart
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
