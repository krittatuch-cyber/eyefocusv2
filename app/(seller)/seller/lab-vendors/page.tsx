// app/(seller)/seller/lab-vendors/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { db } from "@/lib/db-mock";
import { Beaker, Phone, Mail, MapPin, Clock, ChevronDown, ChevronUp, CheckCircle, Truck, Package, Activity } from "lucide-react";

const JOB_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-slate-100 dark:bg-slate-800 text-slate-500",
  PREPARING: "bg-blue-100 dark:bg-blue-950/30 text-blue-600",
  SEND_TO_LAB: "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600",
  RECEIVED: "bg-amber-100 dark:bg-amber-950/30 text-amber-600",
  READY: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600",
  DELIVERED: "bg-slate-100 dark:bg-slate-800 text-slate-500",
};

const JOB_STATUS_TH: Record<string, string> = {
  PENDING: "รอดำเนินการ", PREPARING: "กำลังตระเตรียม", SEND_TO_LAB: "ส่งแล็บแล้ว",
  RECEIVED: "รับจากแล็บ", READY: "พร้อมส่ง", DELIVERED: "ส่งลูกค้าแล้ว",
};

export default function LabVendorsPage() {
  const { locale } = useI18n();
  const [vendors, setVendors] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setVendors(db.labVendors.map((lv: any) => {
      const jobs = db.jobTickets.filter((j: any) => j.labId === lv.id);
      return { ...lv, jobs };
    }));
  }, []);

  const jobCounts = (jobs: any[]) => {
    const counts: Record<string, number> = {};
    jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
    return counts;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
          {locale === "th" ? "แล็บผู้ผลิตเลนส์" : "Lab Vendor Directory"}
        </h2>
        <p className="text-xs text-slate-500">{locale === "th" ? "ข้อมูลแล็บพาร์ทเนอร์ ติดตาม Job Ticket และผลงาน" : "Lab partner directory, job tracking, and performance"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.map(lv => {
          const isOpen = expanded === lv.id;
          const counts = jobCounts(lv.jobs);
          const activeJobs = lv.jobs.filter((j: any) => !["DELIVERED"].includes(j.status)).length;
          return (
            <div key={lv.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <Beaker className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{lv.name}</h3>
                      <p className="text-[10px] text-slate-400">{lv.contact}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lv.isActive ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600" : "bg-red-100 dark:bg-red-950/30 text-red-500"}`}>
                    {lv.isActive ? (locale === "th" ? "ใช้งาน" : "Active") : (locale === "th" ? "ปิดใช้" : "Inactive")}
                  </span>
                </div>

                {/* Contact */}
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5"/>{lv.phone}</div>
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5"/>{lv.email}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5"/>{lv.address}</div>
                </div>

                {/* Turnaround & Specialties */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-bold">
                    <Clock className="w-3 h-3"/>{lv.turnaroundDays} {locale === "th" ? "วัน" : "days"}
                  </span>
                  {(lv.specialties || []).map((s: string) => (
                    <span key={s} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] font-medium">{s}</span>
                  ))}
                </div>

                {/* Job Counts */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div><p className="font-extrabold text-lg text-accent">{lv.jobs.length}</p><span className="text-slate-400">{locale === "th" ? "Jobs ทั้งหมด" : "Total Jobs"}</span></div>
                  <div><p className="font-extrabold text-lg text-amber-500">{activeJobs}</p><span className="text-slate-400">{locale === "th" ? "กำลังดำเนิน" : "Active"}</span></div>
                  <div><p className="font-extrabold text-lg text-emerald-500">{counts["DELIVERED"] || 0}</p><span className="text-slate-400">{locale === "th" ? "ส่งแล้ว" : "Done"}</span></div>
                </div>

                {/* Expand button */}
                {lv.jobs.length > 0 && (
                  <button onClick={() => setExpanded(isOpen ? null : lv.id)}
                    className="w-full py-2 text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1">
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {locale === "th" ? `ดู Job Tickets ทั้งหมด (${lv.jobs.length})` : `View All Jobs (${lv.jobs.length})`}
                  </button>
                )}
              </div>

              {/* Expanded Job List */}
              {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-2">
                  {lv.jobs.map((j: any) => {
                    const order = db.orders.find((o: any) => o.id === j.orderId);
                    const customer = db.customers.find((c: any) => c.id === order?.customerId);
                    return (
                      <div key={j.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 dark:text-white">{customer?.name || (locale === "th" ? "ลูกค้าทั่วไป" : "Walk-in")}</p>
                          <p className="text-slate-400">{order?.orderNumber} · {j.lensType}</p>
                          <p className="text-slate-400">{locale === "th" ? "กำหนดส่ง:" : "Due:"} {new Date(j.targetDate).toLocaleDateString("th-TH")}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${JOB_STATUS_COLOR[j.status]}`}>
                          {locale === "th" ? JOB_STATUS_TH[j.status] : j.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
