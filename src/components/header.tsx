"use client";

import { Bell, Settings, User } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold text-lg shadow-sm">
            A
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Aveyo</h1>
            <p className="text-xs text-slate-500">KPI Dashboard</p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Settings className="h-5 w-5" />
          </button>
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

