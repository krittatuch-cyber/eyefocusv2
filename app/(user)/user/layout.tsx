// app/(user)/user/layout.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import LanguageSwitcher from "@/components/shared/language-switcher";
import { getNavPermissions } from "@/lib/permissions";
import {
  Home, ShoppingCart, Calendar, Layers, Users, Building2,
  ChevronDown, Moon, Sun, LogOut, WifiOff, ClipboardList,
  RefreshCw, Bell, Package, Compass, Menu, X,
  Eye, DollarSign, ArrowLeftRight, PackagePlus,
} from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  branchId: string | null;
  tenantId: string;
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useI18n();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [branchName, setBranchName] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (!data.roles || !Array.isArray(data.roles) || data.roles.length === 0) {
          data.roles = [data.role];
        }
        setUser(data);
        sessionStorage.setItem("currentUser", JSON.stringify(data));
        if (data.branchId) {
          try {
            const brRes = await fetch("/api/branches", { credentials: "include" });
            if (brRes.ok) {
              const branches: { id: string; name: string }[] = await brRes.json();
              const br = branches.find(b => b.id === data.branchId);
              setBranchName(br?.name || (locale === "th" ? "ไม่ได้เลือกสาขา" : "No Branch"));
            }
          } catch { setBranchName(locale === "th" ? "ไม่ได้เลือกสาขา" : "No Branch"); }
        } else {
          setBranchName(locale === "th" ? "ทุกสาขา" : "All Branches");
        }
        setAuthLoading(false);
        return;
      }
    } catch { /* fall through */ }

    const stored = sessionStorage.getItem("currentUser");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        if (!parsed.roles || !Array.isArray(parsed.roles) || parsed.roles.length === 0) {
          parsed.roles = [parsed.role];
        }
        setUser(parsed);
        setBranchName(locale === "th" ? "ไม่ได้เลือกสาขา" : "No Branch");
        setAuthLoading(false);
        return;
      } catch { /* invalid */ }
    }

    router.push("/login");
  }, [router, locale]);

  useEffect(() => {
    loadUser();
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    try {
      const saved = localStorage.getItem("eyefocus_theme");
      const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDarkMode(isDark);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    } catch { /* ignore */ }
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadUser]);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    try { localStorage.setItem("eyefocus_theme", nextDark ? "dark" : "light"); } catch { /* ignore */ }
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.setAttribute("data-theme", nextDark ? "dark" : "light");
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch { }
    sessionStorage.removeItem("currentUser");
    router.push("/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ─── Nav Permissions ───────────────────────────────────────────────────────
  const userRoles: string[] = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles : [user.role];
  const navPerms = getNavPermissions(userRoles);
  const isManagerAbove = userRoles.some(r => ["OWNER", "MANAGER"].includes(r));

  // ─── Full list of ALL available nav items (pool) ──────────────────────────
  type NavItem = { label: string; href: string; icon: React.ElementType; show: boolean };
  const allPool: NavItem[] = [
    { label: t("nav_home"),         href: "/user/dashboard",        icon: Home,          show: true },
    { label: t("nav_pos"),          href: "/user/pos",               icon: ShoppingCart,  show: navPerms.pos },
    { label: t("menu_customers"),   href: "/user/customers",         icon: Users,         show: navPerms.customers },
    { label: "ค่าสายตา",            href: "/user/eyesight",          icon: Eye,           show: navPerms.eyesight },
    { label: t("nav_appointments"), href: "/user/appointments",      icon: Calendar,      show: navPerms.appointments },
    { label: t("nav_jobs"),         href: "/user/jobs",              icon: Layers,        show: navPerms.jobs },
    { label: "สินค้า",              href: "/user/products",          icon: Package,       show: navPerms.products },
    { label: "เปิด-ปิดกะ",          href: "/user/shift",             icon: ClipboardList, show: navPerms.shift },
    { label: "การชำระเงิน",         href: "/user/payments",          icon: DollarSign,    show: navPerms.payments },
    { label: "รับเข้าสต็อก",        href: "/user/stock-receive",     icon: PackagePlus,   show: navPerms.stockReceive },
    { label: "โอนสต็อก",            href: "/user/transfer-stocks",   icon: ArrowLeftRight,show: navPerms.stockTransfer },
    { label: t("claimsTitle"),      href: "/user/claims",            icon: ClipboardList, show: navPerms.claims },
    { label: "เลือกสาขาใหม่",       href: "/user/branch-select",     icon: Building2,     show: navPerms.branchSelect },
  ].filter(i => i.show);

  // ─── Role-based bottom nav priority (4 slots, 5th = เพิ่มเติม) ───────────
  // Determine primary role for priority ordering
  const primaryRole = userRoles.includes("OWNER")    ? "OWNER"
    : userRoles.includes("MANAGER")  ? "MANAGER"
    : userRoles.includes("OD")       ? "OD"
    : userRoles.includes("OPTICIAN") ? "OPTICIAN"
    : userRoles.includes("SALES")    ? "SALES"
    : userRoles.includes("CASHIER")  ? "CASHIER"
    : "SALES";

  const BOTTOM_PRIORITY: Record<string, string[]> = {
    OWNER:    ["/user/dashboard", "/user/pos",      "/user/customers",   "/user/jobs"],
    MANAGER:  ["/user/dashboard", "/user/pos",      "/user/customers",   "/user/jobs"],
    OD:       ["/user/dashboard", "/user/customers", "/user/eyesight",   "/user/appointments"],
    OPTICIAN: ["/user/dashboard", "/user/jobs",      "/user/customers",  "/user/appointments"],
    SALES:    ["/user/dashboard", "/user/pos",       "/user/customers",  "/user/appointments"],
    CASHIER:  ["/user/dashboard", "/user/pos",       "/user/shift",      "/user/customers"],
  };

  const priorityHrefs = BOTTOM_PRIORITY[primaryRole] ?? BOTTOM_PRIORITY.SALES;
  const bottomNavItems = priorityHrefs
    .map(href => allPool.find(i => i.href === href))
    .filter((i): i is NavItem => !!i)
    .slice(0, 4);

  // ─── More Menu = everything NOT in bottom nav ──────────────────────────────
  const bottomHrefs = new Set(bottomNavItems.map(i => i.href));
  const moreMenuItems = allPool.filter(i => !bottomHrefs.has(i.href));

  // ─── All nav items for desktop sidebar (bottom + more, deduped) ───────────
  const allNavItems = allPool; // already filtered by .show above

  const navTo = (href: string) => {
    setShowMoreMenu(false);
    setMobileSidebarOpen(false);
    router.push(href);
  };

  // ─── Shared sidebar content ────────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="p-5 flex items-center space-x-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-extrabold text-sm">EF</div>
        <div>
          <h1 className="font-bold text-white text-sm tracking-wide">EYE FOCUS</h1>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Front Office</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-grow p-4 overflow-y-auto space-y-1">
        {allNavItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <button
              key={idx}
              onClick={() => navTo(item.href)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition duration-200 cursor-pointer ${
                isActive
                  ? "bg-accent text-white font-semibold shadow-md shadow-accent/10"
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* กลับหน้าจัดการ (OWNER/MANAGER) */}
        {isManagerAbove && (
          <button
            onClick={() => navTo("/seller/dashboard")}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium text-violet-400 hover:bg-slate-800 transition cursor-pointer mt-3 pt-3 border-t border-slate-800"
          >
            <span className="w-4 h-4 flex items-center justify-center text-violet-400">←</span>
            <span>หน้าจัดการร้าน</span>
          </button>
        )}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-xs">
            {user.name.charAt(0)}
          </div>
          <div className="truncate w-[130px]">
            <p className="text-xs font-semibold text-white truncate leading-tight">{user.name}</p>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{user.role}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800/50 rounded-xl transition cursor-pointer"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 lg:flex lg:bg-slate-50 dark:lg:bg-slate-950">

      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[280px] bg-slate-900 text-slate-300 border-r border-slate-800 z-30 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-[280px] bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl">
            <div className="absolute top-4 right-4">
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Content Area ──────────────────────────────────────────── */}
      <div className="flex-1 min-h-screen flex flex-col lg:ml-[280px]">

        {/* Mobile: centered phone-width — Desktop: full width */}
        <div className="w-full max-w-md mx-auto lg:max-w-none lg:mx-0 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 relative border-x border-slate-200/80 dark:border-slate-800/80 lg:border-0">

          {/* Offline Banner */}
          {!isOnline && (
            <div className="bg-red-500 text-white text-[10px] py-1 text-center font-bold flex items-center justify-center space-x-1 animate-pulse">
              <WifiOff className="w-3 h-3" />
              <span>{t("offlineMode")}</span>
            </div>
          )}

          {/* Top Header */}
          <header className="h-14 lg:h-16 bg-white dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/60 sticky top-0 flex items-center justify-between px-4 z-20 transition-colors duration-200">
            <div className="flex items-center space-x-2">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Branch selector */}
              <button
                onClick={() => router.push("/user/branch-select")}
                className="flex items-center space-x-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 py-1.5 px-2.5 rounded-lg border border-slate-200/50 dark:border-slate-700/60 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-accent" />
                <span className="truncate max-w-[90px] lg:max-w-[150px]">{branchName}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {/* Live */}
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
              <button onClick={toggleDarkMode} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              </button>
              <LanguageSwitcher />
              <button
                onClick={() => router.push("/user/notifications")}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 relative"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </button>
            </div>
          </header>

          {/* Main Content — extra bottom padding on mobile for bottom nav */}
          <main className="flex-grow p-4 lg:p-6 overflow-y-auto pb-24 lg:pb-6">
            {children}
          </main>
        </div>

        {/* ── Mobile Bottom Nav — lg:hidden ─────────────────────── */}
        <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/60 flex lg:hidden items-center justify-around z-30 px-2">
          {bottomNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <button
                key={idx}
                onClick={() => navTo(item.href)}
                className={`flex flex-col items-center justify-center w-14 h-12 transition-all duration-200 cursor-pointer ${isActive ? "text-accent scale-105" : "text-slate-400 dark:text-slate-500"}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
                <span className="text-[9px] font-bold mt-1 tracking-tight truncate max-w-[50px]">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center w-14 h-12 cursor-pointer ${showMoreMenu ? "text-accent scale-105" : "text-slate-400 dark:text-slate-500"}`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-1">{t("nav_more")}</span>
          </button>
        </nav>

        {/* ── More Menu Overlay — mobile only ─────────────────────── */}
        {showMoreMenu && (
          <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl z-40 p-5 shadow-2xl lg:hidden">
            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />
            <h3 className="font-heading font-bold text-sm text-slate-800 dark:text-white mb-4">
              {locale === "th" ? "เมนูเพิ่มเติม" : "More Menus"}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {moreMenuItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => navTo(item.href)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  >
                    <Icon className="w-5 h-5 text-accent mb-2" />
                    <span className="text-[10px] font-semibold text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-[10px] font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-semibold block">{user.name}</span>
                  <span className="text-[9px] text-slate-400 uppercase">{user.role}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="flex items-center space-x-1 text-xs font-bold text-red-500">
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
