// app/(seller)/seller/dashboard/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import {
  TrendingUp, DollarSign, ShoppingBag, Users, AlertTriangle,
  Building2, Package, Activity, ArrowUpRight, Clock, Wrench,
  RefreshCw, CheckCircle2, XCircle, Banknote, CreditCard,
  QrCode, CalendarClock
} from "lucide-react";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  lowStockItems: number;
  pendingJobs: number;
  todayRevenue: number;
  pendingAppointments: number;
  recentOrders: {
    id: string; orderNumber: string; customerName: string | null;
    sellerName: string; branchName: string; netAmount: number;
    status: string; paymentMethod: string; createdAt: string;
  }[];
  topProducts: {
    productId: string; name: string; brand: string | null;
    totalQuantity: number; totalRevenue: number;
  }[];
}

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  CASH: Banknote,
  QR_PROMPTPAY: QrCode,
  CREDIT_CARD: CreditCard,
  INSTALLMENT: CalendarClock,
};

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function SellerDashboard() {
  const { locale, formatCurrency } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">Dashboard</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 animate-pulse">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded mb-3 w-2/3" />
              <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600 dark:text-slate-400">{error}</p>
        <button onClick={loadStats} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover transition">
          ลองใหม่
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const summaryCards = [
    {
      label: locale === "th" ? "รายได้วันนี้" : "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
    },
    {
      label: locale === "th" ? "รายได้เดือนนี้" : "This Month Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      label: locale === "th" ? "ออเดอร์เดือนนี้" : "Orders This Month",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-900/20",
      border: "border-violet-200 dark:border-violet-800",
    },
    {
      label: locale === "th" ? "ลูกค้าทั้งหมด" : "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      sub: `+${stats.newCustomersThisMonth} ${locale === "th" ? "เดือนนี้" : "this month"}`,
      icon: Users,
      color: "text-cyan-600",
      bg: "bg-cyan-50 dark:bg-cyan-900/20",
      border: "border-cyan-200 dark:border-cyan-800",
    },
    {
      label: locale === "th" ? "สินค้าใกล้หมด" : "Low Stock Items",
      value: stats.lowStockItems.toLocaleString(),
      icon: AlertTriangle,
      color: stats.lowStockItems > 0 ? "text-amber-600" : "text-slate-400",
      bg: stats.lowStockItems > 0 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-slate-50 dark:bg-slate-800/30",
      border: stats.lowStockItems > 0 ? "border-amber-200 dark:border-amber-800" : "border-slate-200 dark:border-slate-800",
    },
    {
      label: locale === "th" ? "งานแล็บรอดำเนินการ" : "Pending Lab Jobs",
      value: stats.pendingJobs.toLocaleString(),
      icon: Wrench,
      color: stats.pendingJobs > 0 ? "text-orange-600" : "text-slate-400",
      bg: stats.pendingJobs > 0 ? "bg-orange-50 dark:bg-orange-900/20" : "bg-slate-50 dark:bg-slate-800/30",
      border: stats.pendingJobs > 0 ? "border-orange-200 dark:border-orange-800" : "border-slate-200 dark:border-slate-800",
    },
    {
      label: locale === "th" ? "นัดหมายรออยู่" : "Pending Appointments",
      value: stats.pendingAppointments.toLocaleString(),
      icon: Clock,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      border: "border-indigo-200 dark:border-indigo-800",
    },
    {
      label: locale === "th" ? "สถานะระบบ" : "System Status",
      value: "Online",
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
            {locale === "th" ? "ภาพรวมธุรกิจ" : "Business Overview"}
          </h2>
          {lastUpdated && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {locale === "th" ? "อัปเดตล่าสุด" : "Last updated"}: {lastUpdated.toLocaleTimeString("th-TH")}
              <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                ● Neon Live
              </span>
            </p>
          )}
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {locale === "th" ? "รีเฟรช" : "Refresh"}
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border ${card.border} hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">{card.label}</p>
                <div className={`p-1.5 rounded-xl ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className={`text-xl font-bold font-heading ${card.color}`}>{card.value}</p>
              {card.sub && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{card.sub}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Row: Recent Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders — Card (mobile) + Table (md+) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              {locale === "th" ? "ออเดอร์ล่าสุด" : "Recent Orders"}
            </h3>
            <span className="text-xs text-slate-400">5 รายการล่าสุด</span>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">ยังไม่มีออเดอร์</div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {stats.recentOrders.map((order) => {
                  const PayIcon = PAYMENT_ICONS[order.paymentMethod] || Banknote;
                  return (
                    <div key={order.id} className="px-4 py-3">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-mono font-bold text-xs text-accent">{order.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[order.status] || ""}`}>{order.status}</span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200">{order.customerName || <span className="italic text-slate-400">Walk-in</span>}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />{order.branchName}
                        </span>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">฿{order.netAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                      <th className="text-left px-4 py-3 font-semibold">เลขออเดอร์</th>
                      <th className="text-left px-4 py-3 font-semibold">ลูกค้า</th>
                      <th className="text-left px-4 py-3 font-semibold">สาขา</th>
                      <th className="text-right px-4 py-3 font-semibold">ยอด</th>
                      <th className="text-center px-4 py-3 font-semibold">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.recentOrders.map((order) => {
                      const PayIcon = PAYMENT_ICONS[order.paymentMethod] || Banknote;
                      return (
                        <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                          <td className="px-4 py-3 font-mono font-bold text-accent">{order.orderNumber}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                            {order.customerName || <span className="text-slate-400 italic">Walk-in</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{order.branchName}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">฿{order.netAmount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[order.status] || ""}`}>{order.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              {locale === "th" ? "สินค้าขายดี" : "Top Products"}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {stats.topProducts.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-6">ยังไม่มีข้อมูล</p>
            ) : (
              stats.topProducts.map((product, i) => (
                <div key={product.productId} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-[11px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{product.name}</p>
                    <p className="text-[10px] text-slate-400">{product.brand} · {product.totalQuantity} ชิ้น</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 shrink-0">
                    ฿{product.totalRevenue.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
