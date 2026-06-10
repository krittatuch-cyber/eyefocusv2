// app/(admin)/admin/layout.tsx — Super Admin Portal Layout (with working light/dark mode)
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, BarChart3, Shield,
  LogOut, Moon, Sun, Menu, ChevronRight, Zap, Globe,
  Settings, FileText, ClipboardCheck
} from "lucide-react";

interface AdminUser {
  id: string; email: string; name: string; role: string; tenantId: string;
}

const NAV = [
  { label: "Dashboard",    href: "/admin/dashboard",  icon: LayoutDashboard },
  { label: "Tenants",      href: "/admin/tenants",    icon: Building2 },
  { label: "Users",        href: "/admin/users",      icon: Users },
  { label: "Reports / MRR",href: "/admin/reports",    icon: BarChart3 },
  { label: "Audit Logs",   href: "/admin/audit-logs", icon: FileText },
  { label: "Pre-launch",   href: "/admin/checklist",  icon: ClipboardCheck },
  { label: "Settings",     href: "/admin/settings",   icon: Settings },
];

const THEME_KEY = "eyefocus_admin_theme";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]       = useState<AdminUser | null>(null);
  const [isDark, setIsDark]   = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Read saved theme on mount
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(THEME_KEY) : null;
    if (saved === "light") setIsDark(false);
    else setIsDark(true); // default dark
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.role !== "SUPER_ADMIN") { router.push("/login"); return; }
        setUser(data);
      } else { router.push("/login"); }
    } catch { router.push("/login"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { loadUser(); }, [loadUser]);

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/login");
  };

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  // ─── Theme token maps ─────────────────────────────────────────────────────
  const t = isDark ? {
    // Dark
    root:      "bg-slate-950 text-slate-200",
    sidebar:   "bg-slate-900 border-slate-800",
    sideNav:   "bg-slate-800 text-white",
    sideInact: "text-slate-400 hover:bg-slate-800 hover:text-white",
    sideDiv:   "border-slate-800",
    header:    "bg-slate-900 border-slate-800",
    breadcrumb:"text-slate-500",
    breadcrumbActive: "text-slate-300",
    main:      "bg-slate-950",
    toggleBtn: "bg-slate-800 hover:bg-slate-700",
    toggleIcon:"text-amber-400",
    logoutBtn: "text-slate-500 hover:text-red-400 hover:bg-slate-800",
    mobileOverlay: "bg-slate-900 border-slate-800",
    avatarBg:  "bg-violet-600/30 border-violet-500/40 text-violet-300",
    avatarName:"text-white",
    avatarRole:"text-violet-400",
  } : {
    // Light
    root:      "bg-gray-100 text-slate-800",
    sidebar:   "bg-white border-gray-200 shadow-sm",
    sideNav:   "bg-violet-600 text-white",
    sideInact: "text-slate-500 hover:bg-violet-50 hover:text-violet-700",
    sideDiv:   "border-gray-200",
    header:    "bg-white border-gray-200 shadow-sm",
    breadcrumb:"text-gray-400",
    breadcrumbActive: "text-slate-700",
    main:      "bg-gray-100",
    toggleBtn: "bg-gray-100 hover:bg-gray-200",
    toggleIcon:"text-slate-500",
    logoutBtn: "text-gray-400 hover:text-red-500 hover:bg-red-50",
    mobileOverlay: "bg-white border-gray-200",
    avatarBg:  "bg-violet-100 border-violet-200 text-violet-700",
    avatarName:"text-slate-800",
    avatarRole:"text-violet-600",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`min-h-screen flex ${t.root} transition-colors duration-200`}>

      {/* ── Sidebar ── */}
      <aside className={`hidden lg:flex flex-col w-64 border-r shrink-0 ${t.sidebar}`}>
        {/* Brand */}
        <div className={`p-5 border-b ${t.sideDiv}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none">EyeFocus</h1>
              <span className="text-[10px] text-violet-500 font-semibold uppercase tracking-widest">Super Admin</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <button key={href} onClick={() => router.push(href)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  active ? `${t.sideNav} shadow-md` : t.sideInact
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className={`p-4 border-t ${t.sideDiv} flex items-center justify-between`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${t.avatarBg}`}>
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold truncate ${t.avatarName}`}>{user.name}</p>
              <p className={`text-[10px] font-semibold ${t.avatarRole}`}>SUPER ADMIN</p>
            </div>
          </div>
          <button onClick={handleLogout} className={`p-2 rounded-xl transition ${t.logoutBtn}`}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className={`h-14 border-b flex items-center justify-between px-6 ${t.header}`}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className={`hidden lg:flex items-center gap-1.5 text-xs ${t.breadcrumb}`}>
              <Globe className="w-3.5 h-3.5" />
              <span>admin.eyefocus.app</span>
              <ChevronRight className="w-3 h-3" />
              <span className={`capitalize ${t.breadcrumbActive}`}>{pathname?.split("/").pop()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-violet-600/20 border border-violet-500/30 text-violet-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
              <Shield className="w-3 h-3" /> SUPER ADMIN
            </div>
            {/* Dark/Light toggle */}
            <button onClick={toggleDark}
              className={`p-2 rounded-xl transition ${t.toggleBtn}`}
              title={isDark ? "เปลี่ยนเป็น Light mode" : "เปลี่ยนเป็น Dark mode"}>
              {isDark
                ? <Sun  className={`w-4 h-4 ${t.toggleIcon}`} />
                : <Moon className={`w-4 h-4 ${t.toggleIcon}`} />
              }
            </button>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-6 ${t.main}`}>
          {children}
        </main>
      </div>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div className={`relative w-64 flex flex-col h-full shadow-2xl border-r ${t.mobileOverlay}`}>
            <div className={`p-5 flex items-center justify-between border-b ${t.sideDiv}`}>
              <span className="font-bold">Super Admin</span>
              <button onClick={() => setMenuOpen(false)} className="text-slate-500 hover:text-red-400">✕</button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {NAV.map(({ label, href, icon: Icon }) => (
                <button key={href} onClick={() => { router.push(href); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm ${
                    pathname === href ? `${t.sideNav} shadow` : t.sideInact
                  }`}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
