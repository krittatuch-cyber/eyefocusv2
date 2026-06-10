// app/(seller)/seller/changelog/page.tsx — Full Audit Log with Severity (spreadsheet-aligned)
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ShieldAlert, Search, ShoppingCart, Users, Package,
  Building2, ArrowLeftRight, LogIn, LogOut, ChevronLeft, ChevronRight,
  RefreshCw, Loader2, Clock, Eye, Stethoscope, FileText, Download,
  Trash2, Edit2, Plus, CreditCard, AlertTriangle, UserCog, Globe,
  FlaskConical, Key, Lock, Ban, Star, DollarSign, Microscope,
  AlertCircle, CheckCircle, Info,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

interface AuditLog {
  id: string;
  userId: string | null;
  userName: string;
  userRole?: string | null;
  action: string;
  target: string | null;
  detail: string | null;
  severity?: string | null;
  status?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

// ─── Severity Config ────────────────────────────────────────────────────────────
type SeverityLevel = "HIGH" | "MEDIUM" | "LOW";

const SEV_CONFIG: Record<SeverityLevel, {
  label: string; labelEn: string;
  cls: string; dot: string; rowBorder: string;
  Icon: React.ElementType;
}> = {
  HIGH:   { label: "สูง",   labelEn: "High",   cls: "bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30",     dot: "bg-red-500",    rowBorder: "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-500/5",    Icon: AlertCircle },
  MEDIUM: { label: "กลาง", labelEn: "Medium", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", dot: "bg-amber-500", rowBorder: "border-l-4 border-l-amber-500 dark:bg-amber-500/5",               Icon: AlertTriangle },
  LOW:    { label: "ต่ำ",   labelEn: "Low",    cls: "bg-slate-400/10 text-slate-500 dark:text-slate-400 border-slate-400/20",  dot: "bg-slate-400",  rowBorder: "",                                                                Icon: Info },
};

// ─── Action Config ─────────────────────────────────────────────────────────────
type ActionConfig = { label: string; labelEn: string; color: string; bg: string; Icon: React.ElementType };

const A: Record<string, ActionConfig> = {
  // Orders
  ORDER_CREATED:          { label: "สร้างออเดอร์",        labelEn: "Order Created",       color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", Icon: ShoppingCart },
  ORDER_UPDATED:          { label: "อัปเดตออเดอร์",       labelEn: "Order Updated",       color: "text-blue-600 dark:text-blue-400",        bg: "bg-blue-500/15 border-blue-500/30",       Icon: Edit2 },
  ORDER_CANCELLED:        { label: "ยกเลิกออเดอร์",       labelEn: "Order Cancelled",     color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: Trash2 },
  ORDER_DISCOUNT_APPLIED: { label: "ให้ส่วนลดในบิล",      labelEn: "Discount Applied",    color: "text-orange-600 dark:text-orange-400",    bg: "bg-orange-500/15 border-orange-500/30",   Icon: DollarSign },
  ORDER_REFUNDED:         { label: "คืนเงิน",              labelEn: "Order Refunded",      color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: ArrowLeftRight },
  PAYMENT_RECEIVED:       { label: "รับชำระเงิน",          labelEn: "Payment Received",    color: "text-green-600 dark:text-green-400",      bg: "bg-green-500/15 border-green-500/30",     Icon: CreditCard },
  // Shifts
  SHIFT_OPEN:             { label: "เปิดกะ",               labelEn: "Shift Opened",        color: "text-sky-600 dark:text-sky-400",          bg: "bg-sky-500/15 border-sky-500/30",         Icon: Clock },
  SHIFT_CLOSE:            { label: "ปิดกะ",                labelEn: "Shift Closed",        color: "text-indigo-600 dark:text-indigo-400",    bg: "bg-indigo-500/15 border-indigo-500/30",   Icon: Clock },
  SHIFT_OPENED:           { label: "เปิดกะ",               labelEn: "Shift Opened",        color: "text-sky-600 dark:text-sky-400",          bg: "bg-sky-500/15 border-sky-500/30",         Icon: Clock },
  SHIFT_CLOSED:           { label: "ปิดกะ",                labelEn: "Shift Closed",        color: "text-indigo-600 dark:text-indigo-400",    bg: "bg-indigo-500/15 border-indigo-500/30",   Icon: Clock },
  // Products & Stock
  PRODUCT_CREATED:        { label: "เพิ่มสินค้า",          labelEn: "Product Created",     color: "text-amber-600 dark:text-amber-400",      bg: "bg-amber-500/15 border-amber-500/30",     Icon: Plus },
  PRODUCT_UPDATED:        { label: "แก้ไขสินค้า",          labelEn: "Product Updated",     color: "text-amber-600 dark:text-amber-400",      bg: "bg-amber-500/15 border-amber-500/30",     Icon: Edit2 },
  PRODUCT_DELETED:        { label: "ลบสินค้า",             labelEn: "Product Deleted",     color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: Trash2 },
  STOCK_ADJUSTED:         { label: "ปรับสต็อก",            labelEn: "Stock Adjusted",      color: "text-orange-600 dark:text-orange-400",    bg: "bg-orange-500/15 border-orange-500/30",   Icon: Package },
  STOCK_TRANSFER:         { label: "โอนสต็อก",             labelEn: "Stock Transfer",      color: "text-orange-600 dark:text-orange-400",    bg: "bg-orange-500/15 border-orange-500/30",   Icon: ArrowLeftRight },
  STOCK_TRANSFER_CREATED: { label: "สร้างใบโอนสต็อก",     labelEn: "Transfer Created",    color: "text-orange-600 dark:text-orange-400",    bg: "bg-orange-500/15 border-orange-500/30",   Icon: ArrowLeftRight },
  STOCK_TRANSFER_RECEIVED:{ label: "รับสินค้าโอน",         labelEn: "Transfer Received",   color: "text-teal-600 dark:text-teal-400",        bg: "bg-teal-500/15 border-teal-500/30",       Icon: Package },
  // Users
  USER_CREATED:           { label: "สร้างพนักงาน",         labelEn: "User Created",        color: "text-violet-600 dark:text-violet-400",    bg: "bg-violet-500/15 border-violet-500/30",   Icon: Plus },
  USER_UPDATED:           { label: "แก้ไขพนักงาน",         labelEn: "User Updated",        color: "text-violet-600 dark:text-violet-400",    bg: "bg-violet-500/15 border-violet-500/30",   Icon: Edit2 },
  USER_ROLE_CHANGED:      { label: "เปลี่ยน Role",         labelEn: "Role Changed",        color: "text-purple-600 dark:text-purple-400",    bg: "bg-purple-500/15 border-purple-500/30",   Icon: UserCog },
  USER_DEACTIVATED:       { label: "ปิดบัญชีพนักงาน",     labelEn: "User Deactivated",    color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: Ban },
  USER_PASSWORD_RESET:    { label: "Reset รหัสผ่าน",       labelEn: "Password Reset",      color: "text-purple-600 dark:text-purple-400",    bg: "bg-purple-500/15 border-purple-500/30",   Icon: Key },
  // Branches
  BRANCH_CREATED:         { label: "สร้างสาขา",            labelEn: "Branch Created",      color: "text-teal-600 dark:text-teal-400",        bg: "bg-teal-500/15 border-teal-500/30",       Icon: Building2 },
  BRANCH_UPDATED:         { label: "แก้ไขสาขา",            labelEn: "Branch Updated",      color: "text-teal-600 dark:text-teal-400",        bg: "bg-teal-500/15 border-teal-500/30",       Icon: Edit2 },
  // Customers
  CUSTOMER_CREATED:       { label: "เพิ่มลูกค้า",          labelEn: "Customer Created",    color: "text-pink-600 dark:text-pink-400",        bg: "bg-pink-500/15 border-pink-500/30",       Icon: Plus },
  CUSTOMER_UPDATED:       { label: "แก้ไขลูกค้า",          labelEn: "Customer Updated",    color: "text-pink-600 dark:text-pink-400",        bg: "bg-pink-500/15 border-pink-500/30",       Icon: Edit2 },
  CUSTOMER_DELETED:       { label: "ลบลูกค้า",             labelEn: "Customer Deleted",    color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: Trash2 },
  CUSTOMER_PII_VIEWED:    { label: "เปิดดูข้อมูลอ่อนไหว", labelEn: "PII Data Viewed",     color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: Eye },
  LOYALTY_ADJUSTED:       { label: "ปรับ Loyalty Points",  labelEn: "Loyalty Adjusted",    color: "text-pink-600 dark:text-pink-400",        bg: "bg-pink-500/15 border-pink-500/30",       Icon: Star },
  // Prescriptions
  PRESCRIPTION_CREATED:   { label: "บันทึกค่าสายตา",       labelEn: "Prescription Created",color: "text-cyan-600 dark:text-cyan-400",        bg: "bg-cyan-500/15 border-cyan-500/30",       Icon: Eye },
  PRESCRIPTION_UPDATED:   { label: "แก้ไขค่าสายตา",        labelEn: "Prescription Updated",color: "text-cyan-600 dark:text-cyan-400",        bg: "bg-cyan-500/15 border-cyan-500/30",       Icon: Stethoscope },
  PRESCRIPTION_DELETED:   { label: "ลบใบสั่งตัด",          labelEn: "Prescription Deleted",color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: Trash2 },
  // Lab
  LAB_JOB_CREATED:        { label: "สร้าง Job Lab",        labelEn: "Lab Job Created",     color: "text-blue-600 dark:text-blue-400",        bg: "bg-blue-500/15 border-blue-500/30",       Icon: FlaskConical },
  LAB_STATUS_CHANGED:     { label: "เปลี่ยนสถานะ Lab",     labelEn: "Lab Status Changed",  color: "text-blue-600 dark:text-blue-400",        bg: "bg-blue-500/15 border-blue-500/30",       Icon: Microscope },
  LAB_JOB_DELIVERED:      { label: "ส่งมอบงาน Lab",        labelEn: "Lab Job Delivered",   color: "text-green-600 dark:text-green-400",      bg: "bg-green-500/15 border-green-500/30",     Icon: CheckCircle },
  // Claims
  CLAIM_CREATED:          { label: "เปิดเคลม",             labelEn: "Claim Created",       color: "text-rose-600 dark:text-rose-400",        bg: "bg-rose-500/15 border-rose-500/30",       Icon: AlertTriangle },
  CLAIM_UPDATED:          { label: "อัปเดตเคลม",           labelEn: "Claim Updated",       color: "text-rose-600 dark:text-rose-400",        bg: "bg-rose-500/15 border-rose-500/30",       Icon: Edit2 },
  // Auth
  SYSTEM_LOGIN:           { label: "เข้าสู่ระบบ",          labelEn: "Login Success",       color: "text-slate-600 dark:text-slate-400",      bg: "bg-slate-400/10 border-slate-400/20",     Icon: LogIn },
  SYSTEM_LOGOUT:          { label: "ออกจากระบบ",            labelEn: "Logout",              color: "text-slate-600 dark:text-slate-400",      bg: "bg-slate-400/10 border-slate-400/20",     Icon: LogOut },
  AUTH_LOGIN_FAILED:      { label: "Login ล้มเหลว",        labelEn: "Login Failed",        color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: Lock },
  AUTH_PASSWORD_CHANGED:  { label: "เปลี่ยนรหัสผ่าน",     labelEn: "Password Changed",    color: "text-slate-600 dark:text-slate-400",      bg: "bg-slate-400/10 border-slate-400/20",     Icon: Key },
  AUTH_LOCKED:            { label: "บัญชีถูกล็อก",         labelEn: "Account Locked",      color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: Lock },
  // Billing
  BILLING_SUBSCRIBE:      { label: "ชำระค่าบริการ",        labelEn: "Plan Subscribed",     color: "text-green-600 dark:text-green-400",      bg: "bg-green-500/15 border-green-500/30",     Icon: CreditCard },
  BILLING_PAYMENT_SUCCESS:{ label: "ชำระสำเร็จ",           labelEn: "Payment Success",     color: "text-green-600 dark:text-green-400",      bg: "bg-green-500/15 border-green-500/30",     Icon: CheckCircle },
  BILLING_FAILED:         { label: "ชำระล้มเหลว",          labelEn: "Payment Failed",      color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: CreditCard },
  BILLING_PAYMENT_FAILED: { label: "ชำระล้มเหลว",          labelEn: "Payment Failed",      color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: CreditCard },
  // PDPA / Audit
  GDPR_EXPORT:            { label: "Export ข้อมูล (PDPA)", labelEn: "GDPR Export",         color: "text-slate-600 dark:text-slate-400",      bg: "bg-slate-400/10 border-slate-400/20",     Icon: Download },
  GDPR_ERASE_REQUEST:     { label: "ลบข้อมูล (PDPA)",     labelEn: "GDPR Erase",          color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: Trash2 },
  GDPR_ERASE:             { label: "ลบข้อมูล (PDPA)",     labelEn: "GDPR Erase",          color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: Trash2 },
  AUDIT_LOG_VIEWED:       { label: "ดู Audit Log",         labelEn: "Audit Log Viewed",    color: "text-slate-600 dark:text-slate-400",      bg: "bg-slate-400/10 border-slate-400/20",     Icon: FileText },
  AUDIT_LOG_EXPORTED:     { label: "Export Audit Log",     labelEn: "Audit Log Exported",  color: "text-slate-600 dark:text-slate-400",      bg: "bg-slate-400/10 border-slate-400/20",     Icon: Download },
  // Admin
  TENANT_SUSPENDED:       { label: "ระงับร้าน",            labelEn: "Tenant Suspended",    color: "text-red-600 dark:text-red-400",          bg: "bg-red-500/15 border-red-500/30",         Icon: Ban },
  TENANT_ACTIVATED:       { label: "เปิดใช้งานร้าน",       labelEn: "Tenant Activated",    color: "text-green-600 dark:text-green-400",      bg: "bg-green-500/15 border-green-500/30",     Icon: CheckCircle },
  TENANT_PLAN_CHANGED:    { label: "เปลี่ยน Plan ร้าน",    labelEn: "Plan Changed",        color: "text-blue-600 dark:text-blue-400",        bg: "bg-blue-500/15 border-blue-500/30",       Icon: Globe },
  TENANT_TRIAL_EXTENDED:  { label: "ขยาย Trial",           labelEn: "Trial Extended",      color: "text-blue-600 dark:text-blue-400",        bg: "bg-blue-500/15 border-blue-500/30",       Icon: Clock },
  TENANT_DUNNING_RESET:   { label: "ล้างค้างชำระ",         labelEn: "Dunning Reset",       color: "text-slate-600 dark:text-slate-400",      bg: "bg-slate-400/10 border-slate-400/20",     Icon: ArrowLeftRight },
  // Appointment
  APPOINTMENT_CREATED:    { label: "นัดหมาย",              labelEn: "Appointment Created", color: "text-cyan-600 dark:text-cyan-400",        bg: "bg-cyan-500/15 border-cyan-500/30",       Icon: Clock },
};

const DEFAULT_A: ActionConfig = { label: "เหตุการณ์", labelEn: "Event", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-400/10 border-slate-400/20", Icon: Globe };

const CATEGORIES = [
  { id: "ALL",           label: "ทั้งหมด",       labelEn: "All" },
  { id: "ORDERS",        label: "📦 ออเดอร์",    labelEn: "📦 Orders" },
  { id: "SHIFTS",        label: "⏰ กะงาน",      labelEn: "⏰ Shifts" },
  { id: "PRODUCTS",      label: "🏷️ สินค้า",    labelEn: "🏷️ Products" },
  { id: "USERS",         label: "👤 พนักงาน",    labelEn: "👤 Staff" },
  { id: "CUSTOMERS",     label: "🧑 ลูกค้า",     labelEn: "🧑 Customers" },
  { id: "PRESCRIPTIONS", label: "👁️ ค่าสายตา", labelEn: "👁️ Prescriptions" },
  { id: "LAB",           label: "🔬 Lab",         labelEn: "🔬 Lab" },
  { id: "CLAIMS",        label: "⚠️ เคลม",       labelEn: "⚠️ Claims" },
  { id: "PAYMENTS",      label: "💳 ชำระเงิน",   labelEn: "💳 Payments" },
  { id: "AUTH",          label: "🔐 ระบบ/Auth",  labelEn: "🔐 Auth" },
];

const SEVERITY_FILTERS = [
  { id: "ALL",    label: "ทุกระดับ", labelEn: "All Levels" },
  { id: "HIGH",   label: "🔴 สูง",   labelEn: "🔴 High" },
  { id: "MEDIUM", label: "🟡 กลาง",  labelEn: "🟡 Medium" },
  { id: "LOW",    label: "🟢 ต่ำ",   labelEn: "🟢 Low" },
];

function relativeTime(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (locale === "th") {
    if (m < 1)  return "เมื่อสักครู่";
    if (m < 60) return `${m} นาทีที่แล้ว`;
    if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
    if (d < 30) return `${d} วันที่แล้ว`;
    return new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
  }
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function ChangelogPage() {
  const { locale } = useI18n();
  const [logs, setLogs]             = useState<AuditLog[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("ALL");
  const [severity, setSeverity]     = useState("ALL");
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [highCount, setHighCount]   = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: "20",
        ...(search   ? { search }   : {}),
        ...(category !== "ALL" ? { category } : {}),
        ...(severity !== "ALL" ? { severity } : {}),
      });
      const res = await fetch(`/api/audit-logs?${params}`, { credentials: "include" });
      const data = await res.json();
      setLogs(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      setHighCount(data.meta?.highSeverityCount ?? 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, severity]);

  useEffect(() => { setPage(1); }, [search, category, severity]);
  useEffect(() => { loadLogs(); }, [loadLogs]);

  const getSev = (log: AuditLog): SeverityLevel =>
    (log.severity as SeverityLevel) || "LOW";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-violet-500 dark:text-violet-400" />
            {locale === "th" ? "บันทึกการใช้งาน" : "Audit Log"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {locale === "th" ? "ประวัติการกระทำทั้งหมดในระบบ" : "Complete activity trail for your organisation"}
          </p>
        </div>
        <button onClick={() => loadLogs()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
          <RefreshCw className="w-4 h-4" />
          {locale === "th" ? "รีเฟรช" : "Refresh"}
        </button>
      </div>

      {/* HIGH severity alert banner */}
      {highCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            {locale === "th"
              ? `มี ${highCount} เหตุการณ์ความเสี่ยงสูง ที่ต้องตรวจสอบ`
              : `${highCount} high-severity event${highCount > 1 ? "s" : ""} require your attention`}
          </p>
          <button onClick={() => setSeverity("HIGH")}
            className="ml-auto text-xs font-semibold text-red-600 dark:text-red-400 hover:underline shrink-0">
            {locale === "th" ? "ดูทั้งหมด" : "View all"}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder={locale === "th" ? "ค้นหาชื่อผู้ใช้ หรือรายละเอียด..." : "Search user or detail..."}
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              category === c.id
                ? "bg-violet-600 dark:bg-violet-600 text-white border-violet-600"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400"
            }`}>
            {locale === "th" ? c.label : c.labelEn}
          </button>
        ))}
      </div>

      {/* Severity Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          {locale === "th" ? "ความเสี่ยง:" : "Severity:"}
        </span>
        {SEVERITY_FILTERS.map(s => (
          <button key={s.id} onClick={() => setSeverity(s.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
              severity === s.id
                ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500"
            }`}>
            {locale === "th" ? s.label : s.labelEn}
          </button>
        ))}
        {(category !== "ALL" || severity !== "ALL" || search) && (
          <button onClick={() => { setCategory("ALL"); setSeverity("ALL"); setSearch(""); }}
            className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:text-red-500 border border-transparent hover:border-red-200 transition">
            ✕ {locale === "th" ? "ล้าง filter" : "Clear filters"}
          </button>
        )}
      </div>

      {/* Log Feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {locale === "th" ? "ไม่พบบันทึกการใช้งาน" : "No audit log entries found"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map(log => {
              const cfg = A[log.action] || DEFAULT_A;
              const sev = getSev(log);
              const sevCfg = SEV_CONFIG[sev];
              const isExpanded = expandedId === log.id;
              const isHigh = sev === "HIGH";

              return (
                <div key={log.id}
                  className={`px-5 py-4 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${sevCfg.rowBorder}`}
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-white ${
                      isHigh ? "bg-gradient-to-br from-red-500 to-rose-600"
                      : sev === "MEDIUM" ? "bg-gradient-to-br from-amber-500 to-orange-600"
                      : "bg-gradient-to-br from-slate-500 to-slate-700"
                    }`}>
                      {log.userName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Action badge */}
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${cfg.bg}`}>
                          <cfg.Icon className={`w-3 h-3 ${cfg.color}`} />
                          <span className={cfg.color}>{locale === "th" ? cfg.label : cfg.labelEn}</span>
                        </span>

                        {/* Severity badge */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sevCfg.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sevCfg.dot}`} />
                          {locale === "th" ? sevCfg.label : sevCfg.labelEn}
                        </span>

                        {/* Failed status */}
                        {log.status === "failed" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                            FAILED
                          </span>
                        )}

