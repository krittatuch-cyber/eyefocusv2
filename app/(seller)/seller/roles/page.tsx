// app/(seller)/seller/roles/page.tsx — Role Permission Matrix (OWNER-editable, auto-synced)
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Shield, Check, Eye, Edit2, X, Info, Save, Lock, Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import { PERMISSIONS, ROLE_INFO, TENANT_ROLES, type AppRole } from "@/lib/permissions";
import { useI18n } from "@/lib/i18n-context";

type Perm = "F" | "E" | "V" | "–";

/** Auto-compute perms from a permission map. Optional role-level overrides for V/E distinctions. */
const buildPerms = (
  action: string,
  permMap: Record<string, string[]>,
  overrides?: Partial<Record<string, Perm>>
): Record<string, Perm> => {
  const allowed = permMap[action] ?? [];
  const result: Record<string, Perm> = {};
  for (const role of TENANT_ROLES) {
    if (overrides && overrides[role] !== undefined) {
      result[role] = overrides[role]!;
    } else {
      result[role] = allowed.includes(role as AppRole) ? "F" : "–";
    }
  }
  return result;
};

interface MatrixRowDef {
  sectionTh?: string; sectionEn?: string;
  featureTh: string;  featureEn: string;
  action?: string;
  // display-level overrides (V/E distinctions) — visual only, not affecting DB storage
  displayOverrides?: Partial<Record<string, Perm>>;
}

