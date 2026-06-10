// app/(seller)/seller/reports/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n-context";
import { BarChart2, TrendingUp, ShoppingBag, DollarSign, Award, Building2, Users, Loader2, AlertTriangle } from "lucide-react";

type Range = "today" | "week" | "month" | "30days";

const RANGE_LABELS: Record<Range, string> = {
  today: "วันนี้", week: "7 วัน", month: "เดือนนี้", "30days": "30 วัน",
};
const PAY_LABEL: Record<string, string> = {
  CASH: "เงินสด", QR_PROMPTPAY: "พร้อมเพย์", CREDIT_CARD: "บัตรเครดิต", INSTALLMENT: "ผ่อนชำระ",
};

function getRangeDates(range: Range): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start: string;
  if (range === "today") {
    start = end;
  } else if (range === "week") {
    const s = new Date(now); s.setDate(now.getDate() - 7);
    start = s.toISOString().split("T")[0];
  } else if (range === "month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    start = s.toISOString().split("T")[0];
  } else {
    const s = new Date(now); s.setDate(now.getDate() - 30);
    start = s.toISOString().split("T")[0];
  }
  return { startDate: start, endDate: end };
}

interface RevenueByBranchItem {
  branchId: string;
  branchName: string;
  revenue: number;
  orderCount: number;
}

interface RevenueByPaymentItem {
  method: string;
  revenue: number;
  count: number;
}

interface TopProductItem {
  productId: string;
  name: string;
  revenue: number;
  quantity: number;
}

interface StaffLeaderItem {
  userId: string;
  name: string;
  revenue: number;
  orderCount: number;
}

interface RevenueByCategoryItem {
  category: string;
  revenue: number;
}

interface ReportData {
  revenueByDay?: { date: string; revenue: number; orderCount: number }[];
  revenueByBranch?: RevenueByBranchItem[];
  revenueByPaymentMethod?: RevenueByPaymentItem[];
  revenueByCategory?: RevenueByCategoryItem[];
  topProducts?: TopProductItem[];
  staffLeaderboard?: StaffLeaderItem[];
}