                        <span className="text-xs text-slate-400 ml-auto shrink-0">
                          {relativeTime(log.createdAt, locale)}
                        </span>
                      </div>

                      {/* User + detail */}
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{log.userName}</span>
                        {log.userRole && (
                          <span className="text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
                            {log.userRole}
                          </span>
                        )}
                        {log.target && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            → {log.target}
                          </span>
                        )}
                      </div>
                      {log.detail && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{log.detail}</p>
                      )}

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                          <div className="flex gap-4 flex-wrap">
                            {log.detail && (
                              <div><span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Detail</span><p className="mt-0.5 text-slate-800 dark:text-slate-200">{log.detail}</p></div>
                            )}
                            {log.ipAddress && (
                              <div><span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">IP</span><p className="mt-0.5 font-mono">{log.ipAddress}</p></div>
                            )}
                          </div>
                          <div className="text-slate-400 text-[10px]">
                            {new Date(log.createdAt).toLocaleString(locale === "th" ? "th-TH" : "en-US", { dateStyle: "full", timeStyle: "medium" })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {locale === "th"
                ? `แสดง ${((page - 1) * 20) + 1}–${Math.min(page * 20, pagination.total)} จาก ${pagination.total} รายการ`
                : `Showing ${((page - 1) * 20) + 1}–${Math.min(page * 20, pagination.total)} of ${pagination.total}`}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition text-slate-600 dark:text-slate-300">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-300 min-w-[4rem] text-center">
                {page} / {pagination.totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Severity Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        {(Object.entries(SEV_CONFIG) as [SeverityLevel, typeof SEV_CONFIG[SeverityLevel]][]).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <strong>{locale === "th" ? cfg.label : cfg.labelEn}</strong>
            {key === "HIGH" && (locale === "th" ? " — เสี่ยงทุจริต/กฎหมาย" : " — fraud / legal risk")}
            {key === "MEDIUM" && (locale === "th" ? " — เปลี่ยนแปลงทั่วไป" : " — general changes")}
            {key === "LOW" && (locale === "th" ? " — กิจกรรมปกติ" : " — routine activity")}
          </span>
        ))}
      </div>
    </div>
  );
}
