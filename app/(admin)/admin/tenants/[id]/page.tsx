// app/(admin)/admin/tenants/[id]/page.tsx — Tenant Detail & Management
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Building2, Users, Clock, CreditCard, Shield,
  AlertTriangle, CheckCircle, Loader2, ChevronDown, Zap,
  RefreshCw, DollarSign, GitBranch
} from "lucide-react";
import { PLANS, type PlanType } from "@/lib/plans";

interface TenantDetail {
  id: string; name: string; slug: string; planType: string;
  isActive: boolean; isSuspended: boolean; trialEndsAt: string | null;
  planExpiresAt: string | null; maxBranches: number; maxUsers: number;
  billingEmail: string | null; paymentMethod: string | null;
  dunningCount: number; omiseCustomerId: string | null;
  lastChargeId: string | null; createdAt: string;
}

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("pro");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, { credentials: "include" });
      if (res.ok) { const data = await res.json(); setTenant(data); setSelectedPlan(data.planType ?? "starter"); }
    } finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (action: string, planId?: string) => {
    setActioning(true);
    try {
      await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, planId }),
      });
      await load();
    } finally { setActioning(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-violet-400" /></div>;
  if (!tenant) return <div className="text-center py-16 text-slate-400">ไม่พบข้อมูล</div>;

  const trialDays = tenant.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  const isInTrial = trialDays !== null && trialDays > 0;
  const currentPlan = PLANS[tenant.planType as PlanType] ?? PLANS.starter;

  const InfoRow = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-800/60 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-amber-400" : "text-white"}`}>{value}</span>
    </div>
  );

  const selectCls = "bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/admin/tenants")} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{tenant.name}</h1>
            {tenant.isSuspended && (
              <span className="text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full">ถูกระงับ</span>
            )}
            {isInTrial && (
              <span className="text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full">ทดลองใช้</span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-0.5">{tenant.slug}.eyefocus.app</p>
        </div>
        <button onClick={load} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tenant Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-0">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">ข้อมูลร้าน</h2>
          <InfoRow label="Plan" value={<span className="capitalize">{tenant.planType}</span>} />
          <InfoRow label="MRR" value={`฿${currentPlan.price.toLocaleString()}/เดือน`} highlight />
          <InfoRow label="สาขาสูงสุด" value={tenant.maxBranches === 999 ? "ไม่จำกัด" : tenant.maxBranches} />
          <InfoRow label="Users สูงสุด" value={tenant.maxUsers === 999 ? "ไม่จำกัด" : tenant.maxUsers} />
          <InfoRow label="วันที่สมัคร" value={new Date(tenant.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })} />
          {isInTrial && <InfoRow label="Trial เหลือ" value={`${trialDays} วัน`} highlight />}
          {tenant.planExpiresAt && <InfoRow label="Plan หมดอายุ" value={new Date(tenant.planExpiresAt).toLocaleDateString("th-TH")} />}
        </div>

        {/* Billing Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">การชำระเงิน</h2>
          <InfoRow label="Billing Email" value={tenant.billingEmail ?? "-"} />
          <InfoRow label="วิธีชำระ" value={tenant.paymentMethod ?? "-"} />
          <InfoRow label="Omise Customer" value={tenant.omiseCustomerId ? "✅ มีบัตรบันทึก" : "❌ ไม่มี"} />
          <InfoRow label="Last Charge" value={tenant.lastChargeId ? `${tenant.lastChargeId.substring(0, 15)}...` : "-"} />
          <InfoRow
            label="Dunning Count"
            value={tenant.dunningCount > 0 ? `⚠️ ${tenant.dunningCount} ครั้ง` : "✅ ปกติ"}
            highlight={tenant.dunningCount > 0}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5">จัดการ</h2>
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Suspend/Activate */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-1">
              {tenant.isSuspended ? "เปิดใช้งานร้าน" : "ระงับร้าน"}
            </p>
            <p className="text-xs text-slate-400 mb-3">
              {tenant.isSuspended ? "ยืนยันการเปิดใช้งานอีกครั้ง" : "ร้านจะไม่สามารถ login ได้ชั่วคราว"}
            </p>
            <button onClick={() => doAction(tenant.isSuspended ? "activate" : "suspend")} disabled={actioning}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
                tenant.isSuspended
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30"
              }`}>
              {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> :
                tenant.isSuspended ? <><CheckCircle className="w-4 h-4" /> เปิดใช้งาน</> :
                <><AlertTriangle className="w-4 h-4" /> ระงับร้าน</>}
            </button>
          </div>

          {/* Change Plan */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-3">เปลี่ยน Plan</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value as PlanType)} className={`${selectCls} w-full appearance-none pr-8`}>
                  {Object.values(PLANS).map(p => (
                    <option key={p.id} value={p.id}>{p.nameTh} (฿{p.price.toLocaleString()})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
              <button onClick={() => doAction("change_plan", selectedPlan)} disabled={actioning || selectedPlan === tenant.planType}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition flex items-center gap-1.5">
                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> เปลี่ยน</>}
              </button>
            </div>
          </div>

          {/* Extend Trial */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-1">ขยาย Trial +14 วัน</p>
            <p className="text-xs text-slate-400 mb-3">สำหรับลูกค้าที่ขอขยายเวลาทดลองใช้</p>
            <button onClick={() => doAction("extend_trial")} disabled={actioning}
              className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
              {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Clock className="w-4 h-4" /> ขยาย Trial</>}
            </button>
          </div>

          {/* Reset Dunning */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-1">Reset Dunning</p>
            <p className="text-xs text-slate-400 mb-3">ล้างประวัติการชำระล้มเหลวและเปิดใช้งาน</p>
            <button onClick={() => doAction("reset_dunning")} disabled={actioning || tenant.dunningCount === 0}
              className="w-full bg-amber-600/20 hover:bg-amber-600/40 disabled:opacity-40 text-amber-400 border border-amber-600/30 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
              {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Reset Dunning</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
