// app/(user)/user/shift/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import {
  ClipboardList,
  Check,
  Lock,
  History,
  AlertCircle,
} from "lucide-react";

export default function ShiftPage() {
  const { t, locale, formatCurrency, formatDate } = useI18n();

  const [user, setUser] = useState<any>(null);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [shiftHistory, setShiftHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shift opening form
  const [startingCash, setStartingCash] = useState("3000");
  const [notes, setNotes] = useState("");

  // Shift closing form
  const [actualCash, setActualCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  const loadShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shifts?status=OPEN", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const active = Array.isArray(data) ? data[0] ?? null : null;
      setActiveShift(active);
      setShiftHistory(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("currentUser");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(currentUser);
    loadShifts();
  }, [loadShifts]);

  const handleOpen = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "open",
          branchId: user.branchId,
          startingCash: parseFloat(startingCash),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveShift(data);
        setNotes("");
        await loadShifts();
      } else {
        alert(data.error ?? (locale === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to open shift");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!activeShift || !user) return;
    const actual = parseFloat(actualCash);
    if (isNaN(actual)) {
      alert(locale === "th" ? "กรุณากรอกเงินสดที่นับจริง" : "Please input actual counted cash");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "close",
          shiftId: activeShift.id,
          endingCash: actual,
        }),
      });
      if (res.ok) {
        setActiveShift(null);
        setActualCash("");
        setCloseNotes("");
        await loadShifts();
      } else {
        const data = await res.json();
        alert(data.error ?? (locale === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to close shift");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / error screens ──────────────────────────────────────────────
  if (!user || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm font-semibold text-red-500">{error}</p>
        <button
          onClick={loadShifts}
          className="px-4 py-1.5 bg-accent text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          {locale === "th" ? "ลองใหม่" : "Retry"}
        </button>
      </div>
    );
  }

  // Calculate expected cash from active shift metadata if available
  const expectedAmount = activeShift
    ? (activeShift.expectedCash ?? activeShift.startingCash ?? 0)
    : 0;
  const discrepancy = actualCash ? parseFloat(actualCash) - expectedAmount : 0;

  const shiftOpenedAt = activeShift?.openedAt
    ? new Date(activeShift.openedAt).toLocaleTimeString()
    : "-";

  return (
    <div className="space-y-4">

      {/* 1. ACTIVE SHIFT PANEL (OPEN OR CLOSE FORM) */}
      {activeShift ? (
        // Shift is active -> Close shift form
        <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <ClipboardList className="w-4 h-4 text-accent animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {t("shiftManagement")}
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              {t("shiftStatus_OPEN")}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 rounded-xl grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium">{t("openedAt")}</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {shiftOpenedAt}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">{t("startingCash")}</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {formatCurrency(activeShift.startingCash ?? 0)}
              </p>
            </div>
            <div className="col-span-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex justify-between items-center font-bold">
              <span className="text-slate-400 font-medium">{t("expectedCash")}</span>
              <span className="text-sm text-accent">{formatCurrency(expectedAmount)}</span>
            </div>
          </div>

          {/* Closing input fields */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                {t("actualCash")}
              </label>
              <input
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
              />
            </div>

            {actualCash && (
              <div className={`p-3 rounded-xl border flex justify-between items-center text-xs font-semibold ${
                discrepancy === 0
                  ? "bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900 text-emerald-600"
                  : "bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900 text-red-600"
              }`}>
                <span>{t("differenceCash")}</span>
                <span className="font-extrabold">{formatCurrency(discrepancy)}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                {t("notes")} (เช่น พบเงินส่วนเกิน / ชำรุด)
              </label>
              <textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="พิมพ์บันทึกกะ..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <button
              onClick={handleClose}
              disabled={submitting}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex justify-center items-center disabled:opacity-60"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              <span>{t("closeShiftBtn")}</span>
            </button>
          </div>
        </div>
      ) : (
        // Shift is CLOSED -> Open shift form
        <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <ClipboardList className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {t("shiftManagement")}
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              {t("shiftStatus_CLOSED")}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                {t("startingCash")}
              </label>
              <input
                type="number"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                {t("notes")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="พิมพ์บันทึกการเปิดกะ..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <button
              onClick={handleOpen}
              disabled={submitting}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex justify-center items-center disabled:opacity-60"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              <span>{t("openShiftBtn")}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. HISTORY LIST */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
        <div className="flex items-center space-x-1.5">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {t("shiftLogs")}
          </h3>
        </div>

        {shiftHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">{t("empty")}</div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {shiftHistory.map((log) => {
              const openedDate = log.openedAt ? new Date(log.openedAt) : null;
              return (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-700/40 rounded-xl space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">
                      {openedDate ? formatDate(openedDate) : "-"}
                    </span>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${
                      log.status === "OPEN"
                        ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {t(`shiftStatus_${log.status}` as any)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400">{t("startingCash")}:</span>{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(log.startingCash ?? 0)}
                      </span>
                    </div>
                    {log.status === "CLOSED" && (
                      <>
                        <div>
                          <span className="text-slate-400">{t("actualCash")}:</span>{" "}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(log.actualCash ?? 0)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400">{t("differenceCash")}:</span>{" "}
                          <span className={`font-extrabold ${(log.difference ?? 0) < 0 ? "text-red-500" : "text-emerald-500"}`}>
                            {formatCurrency(log.difference ?? 0)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
