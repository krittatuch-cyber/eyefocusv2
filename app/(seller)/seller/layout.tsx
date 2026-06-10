// app/(seller)/seller/layout.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import LanguageSwitcher from "@/components/shared/language-switcher";
import TrialBanner from "@/components/shared/trial-banner";
import { getNavPermissions, ROLE_INFO } from "@/lib/permissions";
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Users,
  ShieldCheck,
  Package,
  Tags,
  Truck,
  Database,
  Briefcase,
  UserSquare2,
  Settings,
  TrendingUp,
  LineChart,
  Receipt,
  Award,
  Columns2,
  FileText,
  DollarSign,
  History,
  LogOut,
  Moon,
  Sun,
  Menu,
  Zap,
  ClipboardList,
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

const SELLER_ALLOWED = ["OWNER", "MANAGER", "OD", "OPTICIAN", "SALES", "CASHIER", "SELLER"];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useI18n();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Auth: Try real JWT first, fallback to sessionStorage ─────────────────
  const loadUser = useCallback(async () => {
    // 1. Try real API auth (JWT cookie)
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        // Normalize roles array
        if (!data.roles || !Array.isArray(data.roles) || data.roles.length === 0) {
          data.roles = [data.role];
        }
        if (!data.roles.some((r: string) => SELLER_ALLOWED.includes(r))) {
          router.push("/login");
          return;
        }
        setUser(data);
        // Update sessionStorage cache
        sessionStorage.setItem("currentUser", JSON.stringify(data));
        setAuthLoading(false);
        return;
      }
    } catch {
      // API not available, fall through to sessionStorage
    }

    // 2. Fallback to sessionStorage (demo/mock mode)
    const storedUser = sessionStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        // Normalize roles array
        if (!parsedUser.roles || !Array.isArray(parsedUser.roles) || parsedUser.roles.length === 0) {
          parsedUser.roles = [parsedUser.role];
        }
        if (!parsedUser.roles.some((r: string) => SELLER_ALLOWED.includes(r))) {
          router.push("/login");
          return;
        }
        setUser(parsedUser);
        setAuthLoading(false);
        return;
      } catch {
        // Invalid stored user
      }
    }

    // 3. No auth found → redirect to login
    router.push("/login");
  }, [router]);

  useEffect(() => {
    loadUser();
    // Read saved theme from localStorage
    try {
      const saved = localStorage.getItem('eyefocus_theme');
      const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch { /* ignore */ }
  }, [loadUser]);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    try { localStorage.setItem('eyefocus_theme', nextDark ? 'dark' : 'light'); } catch { /* ignore */ }
    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  };

  const handleLogout = async () => {
    // Clear JWT cookie via API
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    }
    // Clear sessionStorage
    sessionStorage.removeItem("currentUser");
    router.push("/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }


  if (!user) return null;

  // Nav Permissions
  type NavPerms = ReturnType<typeof getNavPermissions>;
  const navPerms: NavPerms = getNavPermissions(user.roles);

  // Nav Groups with permission filtering
  type NavEntry =
    | { label: string; href: string; icon: React.ElementType; show: boolean; group?: never; separator?: never }
    | { group: string; show: boolean; label?: never; separator?: never }
    | { separator: true; show: boolean; label?: never; group?: never };

  const rawNavItems: NavEntry[] = [
    // -- Overview --
    { group: "ภาพรวม",            show: !!(navPerms.dashboard || navPerms.reports) },
    { label: t("menu_dashboard"),       href: "/seller/dashboard",        icon: LayoutDashboard, show: !!navPerms.dashboard },
    { label: t("menu_reports"),          href: "/seller/reports",           icon: BarChart3,       show: !!navPerms.reports },

    // -- Management --
    { separator: true,                                                     show: !!(navPerms.users || navPerms.settings) },
    { group: "จัดการร้าน",          show: !!(navPerms.users || navPerms.settings) },
    { label: t("menu_branches"),         href: "/seller/branches",          icon: Building2,       show: !!navPerms.settings },
    { label: t("menu_users"),            href: "/seller/users",             icon: Users,           show: !!navPerms.users },
    { label: t("menu_roles"),            href: "/seller/roles",             icon: ShieldCheck,     show: !!navPerms.users },
    { label: t("menu_settings"),         href: "/seller/settings",          icon: Settings,        show: !!navPerms.settings },
    // -- Products --
    { separator: true,                                                     show: !!(navPerms.products || navPerms.labVendors) },
    { group: "สินค้าและสต็อก",      show: !!(navPerms.products || navPerms.labVendors) },
    { label: t("menu_products"),         href: "/seller/products",          icon: Package,         show: !!navPerms.products },
    { label: t("menu_stocks"),           href: "/seller/products/stocks",   icon: Database,        show: !!navPerms.stocks },
    { label: t("menu_suppliers"),        href: "/seller/suppliers",         icon: Truck,           show: !!navPerms.settings },
    { label: t("menu_labVendors"),       href: "/seller/lab-vendors",       icon: Briefcase,       show: !!navPerms.labVendors },
    // -- Customers --
    { separator: true,                                                     show: !!navPerms.customers },
    { group: "ลูกค้าและบริการ",     show: !!navPerms.customers },
    { label: t("menu_customers"),        href: "/seller/customers",         icon: UserSquare2,     show: !!navPerms.customers },
    { label: t("menu_loyalty"),          href: "/seller/loyalty",           icon: Tags,            show: !!navPerms.loyalty },
    { label: t("menu_recall"),           href: "/seller/recall",            icon: History,         show: !!navPerms.recall },
    // -- Finance --
    { separator: true,                                                     show: !!(navPerms.commission || navPerms.reports || navPerms.taxInvoices) },
    { group: "การเงินและรายงาน",    show: !!(navPerms.commission || navPerms.reports || navPerms.taxInvoices) },
    { label: t("menu_profitLoss"),       href: "/seller/profit-loss",       icon: TrendingUp,      show: !!navPerms.reports },
    { label: t("menu_commission"),       href: "/seller/commission",        icon: Award,           show: !!navPerms.commission },
    { label: t("menu_branchComparison"), href: "/seller/branch-comparison", icon: Columns2,        show: !!navPerms.reports },
    { label: t("menu_salesForecast"),    href: "/seller/sales-forecast",    icon: LineChart,       show: !!navPerms.reports },
    { label: t("menu_taxInvoices"),      href: "/seller/tax-invoices",      icon: Receipt,         show: !!navPerms.taxInvoices },
    { label: t("menu_changelog"),        href: "/seller/changelog",         icon: ClipboardList,   show: !!navPerms.auditLogs },
    // -- Subscription --
    { separator: true,                                                     show: !!navPerms.subscription },
    { label: "แผนการใช้งาน",             href: "/seller/subscription",      icon: Zap,             show: !!navPerms.subscription },
  ];

  // Filter hidden items, collapse consecutive separators
  const visibleItems = rawNavItems.filter(item => item.show !== false);
  const navItems = visibleItems.filter((item, idx) => {
    if (!item.separator && !item.group) return true;
    if (item.group) {
      const nextVisible = visibleItems.slice(idx + 1).find(i => !i.separator && !i.group);
      return !!nextVisible;
    }
    // separator
    const nextVisible = visibleItems.slice(idx + 1).find(i => !i.separator);
    const prevItem = visibleItems[idx - 1];
    if (!nextVisible) return false;
    if (prevItem?.separator) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      
      {/* 1. Sidebar - Fixed 280px Desktop */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
        {/* Brand Header */}
        <div className="p-5 flex items-center space-x-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-extrabold">
            EF
          </div>
          <div>
            <h1 className="font-heading font-bold text-white text-base tracking-wider leading-none">EYE FOCUS</h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">SaaS Management</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-grow p-4 overflow-y-auto space-y-0.5 scrollbar-thin">
          {navItems.map((item, idx) => {
            if (item.separator) {
              return <div key={idx} className="h-px bg-slate-800/60 my-2" />;
            }
            if (item.group) {
              return (
                <p key={idx} className="px-3 pt-3 pb-1 text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-600">
                  {item.group}
                </p>
              );
            }
            if (!("icon" in item)) return null;
            const Icon = (item as { icon: React.ElementType }).icon;
            // Active if exact match OR starts with href (for nested pages like /products/stocks)
            // Dashboard: exact match; all others: startsWith (handles nested routes)
            const isActive = item.href === "/seller/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href!);
            return (
              <button
                key={idx}
                onClick={() => router.push(item.href!)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition duration-150 cursor-pointer ${
                  isActive
                    ? "bg-accent/15 text-accent font-semibold border border-accent/20"
                    : "hover:bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-accent" : "text-slate-500"}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="truncate w-[130px]">
              <p className="text-xs font-semibold text-white truncate leading-tight">{user.name}</p>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{t(`role_${user.role}` as any)}</span>
              {/* Role badges for all assigned roles */}
              <div className="flex flex-wrap gap-1 mt-1">
                {user.roles.map(r => {
                  const info = ROLE_INFO[r];
                  return info ? (
                    <span
                      key={r}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${info.bgColor} ${info.color}`}
                    >
                      {info.labelEn}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800/50 rounded-xl transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. Main Page Wrapper */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-10">
          
          {/* Mobile Menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="ml-3 font-heading font-bold text-slate-800 dark:text-white">EYE FOCUS</span>
          </div>

          {/* Page Indicator (Desktop) */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-medium text-slate-500">
            <span>SaaS Admin Portal</span>
            <span>/</span>
            <span className="text-slate-800 dark:text-white capitalize">
              {pathname?.split("/").pop() || "Dashboard"}
            </span>
          </div>

          {/* Quick Info & Controls */}
          <div className="flex items-center space-x-4">
            {/* Auth mode indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Neon DB
            </div>

            {/* Theme switcher */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Branch / Role indicator */}
            <div className="hidden md:flex items-center space-x-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-accent" />
              <span>{user.roles.includes("OWNER") ? (locale === "th" ? "ทุกสาขา" : "All Branches") : (locale === "th" ? "สาขาของฉัน" : "My Branch")}</span>
            </div>
          </div>
        </header>

        {/* Trial / Suspension Banner */}
        <TrialBanner />

        {/* Scrollable Content Pane */}
        <main className="flex-grow p-6 overflow-y-auto max-w-7xl w-full mx-auto pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav — lg:hidden */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex lg:hidden items-center justify-around z-40 px-1">
        {navItems
          .filter(i => !i.separator)
          .slice(0, 4)
          .map((item, idx) => {
            if (!("icon" in item)) return null;
            const Icon = (item as { icon: React.ElementType }).icon;
            const isActive = pathname === item.href;
            return (
              <button
                key={idx}
                onClick={() => router.push(item.href!)}
                className={`flex flex-col items-center justify-center min-w-[52px] h-12 px-1 transition-all duration-150 cursor-pointer rounded-xl ${
                  isActive ? "text-accent" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
                <span className="text-[9px] font-bold mt-0.5 leading-tight truncate max-w-[52px] text-center">{item.label}</span>
              </button>
            );
          })}
        {/* More — opens drawer */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center min-w-[52px] h-12 px-1 text-slate-400 dark:text-slate-500 cursor-pointer rounded-xl"
        >
          <Menu className="w-5 h-5 stroke-2" />
          <span className="text-[9px] font-bold mt-0.5">เพิ่มเติม</span>
        </button>
      </nav>

      {/* 3. Mobile Navigation Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Drawer Content */}
          <div className="relative w-[280px] bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl">
            <div className="p-5 flex items-center justify-between border-b border-slate-800">
              <span className="font-heading font-bold text-white text-base">EYE FOCUS</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            
            <nav className="flex-grow p-4 overflow-y-auto space-y-1">
              {navItems.map((item, idx) => {
                if (item.separator) return <hr key={idx} className="border-slate-800/80 my-3" />;
                if (!("icon" in item)) return null;
            const Icon = (item as { icon: React.ElementType }).icon;
                const isActive = pathname === item.href;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      router.push(item.href!);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer ${
                      isActive ? "bg-accent text-white font-semibold" : "hover:bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <span className="text-xs text-white truncate max-w-[150px] block">{user.name}</span>
                {/* Role badges in mobile drawer too */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.roles.map(r => {
                    const info = ROLE_INFO[r];
                    return info ? (
                      <span
                        key={r}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${info.bgColor} ${info.color}`}
                      >
                        {info.labelEn}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-red-400 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
