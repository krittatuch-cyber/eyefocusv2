// app/(seller)/seller/recall/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import { AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp, Plus, X, Loader2, AlertCircle } from "lucide-react";

const STATUS_LABELS: Record<string, { th: string; en: string; color: string }> = {
  PENDING:   { th: "รอดำเนินการ", en: "Pending",   color: "bg-amber-100 dark:bg-amber-950/30 text-amber-600" },
  IN_REVIEW: { th: "กำลังตรวจสอบ", en: "In Review", color: "bg-blue-100 dark:bg-blue-950/30 text-blue-600" },
  RESOLVED:  { th: "แก้ไขแล้ว",   en: "Resolved",  color: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600" },
};

export default function RecallPage() {
  const { locale } = useI18n();
  const [claims, setClaims] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ orderId: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [page] = useState(1);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/claims?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setClaims(data.data || []);
      setSummary(data.summary || {});
    } catch (err: any) {
      setError(err.message || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  // Load orders for the new claim dropdown
  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?limit=100", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setOrders(data.data || []);
    } catch {
      // silently fail — orders list is optional
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  useEffect(() => {
    if (showNewForm) loadOrders();
  }, [showNewForm, loadOrders]);

  const handleUpdateStatus = async (id: string, status: string, resolutionNote?: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status, resolutionNote }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await loadClaims();
    } catch (err: any) {
      setError(err.message || "Failed to update claim");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateClaim = async () => {
    if (!newForm.orderId || !newForm.reason) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: newForm.orderId, reason: newForm.reason }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setShowNewForm(false);
      setNewForm({ orderId: "", reason: "" });
      await loadClaims();
    } catch (err: any) {
      setError(err.message || "Failed to create claim");
    } finally {
      setSubmitting(false);
    }
  };

  const counts = {
    PENDING:   summary.PENDING   ?? claims.filter(c => c.status === "PENDING").length,
    IN_REVIEW: summary.IN_REVIEW ?? claims.filter(c => c.status === "IN_REVIEW").length,
    RESOLVED:  summary.RESOLVED  ?? claims.filter(c => c.status === "RESOLVED").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {locale === "th" ? "การร้องเรียนและ Recall" : "Claims & Recall Management"}
          </h2>
          <p className="text-xs text-slate-500">{locale === "th" ? "จัดการข้อร้องเรียน การส่งซ่อม และ recall สินค้า" : "Manage customer complaints, warranty, and product recalls"}</p>
        </div>
        <button onClick={() => setShowNewForm(!showNewForm)}
          className="px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>{locale === "th" ? "แจ้งเคลม" : "New Claim"}</span>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: locale === "th" ? "รอดำเนินการ" : "Pending", count: counts.PENDING, icon: Clock, color: "text-amber-500 bg-amber-100 dark:bg-amber-950/20" },
          { label: locale === "th" ? "กำลังตรวจสอบ" : "In Review", count: counts.IN_REVIEW, icon: AlertTriangle, color: "text-blue-500 bg-blue-100 dark:bg-blue-950/20" },
          { label: locale === "th" ? "แก้ไขแล้ว" : "Resolved", count: counts.RESOLVED, icon: CheckCircle, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/20" },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
              {loading
                ? <div className="h-5 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
                : <p className="text-xl font-extrabold text-slate-900 dark:text-white">{s.count}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* New Claim Form */}
      {showNewForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{locale === "th" ? "แจ้งเคลมใหม่" : "New Claim"}</h3>
            <button onClick={() => setShowNewForm(false)} className="text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">{locale === "th" ? "เลือกออเดอร์" : "Select Order"}</label>
            <select value={newForm.orderId} onChange={e => setNewForm({ ...newForm, orderId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none">
              <option value="">-- {locale === "th" ? "เลือกออเดอร์" : "Select"} --</option>
              {orders.map((o: any) => (
                <option key={o.id} value={o.id}>{o.orderNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">{locale === "th" ? "สาเหตุการร้องเรียน" : "Reason"}</label>
            <textarea value={newForm.reason} onChange={e => setNewForm({ ...newForm, reason: e.target.value })} rows={3}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none resize-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNewForm(false)} className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl cursor-pointer">
              {locale === "th" ? "ยกเลิก" : "Cancel"}
            </button>
            <button onClick={handleCreateClaim} disabled={submitting || !newForm.orderId || !newForm.reason}
              className="px-4 py-1.5 text-xs font-bold bg-accent text-white rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
              {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
              {locale === "th" ? "บันทึก" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {["ALL","PENDING","IN_REVIEW","RESOLVED"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-bold rounded-full border transition cursor-pointer ${
              statusFilter === s ? "bg-accent border-accent text-white" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500"}`}>
            {s === "ALL" ? (locale === "th" ? "ทั้งหมด" : "All") : (STATUS_LABELS[s]?.[locale === "th" ? "th" : "en"] || s)}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
          <span className="ml-2 text-xs text-slate-400">{locale === "th" ? "กำลังโหลด..." : "Loading..."}</span>
        </div>
      )}

      {/* Claims List */}
      {!loading && (
        <div className="space-y-3">
          {claims.map(c => {
            const isOpen = expanded === c.id;
            const sl = STATUS_LABELS[c.status];
            return (
              <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 flex items-start justify-between cursor-pointer" onClick={() => setExpanded(isOpen ? null : c.id)}>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sl?.color}`}>
                        {locale === "th" ? sl?.th : sl?.en}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString("th-TH")}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{c.customerName || (locale === "th" ? "ลูกค้าทั่วไป" : "Walk-in")}</p>
                    <p className="text-xs text-slate-500 truncate">{c.reason}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-[10px] text-slate-400">{c.orderNumber}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-slate-400">{locale === "th" ? "ออเดอร์:" : "Order:"}</span><p className="font-semibold text-accent">{c.orderNumber}</p></div>
                      <div><span className="text-slate-400">{locale === "th" ? "สาขา:" : "Branch:"}</span><p className="font-semibold">{c.branchName}</p></div>
                    </div>
                    <div className="text-xs"><span className="text-slate-400 block mb-1">{locale === "th" ? "รายละเอียด:" : "Details:"}</span><p className="text-slate-700 dark:text-slate-300">{c.reason}</p></div>
                    {c.items && c.items.length > 0 && (
                      <div className="text-xs space-y-1">
                        <span className="text-slate-400 block">{locale === "th" ? "สินค้าในออเดอร์:" : "Order Items:"}</span>
                        {c.items.map((item: any, i: number) => (
                          <div key={i} className="text-slate-600 dark:text-slate-400">• {item.productName} × {item.quantity}</div>
                        ))}
                      </div>
                    )}
                    {c.resolution && <div className="bg-emerald-50 dark:bg-emerald-950/10 rounded-xl p-3 text-xs text-emerald-700 dark:text-emerald-400"><span className="font-bold">{locale === "th" ? "การแก้ไข: " : "Resolution: "}</span>{c.resolution}</div>}
                    {c.status !== "RESOLVED" && (
                      <div className="space-y-2">
                        {c.status === "PENDING" && (
                          <button onClick={() => handleUpdateStatus(c.id, "IN_REVIEW")} disabled={submitting}
                            className="w-full py-2 text-xs font-bold border border-blue-300 dark:border-blue-800 text-blue-600 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 disabled:opacity-50 flex items-center justify-center gap-1.5">
                            {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                            {locale === "th" ? "เริ่มตรวจสอบ" : "Start Review"}
                          </button>
                        )}
                        <div className="flex gap-2">
                          <input value={resolution[c.id] || ""} onChange={e => setResolution({ ...resolution, [c.id]: e.target.value })}
                            placeholder={locale === "th" ? "บันทึกการแก้ไข..." : "Resolution notes..."}
                            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none" />
                          <button onClick={() => handleUpdateStatus(c.id, "RESOLVED", resolution[c.id])} disabled={submitting}
                            className="px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white rounded-xl cursor-pointer hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5">
                            {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                            {locale === "th" ? "แก้ไขแล้ว" : "Resolved"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {claims.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400 text-xs">{locale === "th" ? "ไม่มีรายการ" : "No claims found"}</div>
          )}
        </div>
      )}
    </div>
  );
}