const ROW_DEFS: MatrixRowDef[] = [
  // ── System ──────────────────────────────────────────────────────────────────
  { sectionTh: "ระบบและบัญชี", sectionEn: "System & Settings", featureTh: "", featureEn: "" },
  { featureTh: "เข้าถึงหน้า Dashboard ร้าน",      featureEn: "Access Shop Dashboard",        action: "dashboard.view",   displayOverrides: { OD:"V", OPTICIAN:"V", SALES:"V", CASHIER:"V" } },
  { featureTh: "ตั้งค่าร้าน / ข้อมูลบริษัท",       featureEn: "Shop Settings / Company Info", action: "settings.edit",    displayOverrides: { MANAGER:"E" } },
  { featureTh: "จัดการสาขา (เพิ่ม/แก้ไข/ปิด)",    featureEn: "Manage Branches",              action: "branches.manage" },
  { featureTh: "ดูข้อมูลข้ามสาขา",                 featureEn: "View Cross-Branch Data",       action: "branches.viewAll" },
  // ── Users ───────────────────────────────────────────────────────────────────
  { sectionTh: "จัดการผู้ใช้และสิทธิ์", sectionEn: "User & Permission Management", featureTh: "", featureEn: "" },
  { featureTh: "เพิ่ม/แก้ไขพนักงาน",   featureEn: "Add / Edit Staff",         action: "users.create",       displayOverrides: { MANAGER:"E" } },
  { featureTh: "กำหนด/เปลี่ยน Role",    featureEn: "Assign / Change Role",     action: "users.assignRole" },
  { featureTh: "เปิด/ปิดบัญชีพนักงาน", featureEn: "Enable / Disable Account", action: "users.toggleActive", displayOverrides: { MANAGER:"E" } },
  { featureTh: "Reset password พนักงาน", featureEn: "Reset Staff Password",    action: "users.resetPassword",displayOverrides: { MANAGER:"E" } },
  // ── CRM ─────────────────────────────────────────────────────────────────────
  { sectionTh: "ลูกค้า (CRM)", sectionEn: "Customers (CRM)", featureTh: "", featureEn: "" },
  { featureTh: "ดูรายชื่อลูกค้า",                       featureEn: "View Customer List",         action: "customers.view",          displayOverrides: { OD:"V", OPTICIAN:"V", CASHIER:"V" } },
  { featureTh: "เพิ่ม/แก้ไขข้อมูลลูกค้า",              featureEn: "Add / Edit Customer",        action: "customers.edit",          displayOverrides: { OD:"E", OPTICIAN:"E" } },
  { featureTh: "ลบลูกค้า",                               featureEn: "Delete Customer",            action: "customers.delete" },
  { featureTh: "ดูข้อมูลอ่อนไหว (เลขบัตร/ประวัติ)", featureEn: "View Sensitive Data",          action: "customers.viewSensitive",  displayOverrides: { OD:"V" } },
  { featureTh: "จัดการ Loyalty Points",                  featureEn: "Manage Loyalty Points",      action: "loyalty.manage",           displayOverrides: { SALES:"E", CASHIER:"E" } },
  // ── Prescription ─────────────────────────────────────────────────────────────
  { sectionTh: "ค่าสายตา / ใบสั่งตัด", sectionEn: "Eye Prescription", featureTh: "", featureEn: "" },
  { featureTh: "ดูค่าสายตา / ใบสั่งตัด",       featureEn: "View Prescriptions",     action: "prescriptions.view",   displayOverrides: { OD:"F", OPTICIAN:"V", SALES:"V" } },
  { featureTh: "วัดสายตา / บันทึก (สั่งจ่าย)", featureEn: "Measure & Record (OD)", action: "prescriptions.create" },
  { featureTh: "แก้ไขค่าสายตา",                 featureEn: "Edit Prescription",     action: "prescriptions.edit" },
  // ── Products ─────────────────────────────────────────────────────────────────
  { sectionTh: "สินค้าและสต็อก", sectionEn: "Products & Inventory", featureTh: "", featureEn: "" },
  { featureTh: "ดูสินค้า / ราคา / สต็อก",   featureEn: "View Products / Prices",  action: "products.view",     displayOverrides: { OD:"V", OPTICIAN:"V", SALES:"V", CASHIER:"V" } },
  { featureTh: "ดูราคาทุน (Cost Price)",     featureEn: "View Cost Price",         action: "products.viewCost" },
  { featureTh: "เพิ่ม/แก้ไขสินค้า",         featureEn: "Add / Edit Products",     action: "products.edit" },
  { featureTh: "ปรับสต็อก",                  featureEn: "Adjust Stock",            action: "stocks.adjust",     displayOverrides: { OPTICIAN:"E" } },
  { featureTh: "โอนสต็อกระหว่างสาขา",       featureEn: "Transfer Stock",          action: "stocks.transfer",   displayOverrides: { OPTICIAN:"E" } },
  // ── POS ──────────────────────────────────────────────────────────────────────
  { sectionTh: "POS / การขาย", sectionEn: "POS / Sales", featureTh: "", featureEn: "" },
  { featureTh: "เปิดกะ (Open Shift)",       featureEn: "Open Cash Drawer Shift",   action: "shifts.open" },
  { featureTh: "ปิดกะ + นับเงิน",           featureEn: "Close Shift & Count Cash", action: "shifts.close" },
  { featureTh: "สร้างรายการขาย",            featureEn: "Create Sales Order",       action: "orders.create" },
  { featureTh: "ให้ส่วนลดในบิล",            featureEn: "Apply Bill Discount",      action: "orders.discount",  displayOverrides: { SALES:"E" } },
  { featureTh: "รับชำระเงิน / ออกใบเสร็จ", featureEn: "Receive Payment / Receipt",action: "orders.payment",   displayOverrides: { SALES:"V" } },
  { featureTh: "ยกเลิก / คืนเงิน Order",   featureEn: "Cancel / Refund Order",    action: "orders.cancel" },
  // ── Lab ──────────────────────────────────────────────────────────────────────
  { sectionTh: "งาน Lab", sectionEn: "Lab Jobs", featureTh: "", featureEn: "" },
  { featureTh: "ดูสถานะงาน Lab",      featureEn: "View Lab Job Status",   action: "jobs.view",         displayOverrides: { OD:"V", SALES:"V", CASHIER:"V" } },
  { featureTh: "สร้าง Job ส่ง Lab",   featureEn: "Create Lab Job",        action: "jobs.create",       displayOverrides: { OD:"E", SALES:"E" } },
  { featureTh: "อัปเดตสถานะงาน Lab", featureEn: "Update Lab Job Status", action: "jobs.updateStatus" },
  { featureTh: "ปิดงาน / ส่งมอบ",    featureEn: "Close & Deliver Job",   action: "jobs.deliver",      displayOverrides: { SALES:"E", CASHIER:"E" } },
  // ── Reports ──────────────────────────────────────────────────────────────────
  { sectionTh: "รายงาน", sectionEn: "Reports", featureTh: "", featureEn: "" },
  { featureTh: "รายงานยอดขาย (ตัวเอง)",    featureEn: "Own Branch Sales Report",   action: "reports.salesOwn",        displayOverrides: { SALES:"V", CASHIER:"V" } },
  { featureTh: "รายงานยอดขายทุกสาขา",      featureEn: "All-Branch Sales Report",   action: "reports.salesAll" },
  { featureTh: "รายงานกำไร/ขาดทุน",        featureEn: "Profit & Loss Report",      action: "reports.profitLoss" },
  { featureTh: "รายงานยอดตามพนักงาน",      featureEn: "Staff Performance Report",  action: "reports.staffPerformance", displayOverrides: { SALES:"V" } },
  { featureTh: "รายงานสรุปกะ",             featureEn: "Shift Summary Report",      action: "reports.shiftSummary",     displayOverrides: { CASHIER:"V" } },
  // ── Billing ──────────────────────────────────────────────────────────────────
  { sectionTh: "Subscription / Billing", sectionEn: "Subscription / Billing", featureTh: "", featureEn: "" },
  { featureTh: "ดู Plan / Usage ปัจจุบัน", featureEn: "View Current Plan & Usage", action: "subscription.view",    displayOverrides: { MANAGER:"V" } },
  { featureTh: "อัปเกรด Plan / ชำระเงิน",  featureEn: "Upgrade Plan / Pay",        action: "subscription.upgrade" },
  // ── PDPA ─────────────────────────────────────────────────────────────────────
  { sectionTh: "PDPA / ความเป็นส่วนตัว", sectionEn: "PDPA / Privacy", featureTh: "", featureEn: "" },
  { featureTh: "Export ข้อมูลลูกค้า",    featureEn: "Export Customer Data",   action: "pdpa.export",    displayOverrides: { MANAGER:"E" } },
  { featureTh: "ลบข้อมูลลูกค้า (Erase)", featureEn: "Erase Customer Data",    action: "pdpa.erase",     displayOverrides: { MANAGER:"E" } },
  { featureTh: "ดู Audit Log ของร้าน",   featureEn: "View Shop Audit Logs",   action: "auditLogs.view" },
];

