// app/(user)/user/claims/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import { ClipboardList, Plus, Check, AlertCircle, Loader2, RefreshCw } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
  APPROVED:  "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
  REJECTED:  "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400",
  COMPLETED: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300",
};

export default function ClaimsPage() {
  const { t, locale, formatDate, formatCurrency } = useI18n();

  const [claims, setClaims]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  // Form
  const [orderId, setOrderId]   = useState("");
  const [reason, setReason]     = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/claims?limit=30", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setClaims(data.data ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !reason) {
      setFormError(locale === "th" ? "กรุณากรอกข้อมูลให้ครบถ้วน" : "Please fill in all fields");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId, reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setOrderId("");
      setReason("");
      setShowAddForm(false);
      await loadClaims();
    } catch (err: any) {
      setFormError(err.message ?? "Failed to file claim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-1.5">
          <ClipboardList className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
            {t("claimsTitle")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadClaims}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setFormError(null); }}
            className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>{showAddForm ? t("cancel") : locale === "th" ? "แจ้งเคลมสินค้า" : "File Claim"}</span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={loadClaims} className="ml-auto underline font-semibold">{locale === "th" ? "ลองใหม่" : "Retry"}</button>
        </div>
      )}

      {/* Add Claim Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              {locale === "th" ? "เลขออเดอร์ / Invoice Number" : "Order / Invoice Number"}
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
              placeholder="EF-20240101-0001"
              className="block w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-accent/40 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("claimReason")}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder={locale === "th" ? "กรอกรายละเอียดปัญหา เช่น เลนส์หลวม หรือมีรอยขีดข่วน..." : "Describe the issue in detail..."}
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-accent/40 resize-none"
            />
          </div>

          {formError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50 min-h-[44px]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{locale === "th" ? "ยื่นเรื่องการเคลม" : "File Claim"}</span>
          </button>
        </form>
      )}

      {/* Claims List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 text-center text-slate-400 rounded-2xl border text-xs">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3"
            >
              {/* Top row: Invoice + Status */}
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400">
                    Invoice: {c.order?.orderNumber ?? c.orderId ?? "—"}
                  </span>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white pt-0.5">
                    {c.customer?.name ?? c.order?.customer?.name ?? "Guest Customer"}
                  </h3>
                </div>
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[c.status] ?? STATUS_COLOR.PENDING}`}>
                  {t(`claimStatus_${c.status}` as any)}
                </span>
              </div>

              {/* Reason */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-xl text-[10px] text-slate-600 dark:text-slate-400">
                <span className="font-bold">{t("claimReason")}:</span> {c.reason}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center text-[9px] text-slate-400">
                <span>{locale === "th" ? "วันที่เคลม:" : "Filed:"} {formatDate(c.createdAt)}</span>
                {c.resolvedAt && (
                  <span>{locale === "th" ? "แก้ไขเมื่อ:" : "Resolved:"} {formatDate(c.resolvedAt)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
