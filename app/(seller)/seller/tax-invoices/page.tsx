// app/(seller)/seller/tax-invoices/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { FileText, Search, X, Printer, DollarSign, Receipt, Loader2, AlertCircle } from "lucide-react";
import { useSortPaginate } from "@/lib/hooks/useSortPaginate";
import SortHeader from "@/components/ui/SortHeader";
import Pagination from "@/components/ui/Pagination";

const VAT_RATE = 0.07;

export default function TaxInvoicesPage() {
  const { locale, formatCurrency } = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Tax invoices = orders where isETaxRequested = true
    // Fetch all orders and filter client-side
    fetch("/api/orders?limit=100", { credentials: "include" })
      .then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then(data => {
        const all = data.data || [];
        const taxOrders = all
          .filter((o: any) => o.isETaxRequested)
          .map((o: any) => ({
            ...o,
            vatAmount: o.netAmount * VAT_RATE,
            preVat: o.netAmount / (1 + VAT_RATE),
          }));
        setInvoices(taxOrders);
      })
      .catch(err => setError(err.message || "Failed to load invoices"))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = invoices.filter(o => {
    const s = search.toLowerCase();
    const matchSearch =
      (o.orderNumber || "").toLowerCase().includes(s) ||
      (o.customerName || "").toLowerCase().includes(s);
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalVat = filtered.filter(o => o.status === "PAID").reduce((s, o) => s + o.vatAmount, 0);
  const totalInvoices = filtered.filter(o => o.status === "PAID").length;

  const { rows, sort, onSort, page, setPage, pageSize, onPageSize, totalPages, totalRows, from, to } = useSortPaginate({
    data: filtered,
    defaultSort: { key: "createdAt", dir: "desc" },
    storageKey: "tax_invoices",
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {locale === "th" ? "ใบกำกับภาษีอิเล็กทรอนิกส์" : "e-Tax Invoices"}
          </h2>
          <p className="text-xs text-slate-500">{locale === "th" ? "ออเดอร์ที่ขอใบกำกับภาษีทั้งหมด" : "All orders with e-tax invoice requests"}</p>
        </div>
        <button className="px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
          <Receipt className="w-4 h-4" />
          <span>{locale === "th" ? "ออกใบกำกับใหม่" : "New Invoice"}</span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{locale === "th" ? "ใบกำกับภาษีที่ออก" : "Invoices Issued"}</p>
            {loading
              ? <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
              : <p className="text-xl font-extrabold text-slate-900 dark:text-white">{totalInvoices} {locale === "th" ? "ใบ" : "invoices"}</p>
            }
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{locale === "th" ? "ภาษีมูลค่าเพิ่มรวม (7%)" : "Total VAT Collected (7%)"}</p>
            {loading
              ? <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
              : <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalVat)}</p>
            }
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex gap-1.5">
          {["ALL","PAID","PENDING"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition cursor-pointer ${
                statusFilter === s ? "bg-accent border-accent text-white" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"}`}>
              {s === "ALL" ? (locale === "th" ? "ทั้งหมด" : "All") : s === "PAID" ? (locale === "th" ? "ชำระแล้ว" : "Paid") : (locale === "th" ? "รอชำระ" : "Pending")}
            </button>
          ))}
        </div>
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={locale === "th" ? "ค้นหาเลขที่หรือชื่อลูกค้า..." : "Search invoice or customer..."}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none" />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
          <span className="ml-2 text-xs text-slate-400">{locale === "th" ? "กำลังโหลด..." : "Loading..."}</span>
        </div>
      )}

      {/* Invoice list — Card (mobile) + Table (md+) */}
      {!loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">{locale === "th" ? "ไม่มีรายการ" : "No invoices found"}</div>
          ) : (
            <>
              {/* ── Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(o => (
                  <div key={o.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm text-accent">{o.orderNumber}</p>
                        <p className="text-xs font-medium text-slate-900 dark:text-white">{o.customerName || (locale === "th" ? "ลูกค้าทั่วไป" : "Walk-in")}</p>
                        <p className="text-[10px] text-slate-500">{o.branchName} · {new Date(o.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" })}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        o.status === "PAID" ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600" : "bg-amber-100 dark:bg-amber-950/30 text-amber-600"
                      }`}>
                        {o.status === "PAID" ? (locale === "th" ? "ชำระแล้ว" : "Paid") : (locale === "th" ? "รอชำระ" : "Pending")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-[10px] text-slate-400">{locale === "th" ? "ยอดสุทธิ" : "Net"}</p>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{formatCurrency(o.netAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">VAT 7%</p>
                        <p className="font-bold text-sm text-emerald-600">{formatCurrency(o.vatAmount)}</p>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="ml-3 w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-accent flex items-center justify-center"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                      <SortHeader col="orderNumber" label={locale === "th" ? "เลขที่" : "Invoice No."} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                      <SortHeader col="customerName" label={locale === "th" ? "ลูกค้า" : "Customer"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                      <SortHeader col="branchName" label={locale === "th" ? "สาขา" : "Branch"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                      <SortHeader col="createdAt" label={locale === "th" ? "วันที่" : "Date"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                      <SortHeader col="netAmount" label={locale === "th" ? "ยอดสุทธิ" : "Net Amount"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="right" />
                      <SortHeader col="vatAmount" label="VAT (7%)" sortKey={sort.key} dir={sort.dir} onSort={onSort} align="right" />
                      <SortHeader col="status" label={locale === "th" ? "สถานะ" : "Status"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="center" />
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {rows.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-accent">{o.orderNumber}</td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{o.customerName || (locale === "th" ? "ลูกค้าทั่วไป" : "Walk-in")}</td>
                        <td className="py-3 px-4 text-slate-500">{o.branchName}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(o.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" })}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(o.netAmount)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600">{formatCurrency(o.vatAmount)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.status === "PAID" ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600" : "bg-amber-100 dark:bg-amber-950/30 text-amber-600"
                          }`}>
                            {o.status === "PAID" ? (locale === "th" ? "ชำระแล้ว" : "Paid") : (locale === "th" ? "รอชำระ" : "Pending")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => setSelectedOrder(o)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-accent cursor-pointer transition">
                            <FileText className="w-3.5 h-3.5" />
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
      )}

      {/* Invoice Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">ใบกำกับภาษี</h3>
                <p className="text-xs text-accent font-bold">{selectedOrder.orderNumber}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-slate-400">ลูกค้า:</span><p className="font-semibold">{selectedOrder.customerName || "ลูกค้าทั่วไป"}</p></div>
              <div><span className="text-slate-400">สาขา:</span><p className="font-semibold">{selectedOrder.branchName}</p></div>
              <div><span className="text-slate-400">วันที่:</span><p className="font-semibold">{new Date(selectedOrder.createdAt).toLocaleDateString("th-TH")}</p></div>
              <div><span className="text-slate-400">ช่องทางชำระ:</span><p className="font-semibold">{selectedOrder.paymentMethod || "-"}</p></div>
            </div>
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                {selectedOrder.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">{item.productName} × {item.quantity}</span>
                    <span className="font-semibold">{formatCurrency((item.price - (item.discount || 0)) * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">ก่อนภาษี:</span><span>{formatCurrency(selectedOrder.preVat)}</span></div>
              <div className="flex justify-between text-emerald-600"><span>VAT 7%:</span><span>{formatCurrency(selectedOrder.vatAmount)}</span></div>
              <div className="flex justify-between font-bold text-base text-slate-900 dark:text-white"><span>รวมทั้งสิ้น:</span><span>{formatCurrency(selectedOrder.netAmount)}</span></div>
            </div>
            <button className="w-full py-2.5 bg-accent text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 hover:bg-accent-hover">
              <Printer className="w-4 h-4" />
              {locale === "th" ? "พิมพ์ใบกำกับภาษี" : "Print Tax Invoice"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
