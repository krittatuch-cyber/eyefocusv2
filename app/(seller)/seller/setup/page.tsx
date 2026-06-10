// app/(seller)/seller/setup/page.tsx — First-run Setup Wizard for new tenants
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Package, Users, CheckCircle, ArrowRight,
  Loader2, Eye, Store, ChevronRight, Sparkles, Plus, X
} from "lucide-react";

interface SetupStep {
  id: string;
  title: string;
  titleTh: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const STEPS: SetupStep[] = [
  { id: "branch",  title: "Branch",   titleTh: "ข้อมูลสาขา",    description: "กรอกข้อมูลสาขาหลักของร้าน",       icon: Building2, color: "from-blue-600 to-blue-700" },
  { id: "product", title: "Products", titleTh: "สินค้าตั้งต้น",  description: "เพิ่มสินค้า 1-3 รายการเพื่อเริ่มต้น", icon: Package,   color: "from-violet-600 to-violet-700" },
  { id: "staff",   title: "Staff",    titleTh: "เพิ่มพนักงาน",   description: "เชิญพนักงานเข้าร้าน (ข้ามได้)",    icon: Users,     color: "from-emerald-600 to-emerald-700" },
  { id: "done",    title: "Ready!",   titleTh: "พร้อมใช้งาน!",   description: "ร้านของคุณพร้อมแล้ว",              icon: Sparkles,  color: "from-amber-500 to-orange-600" },
];

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Branch form
  const [branch, setBranch] = useState({ phone: "", address: "", openTime: "09:00", closeTime: "20:00" });
  // Product form
  const [products, setProducts] = useState([{ name: "", price: "" }]);
  // Staff form
  const [staffList, setStaffList] = useState([{ name: "", email: "", role: "SELLER" }]);

  // Check if setup already done
  useEffect(() => {
    const done = localStorage.getItem("setup_complete");
    if (done === "true") router.replace("/seller/dashboard");
  }, [router]);

  const handleBranch = async () => {
    setSaving(true); setError(null);
    try {
      // Update the main branch with extra info
      const res = await fetch("/api/branches", {
        method: "GET", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load branch");
      const data = await res.json();
      const mainBranch = (data.data ?? data)[0];
      if (mainBranch) {
        await fetch(`/api/branches/${mainBranch.id}`, {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(branch),
        });
      }
      setStep(1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally { setSaving(false); }
  };

  const handleProducts = async () => {
    const valid = products.filter(p => p.name.trim() && Number(p.price) > 0);
    if (!valid.length) { setStep(2); return; } // skip if no valid products
    setSaving(true); setError(null);
    try {
      for (const p of valid) {
        await fetch("/api/products", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: p.name.trim(), price: Number(p.price),
            category: "OTHER", unit: "ชิ้น", isActive: true,
          }),
        });
      }
      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally { setSaving(false); }
  };

  const handleStaff = async () => {
    const valid = staffList.filter(s => s.name.trim() && s.email.includes("@"));
    setSaving(true); setError(null);
    try {
      for (const s of valid) {
        await fetch("/api/users", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: s.name, email: s.email, password: "EyeFocus@2025", role: s.role }),
        });
      }
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally { setSaving(false); }
  };

  const handleFinish = () => {
    localStorage.setItem("setup_complete", "true");
    router.push("/seller/dashboard");
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">

      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              i < step ? "bg-green-600/20 text-green-400 border border-green-600/30" :
              i === step ? "bg-blue-600 text-white" :
              "bg-slate-800 text-slate-500"
            }`}>
              {i < step ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 flex items-center justify-center">{i + 1}</span>}
              <span className="hidden sm:inline">{s.titleTh}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-700" />}
          </React.Fragment>
        ))}
      </div>

      <div className="w-full max-w-lg">
        {/* Step header */}
        <div className="text-center mb-8">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center mx-auto mb-4`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{current.titleTh}</h1>
          <p className="text-slate-400 text-sm mt-1">{current.description}</p>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">

