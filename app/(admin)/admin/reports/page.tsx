// app/(admin)/admin/reports/page.tsx — Platform MRR & Revenue Report
"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign, TrendingUp, Users, Building2, AlertTriangle,
  Loader2, BarChart3, ArrowUpRight, ArrowDownRight, Clock, XCircle
} from "lucide-react";

interface ReportData {
  totalMrr: number;
  arr: number;
  mrrByPlan: Record<string, number>;
  counts: {
    total: number; paying: number; trial: number;
    suspended: number; dunning: number;
  };
  monthly: { month: string; signups: number; mrr: number }[];
  topTenants: { id: string; name: string; slug: string; planType: string; mrr: number }[];
}

const PLAN_COLORS: Record<string, string> = {
  starter:    "bg-slate-500",
  pro:        "bg-blue-500",
  enterprise: "bg-amber-500",
};
const PLAN_TEXT: Record<string, string> = {
  starter: "text-slate-400", pro: "text-blue-400", enterprise: "text-amber-400",
};

const MONTH_LABELS: Record<string, string> = {
  "01":"ม.ค.", "02":"ก.พ.", "03":"มี.ค.", "04":"เม.ย.",
  "05":"พ.ค.", "06":"มิ.ย.", "07":"ก.ค.", "08":"ส.ค.",
  "09":"ก.ย.", "10":"ต.ค.", "11":"พ.ย.", "12":"ธ.ค.",
};

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTH_LABELS[m] ?? m} ${parseInt(y) + 543}`;
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/reports", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject("error"))
      .then(setData)
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center min-h-[400px] gap-2 text-red-400">
      <XCircle className="w-5 h-5" /> {error || "ไม่พบข้อมูล"}
    </div>
  );

  // Bar chart: max MRR value for scaling
  const maxMonthlyMrr = Math.max(...data.monthly.map(m => m.mrr), 1);
  const maxSignups = Math.max(...data.monthly.map(m => m.signups), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue & MRR Report</h1>
        <p className="text-slate-400 text-sm mt-0.5">ข้อมูลรายได้แบบ real-time</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "MRR", value: `฿${data.totalMrr.toLocaleString()}`, icon: DollarSign, color: "from-emerald-600 to-green-700", sub: "รายได้ต่อเดือน" },
          { label: "ARR", value: `฿${data.arr.toLocaleString()}`, icon: TrendingUp, color: "from-violet-600 to-purple-700", sub: "คาดการณ์รายปี" },
          { label: "ลูกค้าชำระเงิน", value: data.counts.paying, icon: Users, color: "from-blue-600 to-blue-700", sub: `จาก ${data.counts.total} ร้าน` },
          { label: "ทดลองใช้", value: data.counts.trial, icon: Clock, color: "from-amber-600 to-orange-700", sub: "รอ convert" },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* MRR Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" /> MRR ย้อนหลัง 6 เดือน
          </h2>
          <div className="flex items-end gap-3 h-44">
            {data.monthly.map(m => {
              const pct = maxMonthlyMrr > 0 ? (m.mrr / maxMonthlyMrr) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {m.mrr > 0 ? `฿${m.mrr.toLocaleString()}` : "-"}
                  </span>
                  <div className="w-full bg-slate-800 rounded-t-lg overflow-hidden flex items-end" style={{ height: "100px" }}>
                    <div
                      className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{monthLabel(m.month)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* MRR by Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" /> MRR แยกตาม Plan
          </h2>
          <div className="space-y-4">
            {["enterprise", "pro", "starter"].map(plan => {
              const val = data.mrrByPlan[plan] ?? 0;
              const pct = data.totalMrr > 0 ? Math.round((val / data.totalMrr) * 100) : 0;
              return (
                <div key={plan}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className={`font-semibold capitalize ${PLAN_TEXT[plan]}`}>{plan}</span>
                    <span className="text-white font-bold">
                      {val > 0 ? `฿${val.toLocaleString()}` : "-"} <span className="text-slate-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${PLAN_COLORS[plan]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
            {data.counts.suspended > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-red-400" /> ถูกระงับ</span>
                <span className="text-red-400 font-semibold">{data.counts.suspended} ร้าน</span>
              </div>
            )}
            {data.counts.dunning > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-amber-400" /> ค้างชำระ (Dunning)</span>
                <span className="text-amber-400 font-semibold">{data.counts.dunning} ร้าน</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Signups */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" /> ร้านใหม่ต่อเดือน
        </h2>
        <div className="flex items-end gap-3 h-28">
          {data.monthly.map(m => {
            const pct = maxSignups > 0 ? (m.signups / maxSignups) * 100 : 0;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-slate-500 font-semibold">{m.signups > 0 ? m.signups : "-"}</span>
                <div className="w-full bg-slate-800 rounded-t-lg overflow-hidden flex items-end" style={{ height: "60px" }}>
                  <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg" style={{ height: `${Math.max(pct, 2)}%` }} />
                </div>
                <span className="text-[10px] text-slate-500">{monthLabel(m.month)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Tenants */}
      {data.topTenants.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Top Tenants by MRR
          </h2>
          <div className="space-y-2">
            {data.topTenants.map((t, i) => (
              <div key={t.id} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl">
                <span className="text-sm font-bold text-slate-500 w-5 text-center">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.slug}.eyefocus.app</p>
                </div>
                <span className={`text-xs font-bold capitalize ${PLAN_TEXT[t.planType] ?? "text-slate-400"}`}>{t.planType}</span>
                <span className="text-sm font-bold text-emerald-400">฿{t.mrr.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
