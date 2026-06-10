// app/(seller)/seller/sales-forecast/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { TrendingUp, TrendingDown, BarChart2, ArrowUpRight, Loader2, AlertTriangle } from "lucide-react";

interface DayRevenue {
  date: string;
  revenue: number;
  orderCount: number;
}

interface MonthData {
  key: string;
  revenue: number;
  orders: number;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string, locale: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "short", year: "2-digit" });
}

function groupByMonth(byDay: DayRevenue[]): MonthData[] {
  const map: Record<string, { revenue: number; orders: number }> = {};

  // Ensure last 6 months always appear
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthKey(d.toISOString());
    if (!map[key]) map[key] = { revenue: 0, orders: 0 };
  }

  byDay.forEach(day => {
    const key = getMonthKey(day.date);
    if (!map[key]) map[key] = { revenue: 0, orders: 0 };
    map[key].revenue += day.revenue;
    map[key].orders += day.orderCount;
  });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, d]) => ({ key, ...d }));
}

export default function SalesForecastPage() {
  const { locale, formatCurrency } = useI18n();
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [forecastRevenue, setForecastRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const end = new Date().toISOString().split("T")[0];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const start = startDate.toISOString().split("T")[0];

    fetch(`/api/reports?startDate=${start}&endDate=${end}`, { credentials: "include" })
      .then(r => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then(data => {
        const byDay: DayRevenue[] = data.data?.revenueByDay || [];
        const byMonth = groupByMonth(byDay);
        setMonthlyData(byMonth);

        // Forecast next month = avg of last 3 months * 1.05
        const last3 = byMonth.slice(-3).map(m => m.revenue);
        const forecast = last3.length
          ? Math.round(last3.reduce((a, b) => a + b, 0) / last3.length * 1.05)
          : 0;
        setForecastRevenue(forecast);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const growthVsPrev =
    monthlyData.length >= 2
      ? ((monthlyData[monthlyData.length - 1].revenue - monthlyData[monthlyData.length - 2].revenue) /
          Math.max(monthlyData[monthlyData.length - 2].revenue, 1)) * 100
      : 0;
  const maxRev = Math.max(...monthlyData.map(m => m.revenue), forecastRevenue, 1);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {locale === "th" ? "แนวโน้มและการพยากรณ์ยอดขาย" : "Sales Trend & Forecast"}
          </h2>
          <p className="text-xs text-slate-500">{locale === "th" ? "ย้อนหลัง 6 เดือน และการพยากรณ์เดือนถัดไป" : "6-month history and next month revenue forecast"}</p>
        </div>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="ml-3 text-sm text-slate-500">{locale === "th" ? "กำลังโหลดข้อมูล..." : "Loading data..."}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {locale === "th" ? "แนวโน้มและการพยากรณ์ยอดขาย" : "Sales Trend & Forecast"}
          </h2>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-8 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">{locale === "th" ? "เกิดข้อผิดพลาดในการโหลดข้อมูล" : "Failed to load forecast data"}</p>
          <p className="text-xs text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
          {locale === "th" ? "แนวโน้มและการพยากรณ์ยอดขาย" : "Sales Trend & Forecast"}
        </h2>
        <p className="text-xs text-slate-500">{locale === "th" ? "ย้อนหลัง 6 เดือน และการพยากรณ์เดือนถัดไป" : "6-month history and next month revenue forecast"}</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">{locale === "th" ? "รายได้รวม 6 เดือน" : "6-Month Revenue"}</span>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">{locale === "th" ? "การเติบโต MoM" : "Month-over-Month"}</span>
          <div className={`flex items-center gap-1 ${growthVsPrev >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {growthVsPrev >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <p className="text-xl font-extrabold">{growthVsPrev >= 0 ? "+" : ""}{growthVsPrev.toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-accent to-accent-hover text-white p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase opacity-80">{locale === "th" ? "พยากรณ์เดือนหน้า" : "Next Month Forecast"}</span>
          <p className="text-xl font-extrabold">{formatCurrency(forecastRevenue)}</p>
          <div className="flex items-center gap-1 text-[10px] opacity-80">
            <ArrowUpRight className="w-3 h-3" />
            {locale === "th" ? "เฉลี่ย 3 เดือน × 1.05" : "3-month avg × 1.05 growth"}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-accent" />
          {locale === "th" ? "รายได้ย้อนหลัง 6 เดือน + พยากรณ์" : "6-Month Revenue + Forecast"}
        </h3>
        <div className="flex items-end gap-2 h-40">
          {monthlyData.map(m => {
            const pct = (m.revenue / maxRev) * 100;
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-slate-900 dark:text-white">{formatCurrency(m.revenue).replace("฿", "")}</span>
                <div className="w-full flex items-end" style={{ height: "100px" }}>
                  <div className="w-full bg-accent rounded-t-lg transition-all duration-500" style={{ height: `${Math.max(pct, 3)}%` }} />
                </div>
                <span className="text-[9px] text-slate-400 text-center">{monthLabel(m.key, locale)}</span>
              </div>
            );
          })}
          {/* Forecast bar */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-accent">{formatCurrency(forecastRevenue).replace("฿", "")}</span>
            <div className="w-full flex items-end" style={{ height: "100px" }}>
              <div className="w-full bg-accent/30 border-2 border-dashed border-accent rounded-t-lg transition-all duration-500" style={{ height: `${Math.max((forecastRevenue / maxRev) * 100, 3)}%` }} />
            </div>
            <span className="text-[9px] text-accent font-bold">{locale === "th" ? "พยากรณ์" : "Forecast"}</span>
          </div>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          {locale === "th" ? "รายละเอียดรายเดือน" : "Monthly Breakdown"}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/80">
                <th className="py-2 text-left">{locale === "th" ? "เดือน" : "Month"}</th>
                <th className="py-2 text-right">{locale === "th" ? "รายได้" : "Revenue"}</th>
                <th className="py-2 text-center">{locale === "th" ? "ออเดอร์" : "Orders"}</th>
                <th className="py-2 text-right">{locale === "th" ? "เปลี่ยนแปลง" : "Change"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {monthlyData.map((m, i) => {
                const prev = i > 0 ? monthlyData[i - 1].revenue : null;
                const change = prev !== null && prev > 0 ? ((m.revenue - prev) / prev) * 100 : null;
                return (
                  <tr key={m.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{monthLabel(m.key, locale)}</td>
                    <td className="py-3 text-right font-bold text-accent">{formatCurrency(m.revenue)}</td>
                    <td className="py-3 text-center text-slate-600 dark:text-slate-400">{m.orders}</td>
                    <td className="py-3 text-right">
                      {change !== null ? (
                        <span className={`font-bold ${change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                );
              })}
              {/* Forecast row */}
              <tr className="bg-accent/5 dark:bg-accent/10">
                <td className="py-3 font-bold text-accent italic">{locale === "th" ? "เดือนหน้า (พยากรณ์)" : "Next Month (Forecast)"}</td>
                <td className="py-3 text-right font-bold text-accent">{formatCurrency(forecastRevenue)}</td>
                <td className="py-3 text-center text-slate-400">—</td>
                <td className="py-3 text-right">
                  {monthlyData.length > 0 && monthlyData[monthlyData.length - 1].revenue > 0 ? (
                    <span className="font-bold text-emerald-500">
                      +{(((forecastRevenue - monthlyData[monthlyData.length - 1].revenue) / monthlyData[monthlyData.length - 1].revenue) * 100).toFixed(1)}%
                    </span>
                  ) : null}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
