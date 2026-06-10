// app/(seller)/seller/branch-comparison/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Building2, Trophy, TrendingUp, Users, Package, AlertTriangle, ShoppingBag, Loader2 } from "lucide-react";

type Range = "week" | "month" | "30days";
const RANGE_LABEL: Record<Range, string> = { week: "7 วัน", month: "เดือนนี้", "30days": "30 วัน" };
const BRANCH_COLORS = ["bg-accent", "bg-indigo-500", "bg-emerald-500"];

interface BranchRevenueItem {
  branchId: string;
  branchName: string;
  revenue: number;
  orderCount: number;
}

interface BranchInfo {
  id: string;
  name: string;
  code: string;
}

interface BranchStat {
  branchId: string;
  branchName: string;
  code: string;
  revenue: number;
  orderCount: number;
  avgOrder: number;
  color: string;
}

function getDateRange(range: Range): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start: string;
  if (range === "week") {
    const s = new Date(now); s.setDate(now.getDate() - 7);
    start = s.toISOString().split("T")[0];
  } else if (range === "month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    start = s.toISOString().split("T")[0];
  } else {
    const s = new Date(now); s.setDate(now.getDate() - 30);
    start = s.toISOString().split("T")[0];
  }
  return { start, end };
}

export default function BranchComparisonPage() {
  const { locale, formatCurrency } = useI18n();
  const [range, setRange] = useState<Range>("month");
  const [branchData, setBranchData] = useState<BranchStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const { start, end } = getDateRange(range);

    Promise.all([
      fetch(`/api/reports?startDate=${start}&endDate=${end}`, { credentials: "include" }).then(r => {
        if (!r.ok) throw new Error(`Reports API error ${r.status}`);
        return r.json();
      }),
      fetch("/api/branches", { credentials: "include" }).then(r => {
        if (!r.ok) throw new Error(`Branches API error ${r.status}`);
        return r.json();
      }),
    ])
      .then(([reportData, branchesData]) => {
        const revenueByBranch: BranchRevenueItem[] = reportData.data?.revenueByBranch || [];
        const branches: BranchInfo[] = branchesData.data || branchesData || [];

        const stats: BranchStat[] = revenueByBranch.map((item, idx) => {
          const branchInfo = branches.find((b: BranchInfo) => b.id === item.branchId);
          return {
            branchId: item.branchId,
            branchName: item.branchName || branchInfo?.name || item.branchId,
            code: branchInfo?.code || item.branchId.slice(0, 4).toUpperCase(),
            revenue: item.revenue,
            orderCount: item.orderCount,
            avgOrder: item.orderCount ? item.revenue / item.orderCount : 0,
            color: BRANCH_COLORS[idx % BRANCH_COLORS.length],
          };
        });

        // Add any branches with no data
        branches.forEach((b: BranchInfo, idx: number) => {
          if (!stats.find(s => s.branchId === b.id)) {
            stats.push({
              branchId: b.id,
              branchName: b.name,
              code: b.code,
              revenue: 0,
              orderCount: 0,
              avgOrder: 0,
              color: BRANCH_COLORS[(revenueByBranch.length + idx) % BRANCH_COLORS.length],
            });
          }
        });

        setBranchData(stats);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [range]);

  const maxRevenue = Math.max(...branchData.map(b => b.revenue), 1);
  const maxOrders = Math.max(...branchData.map(b => b.orderCount), 1);
  const maxAvg = Math.max(...branchData.map(b => b.avgOrder), 1);

  const winnerId = (key: keyof BranchStat, low = false) => {
    if (branchData.length === 0) return null;
    const vals = branchData.map(b => b[key] as number);
    const target = low ? Math.min(...vals) : Math.max(...vals);
    return branchData.find(b => (b[key] as number) === target)?.branchId ?? null;
  };

  const METRICS = [
    { key: "revenue" as const, label: locale === "th" ? "รายได้สุทธิ" : "Net Revenue", format: (v: number) => formatCurrency(v), max: maxRevenue, icon: TrendingUp },
    { key: "orderCount" as const, label: locale === "th" ? "จำนวนออเดอร์" : "Orders", format: (v: number) => `${v}`, max: maxOrders, icon: ShoppingBag },
    { key: "avgOrder" as const, label: locale === "th" ? "เฉลี่ย/ออเดอร์" : "Avg/Order", format: (v: number) => formatCurrency(v), max: maxAvg, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {locale === "th" ? "เปรียบเทียบผลประกอบการรายสาขา" : "Branch Performance Comparison"}
          </h2>
          <p className="text-xs text-slate-500">{locale === "th" ? "วิเคราะห์และเปรียบเทียบ KPI ระหว่างสาขา" : "Side-by-side KPI analysis across all branches"}</p>
        </div>
        <div className="flex gap-1.5">
          {(["week", "month", "30days"] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                range === r ? "bg-accent border-accent text-white" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500"}`}>
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="ml-3 text-sm text-slate-500">{locale === "th" ? "กำลังโหลด..." : "Loading..."}</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-6 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">{locale === "th" ? "เกิดข้อผิดพลาด" : "Error loading data"}</p>
          <p className="text-xs text-red-500">{error}</p>
          <button onClick={() => setRange(range)} className="text-xs font-bold text-red-600 underline mt-2 cursor-pointer">
            {locale === "th" ? "ลองอีกครั้ง" : "Retry"}
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {branchData.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-2xl text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">{locale === "th" ? "ไม่มีข้อมูลสาขา" : "No branch data available"}</p>
            </div>
          ) : (
            <>
              {/* Branch Headers */}
              <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${branchData.length}, minmax(0, 1fr))` }}>
                {branchData.map(b => (
                  <div key={b.branchId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm text-center space-y-2">
                    <div className={`w-10 h-10 ${b.color} rounded-xl flex items-center justify-center mx-auto`}>
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{b.branchName}</p>
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold">{b.code}</span>
                    </div>
                    {/* Winner badge for revenue */}
                    {b.branchId === winnerId("revenue") && b.revenue > 0 && (
                      <div className="flex items-center justify-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">{locale === "th" ? "รายได้สูงสุด" : "Top Revenue"}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Metrics Comparison */}
              <div className="space-y-4">
                {METRICS.map(m => {
                  const winId = winnerId(m.key);
                  return (
                    <div key={m.key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <m.icon className="w-4 h-4 text-accent" />
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{m.label}</h3>
                      </div>
                      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${branchData.length}, minmax(0, 1fr))` }}>
                        {branchData.map(b => {
                          const val = b[m.key] as number;
                          const pct = m.max ? (val / m.max) * 100 : 0;
                          const isWinner = b.branchId === winId && val > 0;
                          return (
                            <div key={b.branchId} className={`space-y-2 p-3 rounded-xl ${isWinner ? "bg-accent/5 dark:bg-accent/10 border border-accent/20" : "bg-slate-50 dark:bg-slate-800/50"}`}>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-500 truncate">{b.code}</span>
                                {isWinner && <Trophy className="w-3 h-3 text-amber-500 shrink-0" />}
                              </div>
                              <p className="text-sm font-extrabold text-slate-900 dark:text-white">{m.format(val)}</p>
                              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                                <div className={`h-full rounded-full ${b.color} transition-all duration-500`} style={{ width: `${Math.max(pct, val > 0 ? 2 : 0)}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Revenue Summary */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent" />
                  {locale === "th" ? "สรุปรายได้รายสาขา" : "Revenue Summary per Branch"}
                </h3>
                <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${branchData.length}, minmax(0, 1fr))` }}>
                  {branchData.map(b => (
                    <div key={b.branchId} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">{b.code}</p>
                      <p className="text-xs font-extrabold text-accent">{formatCurrency(b.revenue)}</p>
                      <p className="text-[10px] text-slate-400">{b.orderCount} {locale === "th" ? "ออเดอร์" : "orders"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
