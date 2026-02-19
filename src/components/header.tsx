"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";

const ORG_CHART_URL =
  process.env.NEXT_PUBLIC_ORG_CHART_URL || "http://localhost:5173";

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isSettingsPage = pathname?.startsWith("/settings");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-4">
          <a
            href={ORG_CHART_URL}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Org Chart
          </a>
          <div className="h-5 w-px bg-slate-200" />
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
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <div className="ml-2 h-6 w-px bg-slate-200" />
          <Link
            href="/settings"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              isSettingsPage
                ? "bg-blue-100 text-blue-600 font-medium"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                <User className="h-4 w-4" />
              </div>
              <span className="font-medium">{user?.email?.split('@')[0] || 'User'}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <div className="px-4 py-2">
                  <p className="text-xs text-slate-500">Signed in as</p>
                  <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                </div>
                <div className="border-t border-slate-200 mt-1 pt-1">
                  <a
                    href={ORG_CHART_URL}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    ← Back to Org Chart
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
