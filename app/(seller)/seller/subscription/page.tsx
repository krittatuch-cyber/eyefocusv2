// app/(seller)/seller/subscription/page.tsx — Plan & Subscription management
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, CheckCircle, Clock, Building2, Users, Star,
  Crown, Shield, AlertTriangle, Loader2, ArrowRight, ChevronRight
} from "lucide-react";
import { PLANS, type PlanType } from "@/lib/plans";

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  planType: string;
  isInTrial: boolean;
  trialDaysRemaining: number | null;
  trialEndsAt: string | null;
  planExpiresAt: string | null;
  isSuspended: boolean;
  maxBranches: number;
  maxUsers: number;
  currentBranches: number;
  currentUsers: number;
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  starter: Shield,
  pro: Star,
  enterprise: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  starter: "from-slate-600 to-slate-700",
  pro: "from-blue-600 to-violet-600",
  enterprise: "from-amber-500 to-orange-600",
};

export default function SubscriptionPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenant", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setTenant(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === tenant?.planType) return;
    setUpgrading(planId);
    // TODO: Connect to Omise payment in Phase 3
    // For now, show contact message
    await new Promise(r => setTimeout(r, 800));
    alert(`กรุณาติดต่อ support@eyefocus.app เพื่ออัปเกรดเป็นแผน ${planId.toUpperCase()}\n\nระบบ Omise payment จะเปิดให้เร็วๆ นี้`);
    setUpgrading(null);
  };

  const usagePct = (current: number, max: number) => max === -1 ? 0 : Math.min(100, (current / max) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const currentPlan = PLANS[tenant?.planType as PlanType] ?? PLANS.starter;
  const PlanIcon = PLAN_ICONS[currentPlan.id] ?? Shield;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">แผนการใช้งาน</h1>
        <p className="text-slate-400 text-sm">จัดการ subscription และดูการใช้งานของร้านคุณ</p>
      </div>

      {/* Current Plan Card */}
      {tenant && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${PLAN_COLORS[currentPlan.id]} flex items-center justify-center shrink-0`}>
              <PlanIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-white">{currentPlan.nameTh} ({currentPlan.name})</span>
                {tenant.isInTrial && (
                  <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                    ทดลองใช้
                  </span>
                )}
                {tenant.isSuspended && (
                  <span className="bg-red-500/20 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-500/30">
                    ถูกระงับ
                  </span>
                )}
              </div>
              {tenant.isInTrial && tenant.trialDaysRemaining !== null && (
                <p className="text-sm text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  ทดลองฟรีเหลือ{" "}
                  <span className={`font-semibold ${tenant.trialDaysRemaining <= 7 ? "text-orange-400" : "text-white"}`}>
                    {tenant.trialDaysRemaining} วัน
                  </span>
                  {tenant.trialEndsAt && ` (ถึง ${new Date(tenant.trialEndsAt).toLocaleDateString("th-TH")})`}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">฿{currentPlan.price.toLocaleString()}</p>
              <p className="text-xs text-slate-400">ต่อเดือน</p>
            </div>
          </div>

          {/* Usage meters */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> สาขา</span>
                <span>{tenant.currentBranches}/{tenant.maxBranches === -1 ? "∞" : tenant.maxBranches}</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${usagePct(tenant.currentBranches, tenant.maxBranches)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> ผู้ใช้งาน</span>
                <span>{tenant.currentUsers}/{tenant.maxUsers === -1 ? "∞" : tenant.maxUsers}</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${usagePct(tenant.currentUsers, tenant.maxUsers)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">เปรียบเทียบแผน</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(PLANS).map((plan) => {
            const Icon = PLAN_ICONS[plan.id] ?? Shield;
            const isCurrent = plan.id === tenant?.planType;
            const isDowngrade = Object.values(PLANS).indexOf(plan) < Object.values(PLANS).indexOf(currentPlan);

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-5 transition ${
                  isCurrent
                    ? "border-blue-500 bg-slate-800/80"
                    : "border-slate-700 bg-slate-900 hover:border-slate-600"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      แผนปัจจุบัน
                    </span>
                  </div>
                )}

                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${PLAN_COLORS[plan.id]} flex items-center justify-center mb-3`}>
                  <Icon className="w-4.5 h-4.5 text-white" style={{ width: "18px", height: "18px" }} />
                </div>

                <h3 className="text-base font-bold text-white">{plan.nameTh}</h3>
                <div className="flex items-baseline gap-1 mt-1 mb-3">
                  <span className="text-xl font-bold text-white">฿{plan.price.toLocaleString()}</span>
                  <span className="text-slate-400 text-xs">/เดือน</span>
                </div>

                <div className="text-xs text-slate-400 mb-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" />
                    {plan.maxBranches === -1 ? "ไม่จำกัดสาขา" : `${plan.maxBranches} สาขา`}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    {plan.maxUsers === -1 ? "ไม่จำกัดผู้ใช้" : `${plan.maxUsers} ผู้ใช้`}
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {plan.features.slice(0, 5).map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                      {featureLabel(f)}
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-xs text-slate-500">+{plan.features.length - 5} ฟีเจอร์เพิ่มเติม</li>
                  )}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || !!upgrading}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? "bg-slate-700 text-slate-400 cursor-default"
                      : isDowngrade
                        ? "border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  {upgrading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    "แผนปัจจุบัน"
                  ) : isDowngrade ? (
                    "ดาวน์เกรด"
                  ) : (
                    <><Zap className="w-3.5 h-3.5" /> อัปเกรด</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-5 flex items-center gap-4">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">ต้องการความช่วยเหลือ?</p>
          <p className="text-xs text-slate-400 mt-0.5">
            ติดต่อทีมงาน EyeFocus ที่{" "}
            <a href="mailto:support@eyefocus.app" className="text-blue-400 hover:underline">
              support@eyefocus.app
            </a>
            {" "}หรือ LINE: @eyefocus
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </div>
    </div>
  );
}

function featureLabel(key: string): string {
  const labels: Record<string, string> = {
    pos: "ระบบ POS ขายสินค้า",
    customers: "จัดการลูกค้า",
    stock: "จัดการสต็อก",
    prescriptions: "ค่าสายตา",
    appointments: "นัดหมาย",
    reports_basic: "รายงานพื้นฐาน",
    reports_advanced: "รายงานขั้นสูง",
    commission: "คอมมิชชั่น",
    lab_tracking: "Lab tracking",
    claims: "เคลมประกัน",
    tax_invoices: "ใบกำกับภาษี",
    multi_branch: "หลายสาขา",
    branch_comparison: "เปรียบเทียบสาขา",
    audit_logs: "Audit logs",
    loyalty: "Loyalty points",
    suppliers: "ซัพพลายเออร์",
    installments: "ผ่อนชำระ",
  };
  return labels[key] ?? key;
}
