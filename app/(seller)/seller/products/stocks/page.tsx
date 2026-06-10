// app/(seller)/seller/products/stocks/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Database, Search, Building2, AlertTriangle, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useSortPaginate } from "@/lib/hooks/useSortPaginate";
import SortHeader from "@/components/ui/SortHeader";
import Pagination from "@/components/ui/Pagination";

interface StockItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  branchId: string;
  branchName: string;
  quantity: number;
  minAlert: number;
}

export default function StockPage() {
  const { t, locale } = useI18n();

  const [stocksList, setStocksList]     = useState<StockItem[]>([]);
  const [branches, setBranches]         = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [adjusting, setAdjusting]       = useState<string | null>(null); // stockId being adjusted

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stockRes, branchRes] = await Promise.all([
        fetch("/api/stocks", { credentials: "include" }),
        fetch("/api/branches", { credentials: "include" }),
      ]);
      if (!stockRes.ok) throw new Error(`Stocks API: HTTP ${stockRes.status}`);
      if (!branchRes.ok) throw new Error(`Branches API: HTTP ${branchRes.status}`);
      const stockData  = await stockRes.json();
      const branchData = await branchRes.json();
      setStocksList(Array.isArray(stockData)  ? stockData  : stockData.data  ?? []);
      setBranches (Array.isArray(branchData) ? branchData : branchData.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load stocks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAdjust = async (stockId: string, delta: number) => {
    setAdjusting(stockId);
    try {
      await fetch("/api/stocks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: stockId, delta }),
      });
      await fetchAll();
    } catch {
      // silent — UI will refresh
    } finally {
      setAdjusting(null);
    }
  };

  const filtered = stocksList.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = item.productName.toLowerCase().includes(q) || item.productCode.toLowerCase().includes(q);
    const matchBranch = selectedBranch === "ALL" || item.branchId === selectedBranch;
    return matchSearch && matchBranch;
  });

  const lowStockCount = filtered.filter(i => i.quantity <= i.minAlert).length;

  const { rows, sort, onSort, page, setPage, pageSize, onPageSize, totalPages, totalRows, from, to } = useSortPaginate({
    data: filtered,
    defaultSort: { key: "productCode", dir: "asc" },
    storageKey: "stocks",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {t("menu_stocks")}
          </h2>
          <p className="text-xs text-slate-500">
            {locale === "th" ? "บริหารคลังสินค้าของทุกสาขา แยกรายการกรอบแว่น เลนส์ แว่นสายตา" : "Monitor and adjust inventory levels across all branches"}
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Low stock alert */}
      {!loading && lowStockCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{lowStockCount} รายการ</span> มีสต็อกต่ำกว่าเกณฑ์แจ้งเตือน
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        {/* Branch */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{t("branch")}</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="block w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none min-h-[44px]"
          >
            <option value="ALL">-- {locale === "th" ? "ทุกสาขา" : "All Branches"} --</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{t("search")}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === "th" ? "ค้นหารหัสสินค้า หรือชื่อแว่น..." : "Search code or product name..."}
              className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchAll} className="ml-auto underline font-semibold">{locale === "th" ? "ลองใหม่" : "Retry"}</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Summary header */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {locale === "th" ? "แสดง" : "Showing"} <span className="font-bold text-slate-700 dark:text-slate-200">{filtered.length}</span> {locale === "th" ? "รายการ" : "items"}
            </p>
            {lowStockCount > 0 && (
              <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {lowStockCount} ต่ำกว่าเกณฑ์
              </span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <Database className="w-8 h-8 opacity-30" />
              <p>{search ? (locale === "th" ? "ไม่พบสินค้า" : "No matching items") : (locale === "th" ? "ยังไม่มีข้อมูลสต็อก" : "No stock data")}</p>
            </div>
          ) : (
            <>
              {/* ── Mobile Cards (< md) ───────────────────────────── */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => {
                  const isLow = item.quantity <= item.minAlert;
                  const stockId = item.id;
                  return (
                    <div key={stockId} className={`p-4 ${isLow ? "bg-red-50/40 dark:bg-red-950/10" : ""}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-mono text-[10px] text-slate-400">{item.productCode}</span>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">{item.category}</span>
                          </div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.productName}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />{item.branchName}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className={`text-xl font-black ${isLow ? "text-red-500 animate-pulse" : "text-slate-900 dark:text-white"}`}>
                            {item.quantity}
                          </span>
                          <p className="text-[9px] text-slate-400">min: {item.minAlert}</p>
                          {isLow && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-red-500 font-bold">
                              <AlertTriangle className="w-2.5 h-2.5" />ต่ำ
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Adjust buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAdjust(stockId, 5)}
                          disabled={adjusting === stockId}
                          className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition min-h-[44px] disabled:opacity-50"
                        >
                          {adjusting === stockId ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "+5"}
                        </button>
                        <button
                          onClick={() => handleAdjust(stockId, -1)}
                          disabled={item.quantity === 0 || adjusting === stockId}
                          className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-red-500 dark:text-red-400 rounded-xl text-xs font-bold transition min-h-[44px] disabled:opacity-30"
                        >
                          -1
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Desktop Table (≥ md) ───────────────────────────── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/80">
                      <SortHeader col="productCode" label={locale === "th" ? "รหัสสินค้า" : "SKU"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                      <SortHeader col="productName" label={locale === "th" ? "ชื่อสินค้า" : "Product Name"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                      <SortHeader col="branchName" label={t("branch")} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                      <SortHeader col="quantity" label={locale === "th" ? "จำนวนคงเหลือ" : "Qty"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="right" />
                      <SortHeader col="minAlert" label={locale === "th" ? "เกณฑ์แจ้งเตือน" : "Min"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="center" />
                      <th className="py-2 px-4 text-right">{locale === "th" ? "ปรับสต็อก" : "Adjust"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {rows.map((item) => {
                      const isLow = item.quantity <= item.minAlert;
                      const stockId = item.id;
                      return (
                        <tr key={stockId} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${isLow ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}>
                          <td className="py-3 px-4 font-semibold text-slate-950 dark:text-white">{item.productCode}</td>
                          <td className="py-3 px-4">
                            <p className="text-slate-900 dark:text-slate-100 font-semibold">{item.productName}</p>
                            <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">{item.category}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.branchName}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-black ${isLow ? "bg-red-100 dark:bg-red-950/20 text-red-500 animate-pulse" : "text-slate-900 dark:text-white"}`}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-400">{item.minAlert}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleAdjust(stockId, 5)}
                                disabled={adjusting === stockId}
                                className="px-2 py-1 bg-slate-100 hover:bg-emerald-500 hover:text-white dark:bg-slate-800 text-emerald-500 rounded text-[10px] font-bold cursor-pointer disabled:opacity-50"
                              >
                                {adjusting === stockId ? "..." : "+5"}
                              </button>
                              <button
                                onClick={() => handleAdjust(stockId, -1)}
                                disabled={item.quantity === 0 || adjusting === stockId}
                                className="px-2 py-1 bg-slate-100 hover:bg-red-500 hover:text-white dark:bg-slate-800 text-red-500 rounded text-[10px] font-bold cursor-pointer disabled:opacity-30"
                              >
                                -1
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination page={page} totalPages={totalPages} totalRows={totalRows} from={from} to={to} pageSize={pageSize} onPage={setPage} onPageSize={onPageSize} locale={locale} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
