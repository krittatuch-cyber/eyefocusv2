// app/(seller)/seller/commission/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { DollarSign, TrendingUp, Users, Edit2, Check, X, Loader2, AlertCircle } from "lucide-react";
import { useSortPaginate } from "@/lib/hooks/useSortPaginate";
import SortHeader from "@/components/ui/SortHeader";
import Pagination from "@/components/ui/Pagination";

function getMonthRange(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    startOfMonth: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`,
    endOfMonth: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  };
}

export default function CommissionPage() {
  const { locale, formatCurrency } = useI18n();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now);
  const [users, setUsers] = useState<any[]>([]);
  const [staffLeaderboard, setStaffLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For inline commission rate editing (client-side only)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState("");
  // Local rate overrides (per userId), default 5%
  const [rateOverrides, setRateOverrides] = useState<Record<string, number>>({});

  const monthLabel = selectedMonth.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  // Month picker — last 6 months
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { date: d, label: d.toLocaleDateString("th-TH", { month: "short", year: "numeric" }) };
  }).reverse();

  useEffect(() => {
    const { startOfMonth, endOfMonth } = getMonthRange(selectedMonth);
    setLoading(true);
    setError(null);

    Promise.all([
      fetch("/api/users", { credentials: "include" }).then(r => {
        if (!r.ok) throw new Error(`Users API error: ${r.status}`);
        return r.json();
      }),
      fetch(`/api/reports?startDate=${startOfMonth}&endDate=${endOfMonth}`, { credentials: "include" }).then(r => {
        if (!r.ok) throw new Error(`Reports API error: ${r.status}`);
        return r.json();
      }),
    ])
      .then(([usersData, reportsData]) => {
        setUsers(Array.isArray(usersData) ? usersData : []);
        setStaffLeaderboard(reportsData.data?.staffLeaderboard || []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  // Build staff stats by matching users to leaderboard revenue
  const staffStats = users.map(user => {
    const lb = staffLeaderboard.find((s: any) => s.userId === user.id || s.id === user.id);
    const salesTotal = lb?.revenue ?? lb?.totalRevenue ?? 0;
    const ratePercent = rateOverrides[user.id] ?? 5; // default 5%
    const commissionAmt = salesTotal * (ratePercent / 100);
    const orderCount = lb?.orderCount ?? lb?.totalOrders ?? 0;
    return { id: user.id, userName: user.name ?? user.email, branchName: user.branchName ?? (locale === "th" ? "สำนักงานใหญ่" : "HQ"), salesTotal, commissionAmt, ratePercent, orderCount };
  });

  const { rows, sort, onSort, page, setPage, pageSize, onPageSize, totalPages, totalRows, from, to } = useSortPaginate({
    data: staffStats,
    defaultSort: { key: "salesTotal", dir: "desc" },
    storageKey: "commission",
  });

  const totalCommission = staffStats.reduce((s, r) => s + r.commissionAmt, 0);
  const totalSales = staffStats.reduce((s, r) => s + r.salesTotal, 0);

  const saveRate = (id: string) => {
    const parsed = parseFloat(editRate);
    if (!isNaN(parsed) && parsed >= 0) {
      setRateOverrides(prev => ({ ...prev, [id]: parsed }));
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {locale === "th" ? "ค่าคอมมิชชันพนักงาน" : "Staff Commission"}
          </h2>
          <p className="text-xs text-slate-500">
            {locale === "th" ? `ยอดคอมมิชชันประจำ${monthLabel}` : `Commission summary for ${monthLabel}`}
          </p>
        </div>
        {/* Month selector */}
        <div className="flex gap-1.5 flex-wrap">
          {monthOptions.map(m => (
            <button
              key={m.date.toISOString()}
              onClick={() => setSelectedMonth(m.date)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                selectedMonth.getMonth() === m.date.getMonth() && selectedMonth.getFullYear() === m.date.getFullYear()
                  ? "bg-accent border-accent text-white"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{locale === "th" ? "ค่าคอมรวมเดือนนี้" : "Total Commission"}</p>
            {loading ? (
              <div className="h-7 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalCommission)}</p>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{locale === "th" ? "จำนวนพนักงาน" : "Staff Count"}</p>
            {loading ? (
              <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{users.length} {locale === "th" ? "คน" : "people"}</p>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{locale === "th" ? "ยอดขายรวม" : "Total Sales"}</p>
            {loading ? (
              <div className="h-7 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalSales)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Commission List — Card (mobile) + Table (md+) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">{locale === "th" ? "กำลังโหลด..." : "Loading..."}</span>
          </div>
        ) : staffStats.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            {locale === "th" ? "ไม่พบข้อมูลพนักงาน" : "No staff data found"}
          </div>
        ) : (
          <>
            {/* ── Mobile Cards (< md) ─────────────────────────────── */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {staffStats.map(r => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{r.userName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{r.branchName} · {r.orderCount} {locale === "th" ? "ออเดอร์" : "orders"}</p>
                    </div>
                    <span className="text-xs font-bold text-accent">{locale === "th" ? "ยอด" : "Sales"} {formatCurrency(r.salesTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400">{locale === "th" ? "อัตรา" : "Rate"}</p>
                      {editingId === r.id ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <input
                            value={editRate}
                            onChange={e => setEditRate(e.target.value)}
                            className="w-12 text-center px-1 py-0.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus:outline-none"
                          />
                          <button onClick={() => saveRate(r.id)} className="text-emerald-500"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="text-red-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(r.id); setEditRate(String(r.ratePercent)); }}
                          className="flex items-center gap-1 mt-0.5 font-bold text-sm text-accent hover:underline"
                        >
                          {r.ratePercent}% <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400">{locale === "th" ? "ค่าคอม" : "Commission"}</p>
                      <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(r.commissionAmt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Desktop Table (≥ md) ───────────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                    <SortHeader col="userName" label={locale === "th" ? "พนักงาน" : "Staff"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                    <SortHeader col="branchName" label={locale === "th" ? "สาขา" : "Branch"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                    <SortHeader col="salesTotal" label={locale === "th" ? "ยอดขาย" : "Sales"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="right" />
                    <SortHeader col="ratePercent" label={locale === "th" ? "อัตรา%" : "Rate%"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="center" />
                    <SortHeader col="commissionAmt" label={locale === "th" ? "ค่าคอม" : "Commission"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="right" />
                    <SortHeader col="orderCount" label={locale === "th" ? "จำนวนออเดอร์" : "Orders"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="right" />
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {rows.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4"><p className="font-semibold text-slate-900 dark:text-white">{r.userName}</p></td>
                      <td className="py-3 px-4 text-slate-500">{r.branchName}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(r.salesTotal)}</td>
                      <td className="py-3 px-4 text-center">
                        {editingId === r.id ? (
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              value={editRate}
                              onChange={e => setEditRate(e.target.value)}
                              className="w-14 text-center px-1 py-0.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus:outline-none"
                            />
                            <button onClick={() => saveRate(r.id)} className="text-emerald-500 cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingId(null)} className="text-red-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <span className="font-bold text-accent">{r.ratePercent}%</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(r.commissionAmt)}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{r.orderCount}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => { setEditingId(r.id); setEditRate(String(r.ratePercent)); }}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-accent cursor-pointer transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} totalPages={totalPages} totalRows={totalRows} from={from} to={to} pageSize={pageSize} onPage={setPage} onPageSize={onPageSize} locale={locale} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
