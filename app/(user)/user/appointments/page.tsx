// app/(user)/user/appointments/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Calendar, Plus, Check, Clock, MessageSquare, AlertCircle } from "lucide-react";

export default function AppointmentsPage() {
  const { t, locale, formatCurrency, formatDate } = useI18n();

  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [purpose, setPurpose] = useState("วัดสายตาประกอบแว่น");
  const [depositAmount, setDepositAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [sendLine, setSendLine] = useState(true);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments?limit=30", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAppointments(data.data ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("currentUser");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(currentUser);
    loadAppointments();
  }, [loadAppointments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !scheduledAt || !user) {
      alert(locale === "th" ? "กรุณากรอกข้อมูลให้ครบถ้วน" : "Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerId,
          branchId: user.branchId,
          scheduledAt,
          purpose,
          depositAmount: parseFloat(depositAmount) || 0,
          notes,
          lineSent: sendLine,
        }),
      });
      if (res.ok) {
        // Reset form
        setCustomerId("");
        setScheduledAt("");
        setDepositAmount("0");
        setNotes("");
        setShowAddForm(false);
        await loadAppointments();
        alert(
          locale === "th"
            ? `นัดหมายสำเร็จ! ${sendLine ? "ส่งข้อความยืนยันทาง LINE OA ให้ลูกค้าเรียบร้อย" : ""}`
            : `Appointment scheduled! ${sendLine ? "Confirmation sent to customer via LINE OA" : ""}`
        );
      } else {
        const data = await res.json();
        alert(data.error ?? (locale === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to create appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setError(null);
    try {
      await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status }),
      });
      await loadAppointments();
    } catch (err: any) {
      setError(err.message ?? "Failed to update appointment");
    }
  };

  // ── Loading / error screens ──────────────────────────────────────────────
  if (!user || (loading && appointments.length === 0)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm font-semibold text-red-500">{error}</p>
        <button
          onClick={loadAppointments}
          className="px-4 py-1.5 bg-accent text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          {locale === "th" ? "ลองใหม่" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
            {t("appointmentTitle")}
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>{showAddForm ? t("cancel") : t("createAppointment")}</span>
        </button>
      </div>

      {/* Non-blocking error banner */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Add Appointment Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              {locale === "th" ? "รหัสลูกค้า" : "Customer ID"}
            </label>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              placeholder={locale === "th" ? "กรอกรหัสลูกค้า" : "Enter customer ID"}
              className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("scheduledAt")}</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("purpose")}</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              >
                <option value="วัดสายตาประกอบแว่น">{t("apptPurposeRefraction")}</option>
                <option value="รับแว่นตาที่สั่งตัด">{t("apptPurposePickup")}</option>
                <option value="ทดลองเลนส์">{t("apptPurposeLensTrial")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("deposit")}</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2 pt-5">
              <input
                type="checkbox"
                checked={sendLine}
                onChange={(e) => setSendLine(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-accent cursor-pointer"
              />
              <span className="text-[10px] font-bold text-slate-500">{t("lineNotify")}</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="โน้ตเติมนัดหมาย..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex justify-center items-center disabled:opacity-60"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            <span>{t("createAppointment")}</span>
          </button>
        </form>
      )}

      {/* 2. Appointments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {appointments.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 text-center text-slate-400 rounded-2xl border text-xs">{t("empty")}</div>
          ) : (
            appointments.map((appt) => {
              const scheduledDate = appt.scheduledAt ? new Date(appt.scheduledAt) : null;
              const customerName = appt.customer?.name ?? appt.customerId ?? "Unknown Customer";
              const customerPhone = appt.customer?.phone ?? "-";
              return (
                <div
                  key={appt.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold bg-accent/5 text-accent px-2 py-0.5 rounded-full uppercase leading-none">
                        {appt.purpose}
                      </span>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white pt-1">
                        {customerName}
                      </h3>
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 py-1 px-2.5 rounded-lg border border-slate-200/40">
                      <Clock className="w-3.5 h-3.5 text-accent mr-1.5" />
                      <span>
                        {scheduledDate
                          ? `${scheduledDate.toLocaleDateString()} / ${scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-slate-100 dark:border-slate-800/80 pt-2 text-slate-500">
                    <div>
                      <span>{locale === "th" ? "เบอร์ลูกค้า" : "Phone"}:</span>{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{customerPhone}</span>
                    </div>
                    <div>
                      <span>{t("deposit")}:</span>{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(appt.depositAmount ?? 0)}</span>
                    </div>
                  </div>

                  {appt.notes && (
                    <p className="text-[9px] bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-slate-500 leading-tight">
                      <span className="font-bold">{t("notes")}:</span> {appt.notes}
                    </p>
                  )}

                  {/* Status & LINE OA */}
                  <div className="flex justify-between items-center text-[9px] font-bold pt-2 border-t border-slate-100 dark:border-slate-800/40">
                    <span className="text-slate-400">{t("apptNumber")}: {appt.appointmentNumber ?? appt.id}</span>
                    {appt.lineSent ? (
                      <span className="text-emerald-500 flex items-center">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        <span>{t("lineSent")}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        <span>{t("linePending")}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
