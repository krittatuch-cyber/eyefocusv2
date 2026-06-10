// app/(admin)/admin/checklist/page.tsx — Pre-launch Checklist (G6)
"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle, XCircle, AlertTriangle, Loader2,
  Shield, Database, Globe, CreditCard, Lock, Bell, Zap
} from "lucide-react";

interface CheckItem {
  id: string;
  category: string;
  label: string;
  description: string;
  how: string;
  status: "pass" | "fail" | "warn" | "unknown";
}

const CHECKLIST: Omit<CheckItem, "status">[] = [
  // Security
  { id: "jwt-secret", category: "Security", label: "JWT Secret ตั้งค่าแล้ว", description: "JWT_SECRET ต้องเป็น env var จริง ไม่ใช่ค่า default", how: "Set JWT_SECRET in Cloudflare Secrets: npx wrangler secret put JWT_SECRET" },
  { id: "encryption-key", category: "Security", label: "ENCRYPTION_KEY ตั้งค่าแล้ว", description: "สำหรับ encrypt taxId และข้อมูล PII", how: "Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" then: npx wrangler secret put ENCRYPTION_KEY" },
  { id: "https-only", category: "Security", label: "HTTPS Only", description: "ทุก request ต้องเป็น HTTPS", how: "Cloudflare Workers ใช้ HTTPS by default ✅" },
  { id: "httponly-cookie", category: "Security", label: "HttpOnly Cookie", description: "auth_token cookie เป็น httpOnly + secure", how: "✅ ตั้งค่าแล้วใน login route" },
  // Billing
  { id: "omise-keys", category: "Billing", label: "Omise API Keys ตั้งค่าแล้ว", description: "OMISE_PUBLIC_KEY + OMISE_SECRET_KEY + OMISE_WEBHOOK_SECRET", how: "npx wrangler secret put OMISE_PUBLIC_KEY\nnpx wrangler secret put OMISE_SECRET_KEY\nnpx wrangler secret put OMISE_WEBHOOK_SECRET" },
  { id: "webhook-url", category: "Billing", label: "Omise Webhook URL ตั้งค่าแล้ว", description: "Omise Dashboard → Webhooks → เพิ่ม URL", how: "https://eyeforcusv2.krittatuch.workers.dev/api/billing/webhook" },
  { id: "test-payment", category: "Billing", label: "ทดสอบชำระเงิน PromptPay", description: "ทดสอบ end-to-end payment flow ด้วย test key", how: "ใช้ Omise test key สแกน QR และยืนยันว่า plan activate" },
  // Database
  { id: "db-migrations", category: "Database", label: "Migrations ครบทั้งหมด", description: "billing-migration.mjs + phase4-migration.mjs", how: "node --env-file=.env.local scripts/billing-migration.mjs\nnode --env-file=.env.local scripts/phase4-migration.mjs" },
  { id: "super-admin", category: "Database", label: "Super Admin user สร้างแล้ว", description: "มี SUPER_ADMIN user ใน DB", how: "node --env-file=.env.local scripts/create-super-admin.mjs" },
  { id: "backups", category: "Database", label: "Neon Backup เปิดใช้งาน", description: "Neon มี point-in-time recovery", how: "ไปที่ Neon Dashboard → Project Settings → Backups ตรวจสอบ backup period" },
  // PDPA
  { id: "pdpa-consent", category: "PDPA", label: "Privacy Policy เพิ่มใน Register flow", description: "ผู้ใช้ต้อง consent ก่อนสมัคร", how: "เพิ่ม checkbox consent ใน /register page" },
  { id: "gdpr-endpoints", category: "PDPA", label: "GDPR Export/Erase endpoints พร้อม", description: "/api/gdpr/export + /api/gdpr/erase", how: "✅ สร้างแล้ว" },
  { id: "data-retention", category: "PDPA", label: "กำหนด Data Retention Policy", description: "กำหนดนโยบายเก็บข้อมูลลูกค้าเก่า", how: "เพิ่ม cron job ลบข้อมูลที่หมดอายุ (ถ้าจำเป็น)" },
  // Infrastructure
  { id: "custom-domain", category: "Infrastructure", label: "Custom Domain ตั้งค่าแล้ว", description: "eyefocus.app และ subdomain routing", how: "Cloudflare Dashboard → Workers → Custom Domains → เพิ่ม *.eyefocus.app" },
  { id: "error-monitoring", category: "Infrastructure", label: "Error Monitoring ตั้งค่า", description: "รับแจ้งเตือนเมื่อเกิด error", how: "เพิ่ม Sentry หรือ Cloudflare Workers Analytics" },
  { id: "rate-limiting", category: "Infrastructure", label: "Rate Limiting เปิดใช้งาน", description: "ป้องกัน brute force login", how: "เปิด Cloudflare Rate Limiting Rules ใน Dashboard" },
  // Monitoring
  { id: "audit-logging", category: "Monitoring", label: "Audit Logging ทำงาน", description: "SYSTEM_LOGIN events บันทึกแล้ว", how: "✅ เพิ่มแล้วใน login route + lib/audit.ts" },
  { id: "health-check", category: "Monitoring", label: "Health check endpoint", description: "/api/health ตอบกลับ 200", how: "สร้าง app/api/health/route.ts ที่ return { ok: true }" },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Security: Shield,
  Billing: CreditCard,
  Database: Database,
  PDPA: Lock,
  Infrastructure: Globe,
  Monitoring: Bell,
};

const STATUS_CONFIG = {
  pass:    { icon: CheckCircle, cls: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  fail:    { icon: XCircle,     cls: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
  warn:    { icon: AlertTriangle, cls: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  unknown: { icon: Zap,         cls: "text-slate-500",   bg: "bg-slate-800 border-slate-700" },
};

const STORAGE_KEY = "eyefocus_checklist";

export default function ChecklistPage() {
  const [items, setItems] = useState<CheckItem[]>(() =>
    CHECKLIST.map(c => ({ ...c, status: "unknown" as const }))
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const statuses: Record<string, CheckItem["status"]> = JSON.parse(saved);
        setItems(prev => prev.map(item => ({ ...item, status: statuses[item.id] ?? "unknown" })));
      }
    } catch {}
  }, []);

  const setStatus = (id: string, status: CheckItem["status"]) => {
    setItems(prev => {
      const next = prev.map(item => item.id === id ? { ...item, status } : item);
      try {
        const statuses = Object.fromEntries(next.map(i => [i.id, i.status]));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
      } catch {}
      return next;
    });
  };

  const categories = [...new Set(items.map(i => i.category))];
  const passed = items.filter(i => i.status === "pass").length;
  const total = items.length;
  const pct = Math.round((passed / total) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pre-Launch Checklist</h1>
        <p className="text-slate-400 text-sm mt-0.5">รายการที่ต้องทำก่อน launch สู่ production จริง</p>
      </div>

      {/* Progress */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-white">ความคืบหน้า</span>
          <span className="text-sm font-bold text-white">{passed}/{total} รายการ</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-500" : pct >= 70 ? "bg-blue-500" : "bg-violet-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">{pct}% เสร็จแล้ว</p>
      </div>

      {/* Checklist by category */}
      {categories.map(cat => {
        const catItems = items.filter(i => i.category === cat);
        const catPassed = catItems.filter(i => i.status === "pass").length;
        const Icon = CATEGORY_ICONS[cat] ?? Shield;
        return (
          <div key={cat} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <h2 className="font-bold text-white">{cat}</h2>
              </div>
              <span className={`text-xs font-bold ${catPassed === catItems.length ? "text-emerald-400" : "text-slate-400"}`}>
                {catPassed}/{catItems.length}
              </span>
            </div>
            <div className="divide-y divide-slate-800/50">
              {catItems.map(item => {
                const cfg = STATUS_CONFIG[item.status];
                const StatusIcon = cfg.icon;
                const isExpanded = expanded === item.id;
                return (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      {/* Status button */}
                      <button
                        onClick={() => setStatus(item.id, item.status === "pass" ? "fail" : "pass")}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${cfg.bg}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${cfg.cls}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold ${item.status === "pass" ? "text-slate-400 line-through" : "text-white"}`}>
                            {item.label}
                          </p>
                          <div className="flex gap-1 shrink-0">
                            {item.status !== "pass" && (
                              <button onClick={() => setStatus(item.id, "warn")}
                                className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded transition">
                                warn
                              </button>
                            )}
                            <button onClick={() => setExpanded(isExpanded ? null : item.id)}
                              className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded transition">
                              {isExpanded ? "ซ่อน" : "วิธี"}
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                        {isExpanded && (
                          <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                            <pre className="text-xs text-emerald-400 whitespace-pre-wrap font-mono">{item.how}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
