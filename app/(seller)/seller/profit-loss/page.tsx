// app/(seller)/seller/profit-loss/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { TrendingUp, TrendingDown, DollarSign, Package, ArrowUpRight, ArrowDownRight, Loader2, AlertCircle, Info } from "lucide-react";

const CAT_COLORS: Record<string, string> = {
  FRAME: "bg-blue-500", LENS: "bg-indigo-500", CONTACT_LENS: "bg-emerald-500",
  SUNGLASSES: "bg-amber-500", ACCESSORY: "bg-pink-500",
};

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const today = toDateStr(new Date());
const startOfCurrentMonth = toDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

export default function ProfitLossPage() {
  const { locale, formatCurrency } = useI18n();

  const [startDate, setStartDate] = useState(startOfCurrentMonth);
  const [endDate, setEndDate] = useState(today);

  const [revenueByCategory, setRevenueByCategory] = useState<any[]>([]);
  const [revenueByBranch, setRevenueByBranch] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/reports?startDate=${startDate}&endDate=${endDate}`, { credentials: "include" })
      .then(r => {
        if (!r.ok) throw new Error(`Reports API error: ${r.status}`);
        return r.json();
      })
      .then(data => {
        setRevenueByCategory(data.data?.revenueByCategory || []);
        setRevenueByBranch(data.data?.revenueByBranch || []);
        setTotalRevenue(data.data?.revenueByDay?.reduce((s: number, d: any) => s + d.revenue, 0) || 0);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  // Estimated COGS = 40% of revenue; Gross = 60% (labeled as estimated)
  const estimatedCogs = totalRevenue * 0.4;
  const grossProfit = totalRevenue * 0.6;
  const grossMargin = totalRevenue > 0 ? 60 : 0;

  // Month shortcuts
  const now = new Date();
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    return {
      label: d.toLocaleDateString("th-TH", { month: "short", year: "numeric" }),
      start: toDateStr(d),
      end: toDateStr(end),
    };
  }).reverse();

  const summaryCards = [
    {
      label: locale === "th" ? "รายได้รวม" : "Revenue",
      value: totalRevenue,
      isMargin: false,
      icon: DollarSign,
      color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/20",
      estimated: false,
    },
    {
      label: locale === "th" ? "ต้นทุนสินค้า (COGS)" : "COGS (Est.)",
      value: estimatedCogs,
      isMargin: false,
      icon: Package,
      color: "text-red-500 bg-red-100 dark:bg-red-950/20",
      estimated: true,
      inverse: true,
    },
    {
      label: locale === "th" ? "กำไรขั้นต้น (ประมาณ)" : "Gross Profit (Est.)",
      value: grossProfit,
      isMargin: false,
      icon: TrendingUp,
      color: "text-accent bg-accent/10",
      estimated: true,
    },
    {
      label: locale === "th" ? "อัตรากำไร% (ประมาณ)" : "Gross Margin (Est.)",
      value: null,
      margin: grossMargin,
      isMargin: true,
      icon: TrendingUp,
      color: "text-indigo-500 bg-indigo-100 dark:bg-indigo-950/20",
      estimated: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {locale === "th" ? "รายงานกำไร-ขาดทุน" : "Profit & Loss Statement"}
          </h2>
          <p className="text-xs text-slate-500">
            {locale === "th" ? "รายได้ ต้นทุน และกำไรขั้นต้น" : "Revenue, COGS, and gross profit analysis"}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {/* Month shortcuts */}
          <div className="flex gap-1.5 flex-wrap justify-end">
            {monthOptions.map(m => (
              <button
                key={m.start}
                onClick={() => { setStartDate(m.start); setEndDate(m.end); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  startDate === m.start && endDate === m.end
                    ? "bg-accent border-accent text-white"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {/* Custom date range */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <label className="font-semibold">{locale === "th" ? "จาก" : "From"}</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <label className="font-semibold">{locale === "th" ? "ถึง" : "To"}</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      {/* Estimated data notice */}
      <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-600 dark:text-blue-400 text-xs">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          {locale === "th"
            ? "COGS และกำไรขั้นต้นเป็นค่าประมาณการ โดยคำนวณจากอัตราต้นทุน 40% (Revenue × 0.4) เนื่องจากข้อมูลต้นทุนจริงยังไม่พร้อมใช้งาน"
            : "COGS and Gross Profit are estimates calculated at a 40% cost ratio (Revenue × 0.4) as full cost data is not yet available from the reports API."}
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.color}`}>
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-7 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            ) : (
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {c.isMargin ? `${c.margin?.toFixed(1)}%` : formatCurrency(c.value ?? 0)}
              </p>
            )}
            {c.estimated && !loading && (
              <span className="text-[9px] text-slate-400 italic">
                {locale === "th" ? "ค่าประมาณการ" : "Estimated"}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {locale === "th" ? "กำไรแยกตามหมวดสินค้า" : "Profit by Category"}
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">{locale === "th" ? "กำลังโหลด..." : "Loading..."}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {revenueByCategory.sort((a: any, b: any) => b.revenue - a.revenue).map((cat: any) => {
                const revenue = cat.revenue ?? 0;
                // Estimate per-category gross at 60%
                const gross = revenue * 0.6;
                const pct = totalRevenue > 0 ? (revenue / totalRevenue * 100) : 0;
                const catKey = cat.category ?? cat.name ?? "OTHER";
                return (
                  <div key={catKey} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{catKey}</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(gross)}</span>
                        <span className="text-slate-400 ml-1">(60% est.)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${CAT_COLORS[catKey] || "bg-slate-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{locale === "th" ? "รายได้:" : "Rev:"} {formatCurrency(revenue)}</span>
                      <span>{locale === "th" ? "ต้นทุน (ประมาณ):" : "COGS (est.):"} {formatCurrency(revenue * 0.4)}</span>
                    </div>
                  </div>
                );
              })}
              {revenueByCategory.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">{locale === "th" ? "ไม่มีข้อมูลในช่วงนี้" : "No data for this period"}</p>
              )}
            </div>
          )}
        </div>

        {/* Branch P&L */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {locale === "th" ? "กำไรแยกตามสาขา" : "Profit by Branch"}
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">{locale === "th" ? "กำลังโหลด..." : "Loading..."}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {revenueByBranch.map((b: any) => {
                const revenue = b.revenue ?? b.totalRevenue ?? 0;
                const gross = revenue * 0.6;
                const cogs = revenue * 0.4;
                const margin = 60;
                return (
                  <div key={b.branchId ?? b.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{b.branchName ?? b.name}</span>
                      <span className={`text-xs font-bold ${gross >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {formatCurrency(gross)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500">
                      <div><span className="block text-[9px] uppercase">Revenue</span>{formatCurrency(revenue)}</div>
                      <div><span className="block text-[9px] uppercase">COGS (est.)</span>{formatCurrency(cogs)}</div>
                      <div><span className="block text-[9px] uppercase">Margin</span>{margin.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
              {revenueByBranch.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">{locale === "th" ? "ไม่มีข้อมูลในช่วงนี้" : "No data for this period"}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
