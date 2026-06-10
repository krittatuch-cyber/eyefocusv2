// app/(seller)/seller/loyalty/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Star, Award, Gift, Settings, Check, Edit2, Loader2 } from "lucide-react";

const INITIAL_TIERS = [
  { id: "BRONZE",   label: "Bronze",   minPts: 0,    maxPts: 299,  color: "text-orange-500 bg-orange-100 dark:bg-orange-950/20", benefits: ["ส่วนลด 0%", "รับแต้ม 10 บาท = 1 แต้ม"] },
  { id: "SILVER",   label: "Silver",   minPts: 300,  maxPts: 999,  color: "text-slate-500 bg-slate-100 dark:bg-slate-800", benefits: ["ส่วนลด 3%", "ล้างแว่นฟรี 2 ครั้ง/ปี"] },
  { id: "GOLD",     label: "Gold",     minPts: 1000, maxPts: 4999, color: "text-amber-500 bg-amber-100 dark:bg-amber-950/20", benefits: ["ส่วนลด 5%", "ล้างแว่นฟรีไม่จำกัด", "ปรับแว่นฟรี"] },
  { id: "PLATINUM", label: "Platinum", minPts: 5000, maxPts: null, color: "text-purple-500 bg-purple-100 dark:bg-purple-950/20", benefits: ["ส่วนลด 10%", "บริการ VIP", "ส่งแว่นถึงบ้าน", "ปรับแว่นฟรีตลอดชีพ"] },
];

export default function LoyaltyPage() {
  const { locale, formatCurrency } = useI18n();
  const [tiers, setTiers] = useState(INITIAL_TIERS);
  const [redeemRate, setRedeemRate] = useState(100);
  const [redeemValue, setRedeemValue] = useState(10);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editBenefit, setEditBenefit] = useState("");
  const [saved, setSaved] = useState(false);

  // Real data from API
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // Fetch customers to aggregate tier stats
    fetch("/api/customers?limit=1000", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        const customers = data.data ?? [];
        const counts: Record<string, number> = {};
        let pts = 0;
        for (const c of customers) {
          if (c.loyaltyTier) counts[c.loyaltyTier] = (counts[c.loyaltyTier] ?? 0) + 1;
          pts += c.loyaltyPoints ?? 0;
        }
        setTierCounts(counts);
        setTotalPoints(pts);
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const customersByTier = INITIAL_TIERS.map(t => ({
    ...t,
    count: tierCounts[t.id] ?? 0,
  }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {locale === "th" ? "โปรแกรมสะสมแต้มลูกค้า" : "Loyalty Program Settings"}
          </h2>
          <p className="text-xs text-slate-500">{locale === "th" ? "กำหนดระดับ Tier สิทธิพิเศษ และอัตราแลกแต้ม" : "Configure loyalty tiers, benefits, and redemption rates"}</p>
        </div>
        <button onClick={handleSave}
          className="px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
          {saved ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          <span>{saved ? (locale === "th" ? "บันทึกแล้ว!" : "Saved!") : (locale === "th" ? "บันทึกการตั้งค่า" : "Save Settings")}</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {customersByTier.map(t => (
          <div key={t.id} className={`p-4 rounded-2xl border ${t.color} border-current/20 space-y-1`}>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">{t.label}</span>
            </div>
            <p className="text-2xl font-extrabold">{t.count}</p>
            <p className="text-[10px] opacity-70">{locale === "th" ? "ลูกค้า" : "customers"}</p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Award className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{locale === "th" ? "แต้มสะสมรวมทั้งหมด" : "Total Points Issued"}</p>
            {loadingStats
              ? <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
              : <p className="text-xl font-extrabold text-slate-900 dark:text-white">{totalPoints.toLocaleString()} pts</p>
            }
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Gift className="w-3.5 h-3.5"/>{locale === "th" ? "อัตราแลกแต้ม" : "Redemption Rate"}</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input type="number" value={redeemRate} onChange={e => setRedeemRate(+e.target.value)}
                className="w-16 px-2 py-1 text-xs text-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none font-bold" />
              <span className="text-xs text-slate-500">pts =</span>
              <input type="number" value={redeemValue} onChange={e => setRedeemValue(+e.target.value)}
                className="w-16 px-2 py-1 text-xs text-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none font-bold" />
              <span className="text-xs text-slate-500">{locale === "th" ? "บาท" : "THB"}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">{locale === "th" ? `ลูกค้าทุกๆ 10 บาท จะได้รับ 1 แต้ม` : "Every 10 THB spent = 1 point earned"}</p>
        </div>
      </div>

      {/* Tier Config Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{locale === "th" ? "การตั้งค่า Tier และสิทธิพิเศษ" : "Tier Configuration & Benefits"}</h3>
        {tiers.map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-xl text-sm font-extrabold ${t.color}`}>{t.label}</span>
                <span className="text-xs text-slate-500">
                  {t.minPts.toLocaleString()} – {t.maxPts ? t.maxPts.toLocaleString() : "∞"} pts
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {customersByTier.find(c => c.id === t.id)?.count || 0} {locale === "th" ? "ลูกค้า" : "members"}
              </span>
            </div>
            <div className="space-y-1.5">
              {t.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">{b}</span>
                </div>
              ))}
            </div>
            {editingTier === t.id ? (
              <div className="flex gap-2">
                <input value={editBenefit} onChange={e => setEditBenefit(e.target.value)}
                  placeholder={locale === "th" ? "เพิ่มสิทธิพิเศษ..." : "Add benefit..."}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none" />
                <button onClick={() => {
                  if (editBenefit) {
                    setTiers(prev => prev.map(ti => ti.id === t.id ? { ...ti, benefits: [...ti.benefits, editBenefit] } : ti));
                    setEditBenefit(""); setEditingTier(null);
                  }
                }} className="px-3 py-1.5 text-xs font-bold bg-accent text-white rounded-xl cursor-pointer">
                  {locale === "th" ? "เพิ่ม" : "Add"}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingTier(t.id)}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-accent cursor-pointer">
                <Edit2 className="w-3 h-3" />{locale === "th" ? "เพิ่มสิทธิพิเศษ" : "Add benefit"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
