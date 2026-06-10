// app/(user)/user/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { db, dbHelper } from "@/lib/db-mock";
import {
  TrendingUp,
  ShoppingBag,
  Eye,
  Calendar,
  AlertTriangle,
  Award,
  ArrowRight,
  Sparkles,
  ClipboardList
} from "lucide-react";

export default function UserDashboard() {
  const router = useRouter();
  const { t, locale, formatCurrency } = useI18n();

  const [user, setUser] = useState<any>(null);
  const [shift, setShift] = useState<any>(null);
  const [personalSales, setPersonalSales] = useState(0);
  const [branchSales, setBranchSales] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("currentUser");
    let currentUser = storedUser ? JSON.parse(storedUser) : db.users[2]; // fallback to seller
    setUser(currentUser);

    // Get active shift
    const activeShift = dbHelper.getActiveShift(currentUser.id);
    setShift(activeShift);

    // Calculate personal sales today
    const personalOrders = db.orders.filter(
      (o) => o.sellerId === currentUser.id && o.status === "PAID"
    );
    const personalTotal = personalOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    setPersonalSales(personalTotal);

    // Calculate branch sales today
    const branchOrders = db.orders.filter(
      (o) => o.branchId === currentUser.branchId && o.status === "PAID"
    );
    const branchTotal = branchOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    setBranchSales(branchTotal);

    // Fetch low stock items for this branch
    const pWithStock = dbHelper.getProductsWithStock(currentUser.branchId || "b1");
    const lowStock = pWithStock.filter((p) => p.quantity <= p.minAlert);
    setLowStockProducts(lowStock);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Leaderboard data mock
  const branchLeaderboard = [
    { name: "คุณสมพร หน้าร้าน (คุณ)", amount: personalSales, count: 2, isMe: true },
    { name: "คุณนารี ดีใจ", amount: 15500, count: 3, isMe: false },
    { name: "คุณวิทยา เรียนไว", amount: 8400, count: 1, isMe: false }
  ].sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-3xl p-5 relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <Sparkles className="w-32 h-32" />
        </div>
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] uppercase font-bold text-accent tracking-widest">{t("appSubtitle")}</span>
          <h2 className="text-xl font-bold font-heading">{t("welcome")}, {user.name}</h2>
          <p className="text-xs text-slate-400">
            {shift 
              ? `${t("activeShift")}: ${t("shiftStatus_OPEN")} (${t("startingCash")} ${formatCurrency(shift.startingCash)})` 
              : `⚠️ ${t("noActiveShift")} - ${t("openShiftFirst")}`
            }
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/60 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
              {t("mySales")}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">
              {formatCurrency(personalSales)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/60 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
              {t("branchSales")}
            </span>
            <ShoppingBag className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">
              {formatCurrency(branchSales)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {locale === "th" ? "ทางลัดด่วน" : "Quick Actions"}
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => router.push("/user/pos")}
            className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 text-accent mb-1.5" />
            <span className="text-[9px] font-bold text-center leading-tight">{locale === "th" ? "ขาย POS" : "POS Sale"}</span>
          </button>
          
          <button
            onClick={() => router.push("/user/eyesight")}
            className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Eye className="w-5 h-5 text-indigo-500 mb-1.5" />
            <span className="text-[9px] font-bold text-center leading-tight">{locale === "th" ? "วัดสายตา" : "Eyesight"}</span>
          </button>

          <button
            onClick={() => router.push("/user/appointments")}
            className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Calendar className="w-5 h-5 text-emerald-500 mb-1.5" />
            <span className="text-[9px] font-bold text-center leading-tight">{locale === "th" ? "นัดหมาย" : "Appt"}</span>
          </button>

          <button
            onClick={() => router.push("/user/shift")}
            className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <ClipboardList className="w-5 h-5 text-amber-500 mb-1.5" />
            <span className="text-[9px] font-bold text-center leading-tight">{locale === "th" ? "กะ / ลิ้นชัก" : "Shift"}</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t("lowStockAlerts")}
            </h3>
          </div>
          <span className="text-[10px] font-bold bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
            {lowStockProducts.length}
          </span>
        </div>

        {lowStockProducts.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">{locale === "th" ? "สินค้าทุกรายการมีสต็อกเพียงพอ" : "All products in stock"}</p>
        ) : (
          <div className="space-y-2">
            {lowStockProducts.slice(0, 3).map((prod) => (
              <div key={prod.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-700/40 last:border-0">
                <div className="truncate max-w-[200px]">
                  <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">{prod.name}</p>
                  <span className="text-[9px] text-slate-400">{prod.code}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-red-500">
                    {locale === "th" ? `เหลือ ${prod.quantity} ชิ้น` : `${prod.quantity} left`}
                  </p>
                  <span className="text-[9px] text-slate-400">Min: {prod.minAlert}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center space-x-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {t("leaderboard")}
          </h3>
        </div>

        <div className="space-y-2">
          {branchLeaderboard.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded-xl border ${
                item.isMe 
                  ? "bg-accent/5 dark:bg-accent/10 border-accent/20" 
                  : "bg-slate-50 dark:bg-slate-800/50 border-transparent"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 w-4">#{idx + 1}</span>
                <span className="text-xs font-medium truncate max-w-[150px]">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(item.amount)}
                </span>
                <span className="block text-[8px] text-slate-400 leading-none mt-0.5">
                  {item.count} {locale === "th" ? "ออเดอร์" : "orders"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
