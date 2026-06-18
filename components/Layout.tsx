"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GitBranch, Wallet, Plus, Target, ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatPoints, useWallet } from "@/context/WalletContext";
import { Skeleton } from "@/components/Loading";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { stats, loading: walletLoading } = useWallet();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: t.navDashboard },
    { path: "/create", icon: Plus, label: t.navNewAssignment },
    { path: "/roadmap/all", icon: GitBranch, label: t.navRoadmap },
    { path: "/deposit", icon: Wallet, label: t.navPoints },
  ];

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 lg:left-64 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="hidden lg:block flex-1" />

        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl leading-none">{language === "en" ? "🇺🇸" : "🇻🇳"}</span>
              <ChevronDown size={13} className={`text-gray-500 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => { setLanguage("en"); setLangOpen(false); }}
                  className={`w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                    language === "en" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  <span>🇺🇸</span>
                  <span>English</span>
                </button>
                <div className="border-t border-gray-100" />
                <button
                  onClick={() => { setLanguage("vi"); setLangOpen(false); }}
                  className={`w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                    language === "vi" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  <span>🇻🇳</span>
                  <span>Tiếng Việt</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative group">
            <button className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md hover:shadow-lg transition-shadow ring-2 ring-white">
              TC
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-32 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50 hidden group-hover:block">
              <div className="px-4 py-2.5 text-sm text-gray-500 border-b border-gray-100">Student</div>
              <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                {t.headerProfile}
              </button>
            </div>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`w-64 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white flex flex-col fixed top-0 h-screen z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-indigo-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">{t.appName}</h1>
                <p className="text-xs text-indigo-300 truncate">{t.appTagline}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-indigo-200 hover:bg-indigo-800 transition-colors flex-shrink-0"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive =
              pathname === path ||
              (path.startsWith("/roadmap") && pathname.startsWith("/roadmap"));

            return (
              <Link
                key={path}
                href={path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-700 text-white"
                    : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-indigo-700">
          <div className="bg-indigo-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-indigo-300">{t.sidebarTotalPoints}</span>
              <Wallet size={16} className="text-yellow-400" />
            </div>
            {walletLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{formatPoints(stats?.totalBalance, !stats)}</div>
            )}
            <div className="text-xs text-indigo-300 mt-1">{t.sidebarKeepEarning}</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 w-full min-w-0 ml-0 lg:ml-64 mt-14">
        {children}
      </main>

      {langOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setLangOpen(false)}
        />
      )}
    </div>
  );
}