export default function ReportsPage() {
  const { locale, formatCurrency } = useI18n();
  const [range, setRange] = useState<Range>("month");
  const [branchFilter, setBranchFilter] = useState("");
  const [reportData, setReportData] = useState<ReportData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(() => getRangeDates(range), [range]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ startDate, endDate });
    if (branchFilter) params.set("branchId", branchFilter);

    fetch(`/api/reports?${params}`, { credentials: "include" })
      .then(r => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then(data => setReportData(data.data || {}))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [startDate, endDate, branchFilter]);

  // Derived values
  const totalRevenue = useMemo(
    () => (reportData.revenueByDay || []).reduce((s, d) => s + d.revenue, 0),
    [reportData],
  );
  const totalOrders = useMemo(
    () => (reportData.revenueByDay || []).reduce((s, d) => s + d.orderCount, 0),
    [reportData],
  );
  const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;

  const bestCat = useMemo(() => {
    const cats = reportData.revenueByCategory || [];
    return cats.sort((a, b) => b.revenue - a.revenue)[0]?.category || "—";
  }, [reportData]);

  const payBreakdown = useMemo(() => {
    const methods = reportData.revenueByPaymentMethod || [];
    return methods
      .map(pm => ({
        method: pm.method,
        label: PAY_LABEL[pm.method] || pm.method,
        revenue: pm.revenue,
        count: pm.count,
        pct: totalRevenue ? Math.round((pm.revenue / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [reportData, totalRevenue]);

  const branchStats = useMemo(() => {
    return (reportData.revenueByBranch || [])
      .map(b => ({
        ...b,
        avg: b.orderCount ? b.revenue / b.orderCount : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [reportData]);

  const topProducts = useMemo(
    () => (reportData.topProducts || []).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    [reportData],
  );

  const staffLeader = useMemo(
    () => (reportData.staffLeaderboard || []).sort((a, b) => b.revenue - a.revenue),
    [reportData],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {locale === "th" ? "รายงานยอดขายและผลการดำเนินงาน" : "Sales Reports & Analytics"}
          </h2>
          <p className="text-xs text-slate-500">{locale === "th" ? "วิเคราะห์ยอดขาย รายสาขา และประสิทธิภาพพนักงาน" : "Analyze cross-branch sales, products, and staff performance"}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["today", "week", "month", "30days"] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                range === r ? "bg-accent border-accent text-white" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500"}`}>
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Date range display */}
      <p className="text-[11px] text-slate-400 -mt-2">
        {startDate === endDate
          ? startDate
          : `${startDate} — ${endDate}`}
      </p>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="ml-3 text-sm text-slate-500">{locale === "th" ? "กำลังโหลดรายงาน..." : "Loading report..."}</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-8 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">{locale === "th" ? "เกิดข้อผิดพลาด" : "Failed to load report"}</p>
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={() => setRange(range)}
            className="mt-2 px-4 py-1.5 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition cursor-pointer">
            {locale === "th" ? "ลองอีกครั้ง" : "Retry"}
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: locale === "th" ? "รายได้สุทธิ" : "Net Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/20" },
              { label: locale === "th" ? "จำนวนออเดอร์" : "Orders", value: `${totalOrders} ${locale === "th" ? "รายการ" : "orders"}`, icon: ShoppingBag, color: "text-accent bg-accent/10" },
              { label: locale === "th" ? "เฉลี่ย/ออเดอร์" : "Avg / Order", value: formatCurrency(avgOrder), icon: TrendingUp, color: "text-indigo-500 bg-indigo-100 dark:bg-indigo-950/20" },
              { label: locale === "th" ? "หมวดขายดี" : "Best Category", value: bestCat, icon: Award, color: "text-amber-500 bg-amber-100 dark:bg-amber-950/20" },
            ].map((c, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{c.label}</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight truncate">{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Method Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {locale === "th" ? "ช่องทางการชำระเงิน" : "Payment Methods"}
              </h3>
              {payBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">{locale === "th" ? "ไม่มีข้อมูล" : "No data"}</p>
              ) : (
                <div className="space-y-3">
                  {payBreakdown.map(p => (
                    <div key={p.method} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{p.label}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(p.revenue)} <span className="text-slate-400 font-normal">({p.pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${p.pct}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400">{p.count} {locale === "th" ? "ออเดอร์" : "orders"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {locale === "th" ? "สินค้าขายดีสูงสุด" : "Top Products"}
              </h3>
              {topProducts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">{locale === "th" ? "ไม่มีข้อมูล" : "No data"}</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, i) => {
                    const maxRev = topProducts[0].revenue;
                    return (
                      <div key={p.productId} className="space-y-1">
                        <div className="flex justify-between items-start text-xs">
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">{p.name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(p.revenue)}</p>
                            <span className="text-[10px] text-slate-400">{p.quantity} {locale === "th" ? "ชิ้น" : "pcs"}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${maxRev ? (p.revenue / maxRev) * 100 : 0}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Branch Performance */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-accent" />
              {locale === "th" ? "ผลประกอบการแต่ละสาขา" : "Branch Performance"}
            </h3>
            {branchStats.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">{locale === "th" ? "ไม่มีข้อมูลสาขา" : "No branch data"}</p>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-2">
                  {branchStats.map((b, i) => (
                    <div key={b.branchId} className={`p-3 rounded-xl border ${
                      i === 0 && b.revenue > 0
                        ? "bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40"
                        : "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800"
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">
                            {b.branchName}
                            {i === 0 && b.revenue > 0 && (
                              <span className="ml-1.5 text-[9px] bg-amber-100 dark:bg-amber-950/30 text-amber-600 px-1.5 py-0.5 rounded font-bold">TOP</span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{b.orderCount} {locale === "th" ? "ออเดอร์" : "orders"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-accent">{formatCurrency(b.revenue)}</p>
                          <p className="text-[10px] text-slate-400">{locale === "th" ? "เฉลี่ย" : "avg"} {formatCurrency(b.avg)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/80">
                        <th className="py-2 text-left">{locale === "th" ? "สาขา" : "Branch"}</th>
                        <th className="py-2 text-right">{locale === "th" ? "รายได้" : "Revenue"}</th>
                        <th className="py-2 text-center">{locale === "th" ? "ออเดอร์" : "Orders"}</th>
                        <th className="py-2 text-right">{locale === "th" ? "เฉลี่ย/รายการ" : "Avg/Order"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {branchStats.map((b, i) => (
                        <tr key={b.branchId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 font-semibold text-slate-900 dark:text-white">
                            {b.branchName}
                            {i === 0 && b.revenue > 0 && (
                              <span className="ml-1.5 text-[9px] bg-amber-100 dark:bg-amber-950/30 text-amber-600 px-1.5 py-0.5 rounded font-bold">TOP</span>
                            )}
                          </td>
                          <td className="py-3 text-right font-bold text-accent">{formatCurrency(b.revenue)}</td>
                          <td className="py-3 text-center">{b.orderCount}</td>
                          <td className="py-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(b.avg)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Staff Leaderboard */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              {locale === "th" ? "อันดับยอดขายพนักงาน" : "Staff Sales Leaderboard"}
            </h3>
            <div className="space-y-2">
              {staffLeader.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">{locale === "th" ? "ไม่มีข้อมูล" : "No data"}</p>
              ) : (
                staffLeader.map((s, i) => (
                  <div key={s.userId} className={`flex items-center justify-between p-3 rounded-xl border ${
                    i === 0 ? "bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40" : "bg-slate-50 dark:bg-slate-800/30 border-transparent"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-extrabold w-5 ${i === 0 ? "text-amber-500" : "text-slate-400"}`}>#{i + 1}</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(s.revenue)}</p>
                      <span className="text-[10px] text-slate-400">{s.orderCount} {locale === "th" ? "ออเดอร์" : "orders"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
