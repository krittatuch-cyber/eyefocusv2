// app/(admin)/admin/dashboard/page.tsx — Super Admin Dashboard
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Users, TrendingUp, DollarSign, AlertTriangle,
  Clock, Shield, CheckCircle, ChevronRight, Loader2,
  BarChart3, Zap, ArrowUpRight
} from "lucide-react";

interface Summary {
  total: number; active: number; trial: number; suspended: number; mrr: number;
  byPlan: { starter: number; pro: number; enterprise: number };
}
interface Tenant {
  id: string; name: string; slug: string; planType: string;
  isActive: boolean; isSuspended: boolean; isInTrial: boolean;
  trialDaysRemaining: number | null; currentBranches: number;
  currentUsers: number; mrr: number; createdAt: string;
  dunningCount: number;
}

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-slate-700 text-slate-300",
  pro: "bg-blue-600/20 text-blue-400 border border-blue-600/30",
  enterprise: "bg-amber-600/20 text-amber-400 border border-amber-600/30",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/tenants", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setSummary(data.summary); setTenants(data.tenants); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
    </div>
  );

  const recent = tenants.slice(0, 5);
  const needsAttention = tenants.filter(t => t.isSuspended || t.dunningCount > 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">ภาพรวม EyeFocus SaaS ทั้งหมด</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "MRR", value: `฿${(summary?.mrr ?? 0).toLocaleString()}`, icon: DollarSign, color: "from-emerald-600 to-green-700", sub: "รายได้ต่อเดือน" },
          { label: "ร้านทั้งหมด", value: summary?.total ?? 0, icon: Building2, color: "from-blue-600 to-blue-700", sub: `${summary?.active ?? 0} ใช้งานอยู่` },
          { label: "ทดลองใช้", value: summary?.trial ?? 0, icon: Clock, color: "from-violet-600 to-purple-700", sub: "รอ convert" },
          { label: "ถูกระงับ", value: summary?.suspended ?? 0, icon: AlertTriangle, color: "from-red-600 to-rose-700", sub: "ต้องดูแล" },
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
        {/* Plan distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" /> Plan Distribution
          </h2>
          <div className="space-y-3">
            {[
              { plan: "Enterprise", key: "enterprise", color: "bg-amber-500" },
              { plan: "Pro", key: "pro", color: "bg-blue-500" },
              { plan: "Starter", key: "starter", color: "bg-slate-500" },
            ].map(({ plan, key, color }) => {
              const val = summary?.byPlan[key as keyof typeof summary.byPlan] ?? 0;
              const pct = summary?.total ? Math.round((val / summary.total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>{plan}</span>
                    <span className="font-semibold text-white">{val} ร้าน</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Projected ARR</span>
              <span className="text-emerald-400 font-bold">฿{((summary?.mrr ?? 0) * 12).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Needs attention */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> ต้องดูแล
          </h2>
          {needsAttention.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-sm text-slate-400">ทุกร้านปกติดี</p>
            </div>
          ) : (
            <div className="space-y-2">
              {needsAttention.slice(0, 5).map(t => (
                <button key={t.id} onClick={() => router.push(`/admin/tenants/${t.id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition text-left">
                  <div className={`w-2 h-2 rounded-full ${t.isSuspended ? "bg-red-500" : "bg-amber-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.isSuspended ? "ถูกระงับ" : `Dunning ×${t.dunningCount}`}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent signups */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" /> ลงทะเบียนล่าสุด
          </h2>
          <div className="space-y-2">
            {recent.map(t => (
              <button key={t.id} onClick={() => router.push(`/admin/tenants/${t.id}`)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition text-left">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{t.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.slug}.eyefocus.app</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[t.planType] ?? "bg-slate-700 text-slate-400"}`}>
                  {t.planType}
                </span>
              </button>
            ))}
          </div>
          <button onClick={() => router.push("/admin/tenants")}
            className="mt-3 w-full text-xs text-violet-400 hover:text-violet-300 flex items-center justify-center gap-1.5 transition">
            ดูทั้งหมด <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