          {/* ── Step 0: Branch Info ──────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">เวลาเปิด</label>
                  <input type="time" value={branch.openTime} onChange={e => setBranch(p => ({ ...p, openTime: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">เวลาปิด</label>
                  <input type="time" value={branch.closeTime} onChange={e => setBranch(p => ({ ...p, closeTime: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">เบอร์โทรสาขา</label>
                <input type="tel" placeholder="02-XXX-XXXX" value={branch.phone} onChange={e => setBranch(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">ที่อยู่</label>
                <textarea rows={2} placeholder="ที่อยู่สาขา..." value={branch.address} onChange={e => setBranch(p => ({ ...p, address: e.target.value }))} className={`${inputCls} resize-none`} />
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(1)} className="flex-1 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 py-2.5 rounded-xl transition">ข้ามไปก่อน</button>
                <button onClick={handleBranch} disabled={saving} className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> บันทึกและต่อไป</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Products ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-3">
              {products.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" placeholder={`สินค้า ${i + 1} เช่น กรอบแว่นไทเทเนียม`} value={p.name} onChange={e => setProducts(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={`${inputCls} flex-1`} />
                  <input type="number" placeholder="ราคา" value={p.price} onChange={e => setProducts(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className={`${inputCls} w-28`} />
                  {products.length > 1 && (
                    <button onClick={() => setProducts(prev => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 transition">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {products.length < 5 && (
                <button onClick={() => setProducts(p => [...p, { name: "", price: "" }])} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition">
                  <Plus className="w-4 h-4" /> เพิ่มสินค้า
                </button>
              )}
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="flex-1 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 py-2.5 rounded-xl transition">ข้าม</button>
                <button onClick={handleProducts} disabled={saving} className="flex-[2] bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> บันทึกสินค้า</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Staff ────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2.5">
                💡 รหัสผ่านเริ่มต้น: <code className="text-blue-400">EyeFocus@2025</code> — พนักงานสามารถเปลี่ยนได้ภายหลัง
              </p>
              {staffList.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" placeholder="ชื่อพนักงาน" value={s.name} onChange={e => setStaffList(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={`${inputCls} flex-1`} />
                  <input type="email" placeholder="email" value={s.email} onChange={e => setStaffList(prev => prev.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} className={`${inputCls} flex-1`} />
                  <select value={s.role} onChange={e => setStaffList(prev => prev.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="SELLER">พนักงาน</option>
                    <option value="MANAGER">ผู้จัดการ</option>
                  </select>
                  {staffList.length > 1 && (
                    <button onClick={() => setStaffList(prev => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 transition">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {staffList.length < 5 && (
                <button onClick={() => setStaffList(p => [...p, { name: "", email: "", role: "SELLER" }])} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition">
                  <Plus className="w-4 h-4" /> เพิ่มพนักงาน
                </button>
              )}
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(3)} className="flex-1 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 py-2.5 rounded-xl transition">ข้ามไปก่อน</button>
                <button onClick={handleStaff} disabled={saving} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Users className="w-4 h-4" /> เพิ่มพนักงาน</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">ร้านของคุณพร้อมแล้ว! 🎉</h2>
                <p className="text-slate-400 text-sm mt-1">คุณสามารถเริ่มขายสินค้าได้ทันที</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { icon: Store, label: "POS ขายสินค้า", href: "/user/pos" },
                  { icon: Users, label: "จัดการพนักงาน", href: "/seller/users" },
                  { icon: Package, label: "จัดการสินค้า", href: "/seller/products" },
                  { icon: Eye, label: "Dashboard", href: "/seller/dashboard" },
                ].map(({ icon: I, label, href }) => (
                  <button key={href} onClick={() => { localStorage.setItem("setup_complete", "true"); router.push(href); }}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white rounded-xl px-3 py-2.5 text-xs font-medium transition">
                    <I className="w-4 h-4 text-blue-400" />{label}
                  </button>
                ))}
              </div>
              <button onClick={handleFinish} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> ไปหน้า Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
