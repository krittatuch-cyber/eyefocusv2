// app/(public)/register/page.tsx — Self-service shop registration for EyeFocus SaaS
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, Store, User, Mail, Phone, Lock, ArrowRight,
  CheckCircle, Loader2, Globe, Building2, ChevronRight, Sparkles
} from "lucide-react";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 590,
    branches: 1,
    users: 5,
    features: ["POS ขายสินค้า", "จัดการลูกค้า", "สต็อกสินค้า", "รายงานพื้นฐาน"],
    color: "from-slate-600 to-slate-700",
    badge: "เริ่มต้น",
    badgeColor: "bg-slate-700 text-slate-200",
  },
  {
    id: "pro",
    name: "Pro",
    price: 1490,
    branches: 3,
    users: 15,
    features: ["ทุกอย่างใน Starter", "หลายสาขา (3 สาขา)", "Commission & bonus", "Lab tracking", "รายงานขั้นสูง"],
    color: "from-blue-600 to-violet-600",
    badge: "แนะนำ",
    badgeColor: "bg-blue-500 text-white",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 3990,
    branches: -1,
    users: -1,
    features: ["ทุกอย่างใน Pro", "สาขาไม่จำกัด", "ผู้ใช้ไม่จำกัด", "Priority support", "Custom features"],
    color: "from-amber-500 to-orange-600",
    badge: "Enterprise",
    badgeColor: "bg-amber-500 text-white",
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    // Shop info
    shopName: "",
    shopSlug: "",
    shopPhone: "",
    // Owner info
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
  });

  const set = (k: keyof typeof form, v: string) => {
    setForm(p => {
      const next = { ...p, [k]: v };
      // Auto-generate slug from shop name
      if (k === "shopName") next.shopSlug = slugify(v);
      return next;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: form.shopName,
          shopSlug: form.shopSlug,
          shopPhone: form.shopPhone,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          ownerPassword: form.ownerPassword,
          planType: selectedPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm";
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">EyeFocus</span>
        </div>
        <a href="/login" className="text-sm text-slate-400 hover:text-white transition">
          มีบัญชีแล้ว? <span className="text-blue-400">เข้าสู่ระบบ</span>
        </a>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                  step >= s
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-500"
                }`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : <span>{s}</span>}
                  {s === 1 ? "เลือกแผน" : "ข้อมูลร้าน"}
                </div>
                {s < 2 && <ChevronRight className="w-4 h-4 text-slate-600" />}
              </React.Fragment>
            ))}
          </div>

          {/* ─── Step 1: Choose Plan ─────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">เลือกแผนที่เหมาะกับร้านของคุณ</h1>
                <p className="text-slate-400">ทดลองใช้ฟรี 30 วัน ไม่ต้องใส่บัตรเครดิต</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative text-left rounded-2xl border-2 p-6 transition-all ${
                      selectedPlan === plan.id
                        ? "border-blue-500 bg-slate-800/80 shadow-lg shadow-blue-500/10"
                        : "border-slate-700 bg-slate-900 hover:border-slate-600"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> แนะนำ
                        </span>
                      </div>
                    )}

                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                      <Building2 className="w-5 h-5 text-white" />
                    </div>

                    <div className="mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.badgeColor}`}>
                        {plan.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mt-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1 mb-4">
                      <span className="text-2xl font-bold text-white">฿{plan.price.toLocaleString()}</span>
                      <span className="text-slate-400 text-sm">/เดือน</span>
                    </div>

                    <div className="text-xs text-slate-400 mb-4">
                      {plan.branches === -1 ? "สาขาไม่จำกัด" : `${plan.branches} สาขา`}
                      {" · "}
                      {plan.users === -1 ? "ผู้ใช้ไม่จำกัด" : `${plan.users} ผู้ใช้`}
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {selectedPlan === plan.id && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <span className="text-blue-400 text-xs font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> เลือกแผนนี้
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition"
                >
                  ต่อไป — กรอกข้อมูลร้าน <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-slate-500 mt-3">ทดลองฟรี 30 วัน • ยกเลิกได้ทุกเมื่อ • ไม่มีค่าใช้จ่ายซ่อน</p>
              </div>
            </div>
          )}

          {/* ─── Step 2: Shop + Owner Info ─────────────────────────────────── */}
          {step === 2 && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">ข้อมูลร้านและบัญชีผู้ใช้</h1>
                <p className="text-slate-400">
                  แผน <span className="text-white font-semibold capitalize">{selectedPlan}</span>
                  {" — "}
                  <button onClick={() => setStep(1)} className="text-blue-400 hover:underline">เปลี่ยน</button>
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
                {/* Shop Info */}
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-4">
                    <Store className="w-4 h-4 text-blue-400" /> ข้อมูลร้าน
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelCls}>ชื่อร้าน *</label>
                      <input
                        type="text"
                        placeholder="เช่น ร้านแว่นตาทองหล่อ"
                        value={form.shopName}
                        onChange={e => set("shopName", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Shop URL (Subdomain) *</label>
                      <div className="flex rounded-xl overflow-hidden border border-slate-700 focus-within:ring-2 focus-within:ring-blue-500">
                        <input
                          type="text"
                          placeholder="tonglor"
                          value={form.shopSlug}
                          onChange={e => set("shopSlug", slugify(e.target.value))}
                          className="flex-1 bg-slate-800/60 px-3 py-3 text-white placeholder-slate-500 focus:outline-none text-sm"
                        />
                        <div className="bg-slate-700/50 px-3 flex items-center text-slate-400 text-xs border-l border-slate-700">
                          .eyefocus.app
                        </div>
                      </div>
                      {form.shopSlug && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {form.shopSlug}.eyefocus.app
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>เบอร์โทรศัพท์</label>
                      <input
                        type="tel"
                        placeholder="02-XXX-XXXX"
                        value={form.shopPhone}
                        onChange={e => set("shopPhone", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800" />

                {/* Owner Info */}
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-4">
                    <User className="w-4 h-4 text-green-400" /> บัญชีเจ้าของร้าน
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelCls}>ชื่อ-นามสกุล *</label>
                      <input
                        type="text"
                        placeholder="ชื่อผู้ใช้งาน"
                        value={form.ownerName}
                        onChange={e => set("ownerName", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>อีเมล *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          placeholder="owner@example.com"
                          value={form.ownerEmail}
                          onChange={e => set("ownerEmail", e.target.value)}
                          className={`${inputCls} pl-10`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>รหัสผ่าน *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="อย่างน้อย 8 ตัวอักษร"
                          value={form.ownerPassword}
                          onChange={e => set("ownerPassword", e.target.value)}
                          className={`${inputCls} pl-10 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 font-semibold py-3.5 rounded-xl transition text-sm"
                  >
                    ← ย้อนกลับ
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !form.shopName || !form.shopSlug || !form.ownerEmail || !form.ownerPassword || form.ownerPassword.length < 8}
                    className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้างร้าน...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> สร้างร้านและเริ่มทดลองใช้</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 3: Success ─────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">ร้านของคุณพร้อมแล้ว! 🎉</h1>
              <p className="text-slate-400 mb-2">
                <span className="text-white font-semibold">{form.shopName}</span>
              </p>
              <div className="bg-slate-800 rounded-xl px-4 py-3 mb-6 flex items-center justify-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-blue-400" />
                <code className="text-blue-400">{form.shopSlug}.eyefocus.app</code>
              </div>
              <p className="text-slate-400 text-sm mb-8">
                ทดลองฟรี <span className="text-white font-semibold">30 วัน</span> — ไม่ต้องใส่บัตรเครดิต<br />
                เข้าสู่ระบบด้วยอีเมล <span className="text-white">{form.ownerEmail}</span>
              </p>
              <button
                onClick={() => router.push("/login")}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition"
              >
                เข้าสู่ระบบ <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
