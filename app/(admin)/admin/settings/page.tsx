// app/(admin)/admin/settings/page.tsx — Super Admin Settings
"use client";

import React, { useState } from "react";
import {
  Shield, Key, Globe, Bell, Database, AlertTriangle,
  CheckCircle, Copy, ExternalLink, Info
} from "lucide-react";

interface SettingSection {
  icon: React.ElementType;
  title: string;
  description: string;
  content: React.ReactNode;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
      {copied ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="bg-slate-950 rounded-xl p-4 flex items-start justify-between gap-3 border border-slate-800 font-mono text-xs">
      <pre className="text-emerald-400 whitespace-pre-wrap break-all flex-1">{code}</pre>
      <CopyButton text={code} />
    </div>
  );
}

function InfoAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 text-sm text-blue-300">
      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
      <span>{children}</span>
    </div>
  );
}

function WarnAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-sm text-amber-300">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
      <span>{children}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const sections: SettingSection[] = [
    {
      icon: Key,
      title: "Omise API Keys",
      description: "ต้องตั้งเป็น Cloudflare Secrets — ห้ามใส่ใน wrangler.jsonc",
      content: (
        <div className="space-y-4">
          <WarnAlert>
            Keys เหล่านี้ต้องตั้งเป็น Cloudflare Worker Secrets เท่านั้น อย่าใส่ใน .env หรือ wrangler.jsonc
          </WarnAlert>
          <div className="space-y-3">
            {[
              { label: "Public Key (test)", key: "OMISE_PUBLIC_KEY", value: "pkey_test_..." },
              { label: "Secret Key (test)", key: "OMISE_SECRET_KEY", value: "skey_test_..." },
              { label: "Webhook Secret", key: "OMISE_WEBHOOK_SECRET", value: "whsec_..." },
            ].map(({ label, key, value }) => (
              <div key={key}>
                <p className="text-xs font-semibold text-slate-400 mb-1.5">{label}</p>
                <CodeBlock code={`npx wrangler secret put ${key}`} />
              </div>
            ))}
          </div>
          <InfoAlert>
            ดูข้อมูล keys ได้ที่{" "}
            <a href="https://dashboard.omise.co/test/api-keys" target="_blank" rel="noreferrer"
              className="underline inline-flex items-center gap-1">
              Omise Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </InfoAlert>
        </div>
      ),
    },
    {
      icon: Globe,
      title: "Webhook URL",
      description: "ตั้งค่า URL นี้ใน Omise Dashboard เพื่อรับการชำระเงิน",
      content: (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1.5">Production Webhook URL</p>
            <CodeBlock code="https://eyeforcusv2.krittatuch.workers.dev/api/billing/webhook" />
          </div>
          <InfoAlert>
            ไปที่{" "}
            <a href="https://dashboard.omise.co/webhooks" target="_blank" rel="noreferrer"
              className="underline inline-flex items-center gap-1">
              Omise Webhooks <ExternalLink className="w-3 h-3" />
            </a>
            {" "}แล้วเพิ่ม URL ด้านบน พร้อมเปิดใช้ events: charge.complete, charge.failed
          </InfoAlert>
        </div>
      ),
    },
    {
      icon: Shield,
      title: "Super Admin Access",
      description: "จัดการบัญชี Super Admin สำหรับ platform",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Role", value: "SUPER_ADMIN" },
              { label: "Email", value: "admin@eyefocus.app" },
              { label: "System Tenant", value: "system" },
              { label: "Login URL", value: "/login" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800/50 rounded-xl p-3.5">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1.5">เพิ่ม Super Admin ใหม่</p>
            <CodeBlock code={`node --env-file=.env.local scripts/create-super-admin.mjs\n# หรือตั้งค่า SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME`} />
          </div>
        </div>
      ),
    },
    {
      icon: Database,
      title: "Database Migrations",
      description: "รัน migrations เพื่ออัปเดตโครงสร้างฐานข้อมูล",
      content: (
        <div className="space-y-3">
          {[
            { label: "Billing columns (omise_customer_id, dunning_count ฯลฯ)", cmd: "node --env-file=.env.local scripts/billing-migration.mjs" },
            { label: "Create SUPER_ADMIN user", cmd: "node --env-file=.env.local scripts/create-super-admin.mjs" },
          ].map(({ label, cmd }) => (
            <div key={label}>
              <p className="text-xs text-slate-400 mb-1.5">{label}</p>
              <CodeBlock code={cmd} />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Bell,
      title: "Platform Limits (ค่า default)",
      description: "ขีดจำกัดตาม plan — แก้ไขได้ที่ lib/plans.ts",
      content: (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Plan", "ราคา/เดือน", "สาขา", "Users", "Trial"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {[
                { plan: "Starter", price: "฿590", branches: 1, users: 5, trial: "30 วัน" },
                { plan: "Pro", price: "฿1,490", branches: 3, users: 15, trial: "30 วัน" },
                { plan: "Enterprise", price: "฿3,990", branches: "ไม่จำกัด", users: "ไม่จำกัด", trial: "30 วัน" },
              ].map(row => (
                <tr key={row.plan}>
                  <td className="py-3 pr-4 font-semibold text-white">{row.plan}</td>
                  <td className="py-3 pr-4 text-emerald-400 font-bold">{row.price}</td>
                  <td className="py-3 pr-4 text-slate-400">{row.branches}</td>
                  <td className="py-3 pr-4 text-slate-400">{row.users}</td>
                  <td className="py-3 pr-4 text-slate-400">{row.trial}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">ตั้งค่าและข้อมูลสำคัญสำหรับ EyeFocus SaaS</p>
      </div>

      {sections.map(({ icon: Icon, title, description, content }) => (
        <div key={title} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
          {content}
        </div>
      ))}
    </div>
  );
}
