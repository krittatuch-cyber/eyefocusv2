// app/(user)/user/jobs/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Layers, CheckCircle2, Wrench, Send, Truck, ChevronRight, AlertCircle } from "lucide-react";

// Full status flow matching the real DB enum
const STATUS_FLOW = [
  "PENDING",
  "PREPARING",
  "SEND_TO_LAB",
  "LAB_PROCESSING",
  "RECEIVED_FROM_LAB",
  "READY_FOR_PICKUP",
  "DELIVERED",
];

export default function JobsPage() {
  const { t, locale, formatDate } = useI18n();

  const [user, setUser] = useState<any>(null);
  const [jobTickets, setJobTickets] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/job-tickets?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setJobTickets(data.data ?? []);
      setSummary(data.summary ?? {});
    } catch (err: any) {
      setError(err.message ?? "Failed to load job tickets");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("currentUser");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(currentUser);
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex < 0 || currentIndex >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[currentIndex + 1];

    setUpdatingId(id);
    setError(null);
    try {
      await fetch("/api/job-tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status: nextStatus }),
      });
      await loadJobs();
    } catch (err: any) {
      setError(err.message ?? "Failed to update job status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <Layers className="w-4 h-4 text-slate-400" />;
      case "PREPARING": return <Wrench className="w-4 h-4 text-amber-500" />;
      case "SEND_TO_LAB": return <Send className="w-4 h-4 text-indigo-500" />;
      case "LAB_PROCESSING": return <RefreshCwIcon className="w-4 h-4 text-accent animate-spin" />;
      case "RECEIVED_FROM_LAB": return <Truck className="w-4 h-4 text-emerald-500" />;
      case "READY_FOR_PICKUP": return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "DELIVERED": return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
      default: return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusPercent = (status: string) => {
    const index = STATUS_FLOW.indexOf(status);
    return Math.floor((Math.max(index, 0) / (STATUS_FLOW.length - 1)) * 100);
  };

  // ── Loading / error screens ──────────────────────────────────────────────
  if (!user || (loading && jobTickets.length === 0)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && jobTickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm font-semibold text-red-500">{error}</p>
        <button
          onClick={loadJobs}
          className="px-4 py-1.5 bg-accent text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          {locale === "th" ? "ลองใหม่" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Layers className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
            {t("jobTicketTitle")}
          </h2>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="">{locale === "th" ? "ทุกสถานะ" : "All Status"}</option>
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>{t(`jobStatus_${s}` as any)}</option>
          ))}
        </select>
      </div>

      {/* Non-blocking error banner */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Job list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {jobTickets.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 text-center text-slate-400 rounded-2xl border text-xs">{t("empty")}</div>
          ) : (
            jobTickets.map((job) => {
              const progress = getStatusPercent(job.status);
              const customerName = job.customer?.name ?? job.order?.customer?.name ?? "Guest Customer";
              const orderNumber = job.order?.orderNumber ?? job.orderId ?? "-";
              const updatedDate = job.updatedAt ? new Date(job.updatedAt) : null;
              const targetDate = job.targetDate ? new Date(job.targetDate) : null;
              const isUpdating = updatingId === job.id;

              return (
                <div
                  key={job.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  {/* Header section */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white">
                        {customerName}
                      </h3>
                      <p className="text-[9px] text-slate-400">Order: {orderNumber}</p>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center text-[10px] font-bold text-accent bg-accent/5 px-2.5 py-1 rounded-xl">
                        {getStatusIcon(job.status)}
                        <span className="ml-1">{t(`jobStatus_${job.status}` as any)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-accent h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                      <span>{locale === "th" ? "รับงาน" : "Received"}</span>
                      <span>{locale === "th" ? "ส่งแล็บ" : "Lab"}</span>
                      <span>{locale === "th" ? "สำเร็จ" : "Done"}</span>
                    </div>
                  </div>

                  {/* Optical Specifications detail — uses labId/labName per real schema */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex justify-between text-[9px] text-slate-400 border-b border-slate-200/40 dark:border-slate-700/30 pb-1">
                      <span>{t("lensBrandType")}: <span className="font-bold text-slate-700 dark:text-slate-300">{job.lensType ?? "ไม่ระบุ"}</span></span>
                      <span>{t("labName")}: <span className="font-bold text-slate-700 dark:text-slate-300">{job.labName ?? "ไม่ระบุ"}</span></span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-500">
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-300">R: SPH {job.sphR} / CYL {job.cylR ?? "0.00"} / AXIS {job.axisR ?? "0"}</p>
                      </div>
                      <div className="border-l border-slate-200/40 dark:border-slate-800/60 pl-2">
                        <p className="font-bold text-slate-700 dark:text-slate-300">L: SPH {job.sphL} / CYL {job.cylL ?? "0.00"} / AXIS {job.axisL ?? "0"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action button to proceed status */}
                  {job.status !== "DELIVERED" && (
                    <button
                      onClick={() => handleUpdateStatus(job.id, job.status)}
                      disabled={isUpdating}
                      className="w-full py-2 bg-slate-100 hover:bg-accent hover:text-white dark:bg-slate-700 text-slate-700 dark:text-white text-xs font-bold rounded-xl transition duration-150 flex items-center justify-center cursor-pointer disabled:opacity-60"
                    >
                      {isUpdating ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <>
                          <span>{locale === "th" ? "เลื่อนขั้นตอนงานแล็บถัดไป" : "Advance to next lab stage"}</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </>
                      )}
                    </button>
                  )}

                  {/* Footer specs */}
                  <div className="flex justify-between items-center text-[9px] text-slate-400">
                    <span>{t("targetDeliveryDate")}: {targetDate ? formatDate(targetDate) : "-"}</span>
                    <span>{locale === "th" ? "อัปเดต:" : "Updated:"} {updatedDate ? updatedDate.toLocaleTimeString() : "-"}</span>
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

function RefreshCwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