const PERM_CONFIG: Record<Perm, { icon: React.ReactNode; cls: string; label: string; labelEn: string }> = {
  F:  { icon: <Check className="w-3.5 h-3.5" />, cls: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400", label: "เต็ม",       labelEn: "Full" },
  E:  { icon: <Edit2 className="w-3 h-3" />,      cls: "bg-blue-500/20 text-blue-600 dark:text-blue-400",         label: "แก้ไข",      labelEn: "Edit" },
  V:  { icon: <Eye className="w-3 h-3" />,         cls: "bg-slate-400/20 text-slate-500 dark:text-slate-400",     label: "ดูได้",      labelEn: "View" },
  "–":{ icon: <X className="w-3 h-3" />,           cls: "bg-transparent text-slate-300 dark:text-slate-700",      label: "ไม่มีสิทธิ์", labelEn: "None" },
};

export default function RolesPage() {
  const { t, locale } = useI18n();
  const [highlight, setHighlight] = useState<string | null>(null);

  // ── Auth / role detection ─────────────────────────────────────────────────
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.roles?.includes("OWNER") || d?.role === "OWNER") setIsOwner(true); })
      .catch(() => {});
  }, []);

  // ── Permission state ──────────────────────────────────────────────────────
  const [permMap, setPermMap] = useState<Record<string, string[]>>({ ...PERMISSIONS });
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(false);

  // Load actual merged permissions from server (includes tenant overrides)
  const loadPermissions = useCallback(async () => {
    setLoadingPerms(true);
    try {
      const res = await fetch("/api/tenant/permissions", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPermMap(data.merged ?? { ...PERMISSIONS });
      }
    } catch { /* use defaults */ }
    finally { setLoadingPerms(false); }
  }, []);

  useEffect(() => { loadPermissions(); }, [loadPermissions]);

  // ── Toggle a role for an action ───────────────────────────────────────────
  const toggleRole = (action: string, role: string) => {
    setPermMap(prev => {
      const current = prev[action] ?? [];
      const next = current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role];
      return { ...prev, [action]: next };
    });
    setIsDirty(true);
    setSaveMsg(null);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      // Compute overrides = only actions that differ from PERMISSIONS defaults
      const overrides: Record<string, string[]> = {};
      for (const action of Object.keys(PERMISSIONS)) {
        const def = [...(PERMISSIONS[action] ?? [])].sort().join(",");
        const cur = [...(permMap[action] ?? [])].sort().join(",");
        if (def !== cur) overrides[action] = permMap[action] ?? [];
      }

      const res = await fetch("/api/tenant/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ overrides }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? `Error ${res.status}`);
      }
      setIsDirty(false);
      setSaveMsg({ ok: true, text: "บันทึกสิทธิ์เรียบร้อยแล้ว — มีผลภายใน 60 วินาที" });
    } catch (e: unknown) {
      setSaveMsg({ ok: false, text: e instanceof Error ? e.message : "บันทึกล้มเหลว" });
    } finally {
      setSaving(false);
    }
  };

  // ── Reset to defaults ─────────────────────────────────────────────────────
  const handleReset = () => {
    setPermMap({ ...PERMISSIONS });
    setIsDirty(true);
    setSaveMsg(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-500 dark:text-violet-400" />
            {t("rolesPageTitle")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t("rolesPageSubtitle")}</p>
        </div>

        {/* Edit mode controls — OWNER only */}
        {isOwner && (
          <div className="flex items-center gap-2 flex-wrap">
            {isEditMode ? (
              <>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> คืนค่าเริ่มต้น
                </button>
                <button
                  onClick={() => { setIsEditMode(false); setSaveMsg(null); if (isDirty) loadPermissions(); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition"
                >
                  <X className="w-3.5 h-3.5" /> ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  บันทึกสิทธิ์
                </button>
              </>
            ) : (
              <button
                onClick={() => { setIsEditMode(true); setSaveMsg(null); }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" /> แก้ไขสิทธิ์
              </button>
            )}
          </div>
        )}

        {/* Non-owner: show lock badge */}
        {!isOwner && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <Lock className="w-3.5 h-3.5" /> เฉพาะเจ้าของร้านแก้ไขได้
          </span>
        )}
      </div>

      {/* Save message */}
      {saveMsg && (
        <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm ${
          saveMsg.ok
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40 text-red-700 dark:text-red-400"
        }`}>
          {saveMsg.ok ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
          <p className="whitespace-pre-line">{saveMsg.text}</p>
        </div>
      )}

      {/* Edit mode notice */}
      {isEditMode && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">โหมดแก้ไขสิทธิ์ (OWNER เท่านั้น)</p>
            <p className="text-xs mt-0.5 opacity-80">คลิกที่ช่องสัญลักษณ์เพื่อ เปิด/ปิด สิทธิ์ของแต่ละ Role — กด <strong>บันทึกสิทธิ์</strong> เพื่อบันทึก</p>
          </div>
        </div>
      )}

      {/* Role Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TENANT_ROLES.map(role => {
          const info = ROLE_INFO[role];
          return (
            <div key={role}
              className={`rounded-2xl border p-4 cursor-pointer transition ${info.bgColor} ${info.border} ${
                highlight === role
                  ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
                  : "hover:opacity-90"
              }`}
              onClick={() => setHighlight(h => h === role ? null : role)}>
              <p className={`text-xs font-bold uppercase tracking-wider ${info.color}`}>{info.labelEn}</p>
              <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">{info.label}</p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{info.description}</p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs items-center">
        {(Object.entries(PERM_CONFIG) as [Perm, typeof PERM_CONFIG[Perm]][]).map(([key, cfg]) => (
          <span key={key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-transparent ${cfg.cls}`}>
            {cfg.icon} <strong>{key}</strong> = {locale === "th" ? cfg.label : cfg.labelEn}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-slate-400 ml-2 text-[11px]">
          <Info className="w-3.5 h-3.5" /> {t("rolesClickHint")}
        </span>
      </div>

      {/* Permission Matrix Table */}
      <div className={`rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 transition ${
        isEditMode ? "border-violet-300 dark:border-violet-700/50" : "border-slate-200 dark:border-slate-800"
      }`}>
        {loadingPerms && (
          <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
            <span className="text-xs text-slate-400">กำลังโหลดสิทธิ์...</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isEditMode ? "border-violet-200 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-900/10" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"}`}>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-64">
                  {t("rolesFeatureCol")}
                </th>
                {TENANT_ROLES.map(role => {
                  const info = ROLE_INFO[role];
                  return (
                    <th key={role}
                      onClick={() => !isEditMode && setHighlight(h => h === role ? null : role)}
                      className={`px-3 py-3 text-center w-24 transition ${!isEditMode ? "cursor-pointer" : ""} ${
                        highlight === role && !isEditMode
                          ? `${info.bgColor} ${info.color}`
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                      }`}>
                      <div className="text-[10px] font-bold uppercase">{role}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{info.label}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ROW_DEFS.map((row, i) => {
                if (row.sectionTh) {
                  return (
                    <tr key={`section-${i}`} className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <td colSpan={7} className="px-5 py-2">
                        <span className="text-xs font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest">
                          {locale === "th" ? row.sectionTh : row.sectionEn}
                        </span>
                      </td>
                    </tr>
                  );
                }
                if (!row.action) return null;

                const action = row.action;
                const allowedRoles = permMap[action] ?? [];

                return (
                  <tr key={`row-${i}`}
                    className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-5 py-2.5 text-sm text-slate-700 dark:text-slate-300">
                      {locale === "th" ? row.featureTh : row.featureEn}
                      <span className="ml-2 text-[9px] text-slate-400 dark:text-slate-600 font-mono">{action}</span>
                    </td>
                    {TENANT_ROLES.map(role => {
                      const hasRole = allowedRoles.includes(role);

                      if (isEditMode) {
                        // Edit mode: show toggle button
                        return (
                          <td key={role} className="px-3 py-2 text-center">
                            <button
                              onClick={() => toggleRole(action, role)}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border-2 transition font-bold text-xs ${
                                hasRole
                                  ? "bg-emerald-500 border-emerald-600 text-white shadow-sm hover:bg-emerald-400"
                                  : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 hover:border-slate-400 dark:hover:border-slate-500"
                              }`}
                              title={`${hasRole ? "ปิด" : "เปิด"} ${role} สำหรับ ${action}`}
                            >
                              {hasRole ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        );
                      }

                      // View mode: show badge
                      const dispOverride = row.displayOverrides?.[role];
                      let perm: Perm;
                      if (!hasRole) {
                        perm = "–";
                      } else if (dispOverride && dispOverride !== "–") {
                        perm = dispOverride;
                      } else {
                        perm = "F";
                      }
                      const cfg = PERM_CONFIG[perm];
                      const isHighlighted = highlight === role;
                      return (
                        <td key={role} className={`px-3 py-2.5 text-center transition ${isHighlighted && perm !== "–" ? "bg-violet-500/10" : ""}`}>
                          <span className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold min-w-[2rem] ${cfg.cls}`}>
                            {cfg.icon} {perm}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-role Info */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-5">
        <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-2">
          <Info className="w-4 h-4" /> {t("rolesMultiTitle")}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t("rolesMultiBody")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { roles: "OD + Sales",        th: "วัดสายตา + ปิดการขาย",  en: "Eye exam + close sales" },
            { roles: "Optician + Cashier", th: "ประกอบแว่น + รับเงิน",  en: "Assemble frames + collect payment" },
            { roles: "Manager + OD",       th: "จัดการร้าน + วัดสายตา", en: "Manage shop + eye exam" },
          ].map(ex => (
            <span key={ex.roles}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <strong>{ex.roles}</strong> → {locale === "th" ? ex.th : ex.en}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
