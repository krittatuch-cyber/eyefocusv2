// app/(seller)/seller/customers/[id]/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, User, Phone, Mail, MessageSquare, MapPin, Calendar,
  Star, Crown, Award, Shield, Eye, ShoppingBag, AlertCircle,
  Plus, X, Check, Loader2, ChevronDown, ChevronUp, Edit3,
  FileText, Hash, Building2, Clock, Package, Camera, Upload
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerData {
  id: string;
  name: string;
  nameEn: string | null;
  phone: string;
  email: string | null;
  lineId: string | null;
  gender: string | null;
  birthDate: string | null;
  address: string | null;
  taxId: string | null;
  photoUrl: string | null;
  medicalHistory: string | null;
  notes: string | null;
  loyaltyPoints: number;
  loyaltyTier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  branchName: string | null;
  createdAt: string;
}

interface Prescription {
  id: string;
  recordedAt: string;
  recorderName: string | null;
  sphR: number; cylR: number | null; axisR: number | null; pdR: number | null; addR: number | null; vaR: string | null;
  sphL: number; cylL: number | null; axisL: number | null; pdL: number | null; addL: number | null; vaL: string | null;
  oldGlassesNotes: string | null;
  medicalHistory: string | null;
  frameType: string | null;
  notes: string | null;
}

interface OrderItem {
  productName: string;
  category: string;
  quantity: number;
  price: number;
  discount: number;
}

interface Order {
  id: string;
  orderNumber: string;
  netAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  sellerName: string | null;
  branchName: string | null;
  items: OrderItem[];
}

interface Claim {
  id: string;
  reason: string;
  status: "PENDING" | "IN_REVIEW" | "RESOLVED";
  resolution: string | null;
  createdAt: string;
}

interface FullCustomerData {
  customer: CustomerData;
  prescriptions: Prescription[];
  orders: Order[];
  claims: Claim[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, { badge: string; glow: string; bar: string }> = {
  PLATINUM: { badge: "bg-purple-900/40 text-purple-300 border-purple-700", glow: "shadow-purple-500/20", bar: "from-purple-500 to-purple-400" },
  GOLD:     { badge: "bg-amber-900/40 text-amber-300 border-amber-700",   glow: "shadow-amber-500/20",  bar: "from-amber-500 to-amber-400" },
  SILVER:   { badge: "bg-slate-700/60 text-slate-300 border-slate-600",   glow: "shadow-slate-500/10",  bar: "from-slate-400 to-slate-300" },
  BRONZE:   { badge: "bg-orange-900/40 text-orange-300 border-orange-700",glow: "shadow-orange-500/20", bar: "from-orange-500 to-orange-400" },
};

const TIER_ICONS: Record<string, React.ElementType> = {
  PLATINUM: Crown, GOLD: Award, SILVER: Shield, BRONZE: Star,
};

const TIER_NEXT: Record<string, { tier: string; required: number }> = {
  BRONZE: { tier: "SILVER", required: 300 },
  SILVER: { tier: "GOLD",   required: 1000 },
  GOLD:   { tier: "PLATINUM", required: 5000 },
  PLATINUM: { tier: "PLATINUM", required: 5000 },
};

const CLAIM_STATUS: Record<string, { label: string; className: string }> = {
  PENDING:   { label: "รอดำเนินการ", className: "bg-amber-900/40 text-amber-300 border-amber-700" },
  IN_REVIEW: { label: "กำลังตรวจสอบ", className: "bg-blue-900/40 text-blue-300 border-blue-700" },
  RESOLVED:  { label: "แก้ไขแล้ว",    className: "bg-emerald-900/40 text-emerald-300 border-emerald-700" },
};

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  PAID:       { label: "ชำระแล้ว",     className: "bg-emerald-900/40 text-emerald-300 border-emerald-700" },
  PENDING:    { label: "รอชำระ",       className: "bg-amber-900/40 text-amber-300 border-amber-700" },
  CANCELLED:  { label: "ยกเลิก",       className: "bg-red-900/40 text-red-300 border-red-700" },
  PROCESSING: { label: "กำลังดำเนินการ", className: "bg-blue-900/40 text-blue-300 border-blue-700" },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function calcAge(birthDate: string | null): string {
  if (!birthDate) return "-";
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return `${age} ปี`;
}

function calcAgeAt(birthDate: string | null, atDate: string): string {
  if (!birthDate) return "-";
  const birth = new Date(birthDate);
  const at = new Date(atDate);
  let age = at.getFullYear() - birth.getFullYear();
  const m = at.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < birth.getDate())) age--;
  return `${age} ปี`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ฿";
}

function fmtRx(val: number | null, isAxis?: boolean): string {
  if (val === null || val === undefined) return "-";
  if (isAxis) return String(val);
  return (val > 0 ? "+" : "") + val.toFixed(2);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name.substring(0, 2).toUpperCase();
}

// ─── Input/Textarea styling ───────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition";
const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<FullCustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "rx" | "orders" | "claims">("profile");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedRxSet, setExpandedRxSet] = useState<Set<string>>(new Set());
  const [rxChartMetric, setRxChartMetric] = useState<"sph" | "cyl">("sph");
  const [hoveredRxIdx, setHoveredRxIdx] = useState<number | null>(null);

  // Edit Customer Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CustomerData>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Photo upload
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Prescription Modal
  const [showRxModal, setShowRxModal] = useState(false);
  const [rxForm, setRxForm] = useState({
    sphR: "", cylR: "", axisR: "", pdR: "", addR: "", vaR: "",
    sphL: "", cylL: "", axisL: "", pdL: "", addL: "", vaL: "",
    recordedAt: new Date().toISOString().split("T")[0],
    recorderName: "",
    oldGlassesNotes: "", medicalHistory: "", frameType: "", notes: "",
  });
  const [rxSaving, setRxSaving] = useState(false);
  const [rxError, setRxError] = useState<string | null>(null);

  // ─── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Photo compression helper ──────────────────────────────────────────────
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 480;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = url;
    });

  const handlePhotoFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPhotoUploading(true);
    try {
      const compressed = await compressImage(file);
      setPhotoPreview(compressed);
      setEditForm(p => ({ ...p, photoUrl: compressed }));
    } catch {
      // ignore
    } finally {
      setPhotoUploading(false);
    }
  };

  // ─── Edit Customer ─────────────────────────────────────────────────────────
  const openEdit = () => {
    if (!data) return;
    setEditForm({ ...data.customer });
    setPhotoPreview(data.customer.photoUrl);
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as {error?: string}).error || `HTTP ${res.status}`);
      }
      setShowEditModal(false);
      await loadData();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "บันทึกล้มเหลว");
    } finally {
      setEditSaving(false);
    }
  };

  // ─── Save Prescription ─────────────────────────────────────────────────────
  const handleRxSave = async () => {
    // ── Client-side required field check ──────────────────────────────────────
    if (!rxForm.sphR.trim()) { setRxError("กรุณาใส่ค่า Sph ตาขวา (OD) ก่อนบันทึก"); return; }
    if (!rxForm.sphL.trim()) { setRxError("กรุณาใส่ค่า Sph ตาซ้าย (OS) ก่อนบันทึก"); return; }
    if (!rxForm.recorderName.trim()) { setRxError("กรุณาระบุชื่อผู้ตรวจก่อนบันทึก"); return; }
    if (!rxForm.recordedAt) { setRxError("กรุณาเลือกวันที่ตรวจก่อนบันทึก"); return; }

    setRxSaving(true);
    setRxError(null);
    try {
      const payload = {
        customerId: id,
        recorderName: rxForm.recorderName.trim(),
        sphR: parseFloat(rxForm.sphR) || 0,
        cylR: rxForm.cylR ? parseFloat(rxForm.cylR) : null,
        axisR: rxForm.axisR ? parseInt(rxForm.axisR) : null,
        pdR: rxForm.pdR ? parseFloat(rxForm.pdR) : null,
        addR: rxForm.addR ? parseFloat(rxForm.addR) : null,
        vaR: rxForm.vaR || null,
        sphL: parseFloat(rxForm.sphL) || 0,
        cylL: rxForm.cylL ? parseFloat(rxForm.cylL) : null,
        axisL: rxForm.axisL ? parseInt(rxForm.axisL) : null,
        pdL: rxForm.pdL ? parseFloat(rxForm.pdL) : null,
        addL: rxForm.addL ? parseFloat(rxForm.addL) : null,
        vaL: rxForm.vaL || null,
        recordedAt: rxForm.recordedAt || undefined,
        oldGlassesNotes: rxForm.oldGlassesNotes || null,
        medicalHistory: rxForm.medicalHistory || null,
        frameType: rxForm.frameType || null,
        notes: rxForm.notes || null,
      };
      const res = await fetch("/api/eye-prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        // ── Translate HTTP errors to friendly Thai ─────────────────────────
        if (res.status === 401) throw new Error("กรุณาเข้าสู่ระบบใหม่ก่อนบันทึก");
        if (res.status === 403) throw new Error(
          "คุณไม่มีสิทธิ์บันทึกค่าสายตา\n" +
          "เฉพาะ OD (นักทัศนมาตร), ผู้จัดการ หรือเจ้าของร้านเท่านั้น\n" +
          "กรุณาติดต่อผู้จัดการเพื่อปรับสิทธิ์"
        );
        throw new Error((errJson as {error?: string}).error || `เกิดข้อผิดพลาด (${res.status})`);
      }
      setShowRxModal(false);
      setRxForm({
        sphR: "", cylR: "", axisR: "", pdR: "", addR: "", vaR: "",
        sphL: "", cylL: "", axisL: "", pdL: "", addL: "", vaL: "",
        recordedAt: new Date().toISOString().split("T")[0],
        recorderName: "",
        oldGlassesNotes: "", medicalHistory: "", frameType: "", notes: "",
      });
      await loadData();
    } catch (e: unknown) {
      setRxError(e instanceof Error ? e.message : "บันทึกล้มเหลว");
    } finally {
      setRxSaving(false);
    }
  };

  // ─── Loading / Error States ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-sm text-slate-400">กำลังโหลดข้อมูลลูกค้า...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-red-300 font-semibold">{error || "ไม่พบข้อมูล"}</p>
          <button
            onClick={() => router.push("/seller/customers")}
            className="mt-2 px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition"
          >
            ← กลับรายการลูกค้า
          </button>
        </div>
      </div>
    );
  }

  const { customer, prescriptions, orders, claims } = data;
  const TierIcon = TIER_ICONS[customer.loyaltyTier] || Star;
  const tierColors = TIER_COLORS[customer.loyaltyTier];
  const next = TIER_NEXT[customer.loyaltyTier];
  const progress = customer.loyaltyTier === "PLATINUM"
    ? 100
    : Math.min(100, (customer.loyaltyPoints / next.required) * 100);
  const totalSpent = orders.reduce((sum, o) => sum + o.netAmount, 0);

  const TABS = [
    { key: "profile", label: "โปรไฟล์",    icon: User },
    { key: "rx",      label: "ค่าสายตา",   icon: Eye },
    { key: "orders",  label: "ประวัติซื้อ", icon: ShoppingBag },
    { key: "claims",  label: "เคลม",        icon: AlertCircle },
  ] as const;

  return (
    <div className="space-y-5 pb-10">

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/seller/customers")}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          กลับ
        </button>
        <span className="text-slate-400 dark:text-slate-600 text-sm">/</span>
        <span className="text-xs text-slate-400">ฐานข้อมูลลูกค้า</span>
        <span className="text-slate-400 dark:text-slate-600 text-sm">/</span>
        <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{customer.name}</span>
      </div>

      {/* ── Customer Hero Card ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">

          {/* Avatar — click to edit photo */}
          <div className="relative shrink-0 group">
            <button
              onClick={openEdit}
              className="block w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              title="เปลี่ยนรูปโปรไฟล์"
            >
              {customer.photoUrl ? (
                <img
                  src={customer.photoUrl}
                  alt={customer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300">
                  {getInitials(customer.name)}
                </div>
              )}
              {/* Camera overlay */}
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
            <span className={`absolute -bottom-2 -right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${tierColors.badge}`}>
              <TierIcon className="w-2.5 h-2.5" />
              {customer.loyaltyTier}
            </span>
          </div>

              {/* Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{customer.name}</h1>
                {customer.nameEn && (
                  <p className="text-sm text-slate-400 font-medium">{customer.nameEn}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Phone className="w-3 h-3 text-slate-500" />
                    {customer.phone}
                  </span>
                  {customer.email && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Mail className="w-3 h-3 text-slate-500" />
                      {customer.email}
                    </span>
                  )}
                  {customer.lineId && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MessageSquare className="w-3 h-3 text-slate-500" />
                      {customer.lineId}
                    </span>
                  )}
                  {/* ── อายุปัจจุบัน — แสดงเสมอในทุก tab ── */}
                  {customer.birthDate && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
                      <Calendar className="w-3 h-3" />
                      อายุ {calcAge(customer.birthDate)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                แก้ไขข้อมูล
              </button>
            </div>

            {/* Loyalty Progress */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  {customer.loyaltyPoints.toLocaleString()} แต้ม
                </span>
                {customer.loyaltyTier !== "PLATINUM" && (
                  <span className="text-slate-500">
                    → {next.tier} ต้องการ {next.required.toLocaleString()} แต้ม
                  </span>
                )}
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${tierColors.bar} rounded-full transition-all duration-700`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3 md:flex-col md:gap-2 shrink-0">
            <div className="text-center bg-slate-100/80 dark:bg-slate-100/80 dark:bg-slate-800/60 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{orders.length}</p>
              <p className="text-[10px] text-slate-400">คำสั่งซื้อ</p>
            </div>
            <div className="text-center bg-slate-100/80 dark:bg-slate-100/80 dark:bg-slate-800/60 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-bold text-emerald-400">{formatCurrency(totalSpent)}</p>
              <p className="text-[10px] text-slate-400">ยอดรวม</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 border border-slate-200 dark:border-slate-800">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1: โปรไฟล์
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          {/* Personal Info Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              ข้อมูลส่วนตัว
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                { label: "ชื่อ (ภาษาไทย)", value: customer.name },
                { label: "ชื่อ (English)", value: customer.nameEn || "-" },
                { label: "เบอร์โทรศัพท์", value: customer.phone },
                { label: "อีเมล", value: customer.email || "-" },
                { label: "LINE ID", value: customer.lineId || "-" },
                { label: "เพศ", value: customer.gender || "-" },
                { label: "วันเกิด", value: formatDate(customer.birthDate) },
                { label: "อายุ", value: calcAge(customer.birthDate) },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{item.label}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          {customer.address && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                ที่อยู่
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{customer.address}</p>
            </div>
          )}

          {/* Tax ID */}
          {customer.taxId && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-400" />
                เลขประจำตัวผู้เสียภาษี
              </h3>
              <p className="text-sm font-mono text-slate-600 dark:text-slate-300 tracking-widest">{customer.taxId}</p>
            </div>
          )}

          {/* Medical History */}
          {customer.medicalHistory && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-400" />
                ประวัติโรคประจำตัว / การแพ้ยา
              </h3>
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-3">
                <p className="text-sm text-red-200 leading-relaxed">{customer.medicalHistory}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">หมายเหตุ</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{customer.notes}</p>
            </div>
          )}

          {/* Branch & Dates */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              ข้อมูลสมาชิก
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">สาขาที่สมัคร</span>
                <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{customer.branchName || "-"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">วันที่สมัคร</span>
                <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{formatDate(customer.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2: ค่าสายตา
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "rx" && (() => {
        // ── Chart helpers (inside render for access to fmtRx) ──────────────
        const sorted = [...prescriptions].reverse(); // oldest first for chart

        const getChartVal = (rx: Prescription, eye: "R" | "L"): number | null => {
          if (rxChartMetric === "sph") return eye === "R" ? rx.sphR : rx.sphL;
          return eye === "R" ? rx.cylR : rx.cylL;
        };

        const allVals = sorted.flatMap(rx => [getChartVal(rx, "R"), getChartVal(rx, "L")]).filter((v): v is number => v !== null);
        const hasChart = prescriptions.length >= 2 && allVals.length >= 2;
        const minV = hasChart ? Math.floor(Math.min(...allVals) - 0.5) : 0;
        const maxV = hasChart ? Math.ceil(Math.max(...allVals) + 0.5) : 1;
        const vW = 560; const vH = 260;
        const padL = 46; const padR = 18; const padT = 22; const padB = 44;
        const cW = vW - padL - padR; const cH = vH - padT - padB;
        const yPos = (v: number) => padT + cH - ((v - minV) / (maxV - minV || 1)) * cH;
        const xPos = (i: number) => padL + (sorted.length === 1 ? cW / 2 : (i / (sorted.length - 1)) * cW);
        const buildPath = (eye: "R" | "L") => {
          const pts = sorted.map((rx, i) => { const v = getChartVal(rx, eye); return v !== null ? `${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}` : null; }).filter(Boolean);
          return pts.length >= 2 ? `M${pts[0]} L${pts.slice(1).join(" L")}` : "";
        };
        const gridCount = 5;
        const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
          const v = minV + (i / gridCount) * (maxV - minV);
          return { y: yPos(v), label: v.toFixed(2) };
        });

        const toggleRx = (id: string) => {
          setExpandedRxSet(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          });
        };

        return (
          <div className="space-y-5">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                ประวัติค่าสายตา ({prescriptions.length} ครั้ง)
              </h3>
              <button
                onClick={() => setShowRxModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5" />
                บันทึกค่าสายตาใหม่
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <Eye className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">ยังไม่มีบันทึกค่าสายตา</p>
              </div>
            ) : (
              <>
                {/* ── Trend Chart ─────────────────────────────────────────── */}
                {hasChart && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                    {/* Chart header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">กราฟแนวโน้มค่าสายตา</h4>
                        <span className="text-[9px] text-slate-400">{prescriptions.length} ครั้ง · วางเมาส์บนจุดเพื่อดูรายละเอียด</span>
                      </div>
                      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                        {(["sph", "cyl"] as const).map(m => (
                          <button key={m} onClick={() => setRxChartMetric(m)}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${rxChartMetric === m ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                            {m.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-5 mb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-0.5 bg-blue-500 rounded" />
                        <span className="text-[10px] text-slate-500 font-medium">OD (ขวา)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-0.5 bg-emerald-500 rounded" />
                        <span className="text-[10px] text-slate-500 font-medium">OS (ซ้าย)</span>
                      </div>
                    </div>

                    {/* Chart wrapper — relative for tooltip overlay */}
                    <div className="relative" onMouseLeave={() => setHoveredRxIdx(null)}>
                      {/* SVG Chart */}
                      <svg viewBox={`0 0 ${vW} ${vH}`} className="w-full" style={{ height: "280px" }}>
                        {/* Grid lines */}
                        {gridLines.map((g, i) => (
                          <g key={i}>
                            <line x1={padL} y1={g.y} x2={vW - padR} y2={g.y}
                              stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
                            <text x={padL - 5} y={g.y + 3.5} textAnchor="end" fontSize={9}
                              fill="currentColor" fillOpacity={0.5} fontFamily="monospace">
                              {g.label}
                            </text>
                          </g>
                        ))}
                        {/* Zero line */}
                        {minV < 0 && maxV > 0 && (
                          <line x1={padL} y1={yPos(0)} x2={vW - padR} y2={yPos(0)}
                            stroke="#94A3B8" strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="5,4" />
                        )}
                        {/* Hovered column highlight */}
                        {hoveredRxIdx !== null && (
                          <rect
                            x={xPos(hoveredRxIdx) - 16} y={padT - 5}
                            width={32} height={cH + 10}
                            rx={6} fill="currentColor" fillOpacity={0.05}
                          />
                        )}
                        {/* Area fill OD */}
                        {buildPath("R") && (
                          <path d={`${buildPath("R")} L${xPos(sorted.length-1).toFixed(1)},${yPos(minV).toFixed(1)} L${xPos(0).toFixed(1)},${yPos(minV).toFixed(1)} Z`}
                            fill="#3B82F6" fillOpacity={0.07} />
                        )}
                        {/* Area fill OS */}
                        {buildPath("L") && (
                          <path d={`${buildPath("L")} L${xPos(sorted.length-1).toFixed(1)},${yPos(minV).toFixed(1)} L${xPos(0).toFixed(1)},${yPos(minV).toFixed(1)} Z`}
                            fill="#10B981" fillOpacity={0.07} />
                        )}
                        {/* OD line */}
                        {buildPath("R") && <path d={buildPath("R")} fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
                        {/* OS line */}
                        {buildPath("L") && <path d={buildPath("L")} fill="none" stroke="#10B981" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}

                        {/* Data points + hover zones */}
                        {sorted.map((rx, i) => {
                          const vR = getChartVal(rx, "R");
                          const vL = getChartVal(rx, "L");
                          const isHovered = hoveredRxIdx === i;
                          const dateStr = new Date(rx.recordedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
                          return (
                            <g key={rx.id}>
                              {/* OD point */}
                              {vR !== null && (
                                <g>
                                  {isHovered && <circle cx={xPos(i)} cy={yPos(vR)} r={10} fill="#3B82F6" fillOpacity={0.15} />}
                                  <circle cx={xPos(i)} cy={yPos(vR)} r={isHovered ? 6 : 4.5} fill="#3B82F6" className="transition-all duration-150" />
                                  <circle cx={xPos(i)} cy={yPos(vR)} r={isHovered ? 3 : 2} fill="white" fillOpacity={0.95} className="transition-all duration-150" />
                                  <text x={xPos(i)} y={yPos(vR) - 11} textAnchor="middle" fontSize={9} fill="#3B82F6" fontFamily="monospace" fontWeight="bold" fillOpacity={isHovered ? 1 : 0.8}>
                                    {fmtRx(vR)}
                                  </text>
                                </g>
                              )}
                              {/* OS point */}
                              {vL !== null && (
                                <g>
                                  {isHovered && <circle cx={xPos(i)} cy={yPos(vL)} r={10} fill="#10B981" fillOpacity={0.15} />}
                                  <circle cx={xPos(i)} cy={yPos(vL)} r={isHovered ? 6 : 4.5} fill="#10B981" className="transition-all duration-150" />
                                  <circle cx={xPos(i)} cy={yPos(vL)} r={isHovered ? 3 : 2} fill="white" fillOpacity={0.95} className="transition-all duration-150" />
                                  <text x={xPos(i)} y={yPos(vL) + 19} textAnchor="middle" fontSize={9} fill="#10B981" fontFamily="monospace" fontWeight="bold" fillOpacity={isHovered ? 1 : 0.8}>
                                    {fmtRx(vL)}
                                  </text>
                                </g>
                              )}
                              {/* X-axis date label */}
                              <text x={xPos(i)} y={vH - 6} textAnchor="middle" fontSize={8.5} fill="currentColor"
                                fillOpacity={isHovered ? 0.8 : 0.45} fontWeight={isHovered ? "bold" : "normal"}>
                                {dateStr}
                              </text>
                              {/* Invisible hover zone (full column height) */}
                              <rect
                                x={xPos(i) - 20} y={padT - 8}
                                width={40} height={cH + 20}
                                fill="transparent"
                                style={{ cursor: "crosshair" }}
                                onMouseEnter={() => setHoveredRxIdx(i)}
                              />
                            </g>
                          );
                        })}
                      </svg>

                      {/* ── Tooltip overlay ─────────────────────────────── */}
                      {hoveredRxIdx !== null && (() => {
                        const hRx = sorted[hoveredRxIdx];
                        const hAge = calcAgeAt(customer.birthDate, hRx.recordedAt);
                        // Tooltip x% — flip left if right half
                        const xPct = ((xPos(hoveredRxIdx) - padL) / cW) * 100;
                        const flipLeft = xPct > 55;
                        return (
                          <div
                            className="absolute top-2 z-20 w-56 pointer-events-none"
                            style={{ [flipLeft ? "right" : "left"]: `${flipLeft ? (100 - xPct) + 2 : xPct + 2}%` }}
                          >
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-xs font-bold text-slate-800 dark:text-white">
                                  {new Date(hRx.recordedAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
                                </span>
                                {hAge && <span className="text-[9px] font-semibold text-indigo-500 dark:text-indigo-400">{hAge}</span>}
                              </div>
                              {/* Values grid */}
                              <div className="space-y-1">
                                {[
                                  { label: "Sph",  vR: fmtRx(hRx.sphR), vL: fmtRx(hRx.sphL) },
                                  { label: "Cyl",  vR: fmtRx(hRx.cylR), vL: fmtRx(hRx.cylL) },
                                  { label: "Axis", vR: fmtRx(hRx.axisR, true), vL: fmtRx(hRx.axisL, true) },
                                  { label: "Add",  vR: fmtRx(hRx.addR), vL: fmtRx(hRx.addL) },
                                  { label: "VA",   vR: hRx.vaR || "-",  vL: hRx.vaL || "-" },
                                ].map(row => (
                                  <div key={row.label} className="flex items-center gap-2 text-[10px]">
                                    <span className="w-8 text-slate-400 dark:text-slate-500 font-semibold shrink-0">{row.label}</span>
                                    <span className="flex-1 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{row.vR}</span>
                                    <span className="text-slate-300 dark:text-slate-600">/</span>
                                    <span className="flex-1 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{row.vL}</span>
                                  </div>
                                ))}
                              </div>
                              {/* Column labels */}
                              <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                                <span className="w-8" />
                                <span className="flex-1 text-center text-[9px] text-blue-500 font-bold">OD</span>
                                <span className="text-slate-300 dark:text-slate-600 text-[9px]">/</span>
                                <span className="flex-1 text-center text-[9px] text-emerald-500 font-bold">OS</span>
                              </div>
                              {hRx.recorderName && (
                                <p className="text-[9px] text-slate-400 mt-2">ผู้บันทึก: {hRx.recorderName}</p>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ── Accordion List ───────────────────────────────────── */}
                <div className="space-y-2">
                  {prescriptions.map((rx, idx) => {
                    const isOpen = expandedRxSet.has(rx.id) || (expandedRxSet.size === 0 && idx === 0);
                    const ageAtVisit = calcAgeAt(customer.birthDate, rx.recordedAt);
                    const sphSummary = `${fmtRx(rx.sphR)} / ${fmtRx(rx.sphL)}`;
                    const toggleRx = (rid: string) => setExpandedRxSet(prev => {
                      const next = new Set(prev); next.has(rid) ? next.delete(rid) : next.add(rid); return next;
                    });
                    return (
                      <div key={rx.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {/* Accordion Header */}
                        <button
                          onClick={() => toggleRx(rx.id)}
                          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition text-left"
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            idx === 0 ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}>
                            {prescriptions.length - idx}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-800 dark:text-white">{formatDate(rx.recordedAt)}</span>
                              {idx === 0 && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full">
                                  ล่าสุด
                                </span>
                              )}
                              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold">
                                อายุ {ageAtVisit} ณ วันตรวจ
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-mono">Sph OD/OS: {sphSummary}</span>
                              {rx.recorderName && <span className="text-[10px] text-slate-400">· {rx.recorderName}</span>}
                            </div>
                          </div>
                          {isOpen
                            ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          }
                        </button>
                        {/* Accordion Body */}
                        {isOpen && (
                          <div className="border-t border-slate-100 dark:border-slate-800 px-5 pb-5 pt-4">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <th className="text-left py-2 pr-3 text-slate-400 font-semibold w-12"></th>
                                    <th className="text-center py-2 px-3 text-blue-500 dark:text-blue-400 font-bold">OD (ขวา)</th>
                                    <th className="w-px bg-slate-100 dark:bg-slate-800" />
                                    <th className="text-center py-2 px-3 text-emerald-600 dark:text-emerald-400 font-bold">OS (ซ้าย)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                  {[
                                    { label: "Sph",  vR: fmtRx(rx.sphR),        vL: fmtRx(rx.sphL) },
                                    { label: "Cyl",  vR: fmtRx(rx.cylR),        vL: fmtRx(rx.cylL) },
                                    { label: "Axis", vR: fmtRx(rx.axisR, true), vL: fmtRx(rx.axisL, true) },
                                    { label: "Add",  vR: fmtRx(rx.addR),        vL: fmtRx(rx.addL) },
                                    { label: "PD",   vR: rx.pdR != null ? String(rx.pdR) : "-", vL: rx.pdL != null ? String(rx.pdL) : "-" },
                                    { label: "VA",   vR: rx.vaR || "-",          vL: rx.vaL || "-" },
                                  ].map(row => (
                                    <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                      <td className="py-2.5 pr-3 text-slate-400 dark:text-slate-500 font-semibold">{row.label}</td>
                                      <td className="text-center py-2.5 px-3 text-slate-700 dark:text-slate-200 font-mono font-medium">{row.vR}</td>
                                      <td className="w-px bg-slate-100 dark:bg-slate-800/60" />
                                      <td className="text-center py-2.5 px-3 text-slate-700 dark:text-slate-200 font-mono font-medium">{row.vL}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {(rx.oldGlassesNotes || rx.medicalHistory || rx.frameType || rx.notes) && (
                              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                                {rx.oldGlassesNotes && <div className="flex gap-2 text-xs"><span className="text-slate-400 dark:text-slate-500 font-semibold shrink-0">แว่นเดิม:</span><span className="text-slate-600 dark:text-slate-300">{rx.oldGlassesNotes}</span></div>}
                                {rx.medicalHistory && <div className="flex gap-2 text-xs"><span className="text-slate-400 dark:text-slate-500 font-semibold shrink-0">ประวัติสุขภาพตา:</span><span className="text-slate-600 dark:text-slate-300">{rx.medicalHistory}</span></div>}
                                {rx.frameType && <div className="flex gap-2 text-xs"><span className="text-slate-400 dark:text-slate-500 font-semibold shrink-0">กรอบ:</span><span className="text-slate-600 dark:text-slate-300">{rx.frameType}</span></div>}
                                {rx.notes && <div className="flex gap-2 text-xs"><span className="text-slate-400 dark:text-slate-500 font-semibold shrink-0">หมายเหตุ:</span><span className="text-slate-500 dark:text-slate-400 italic">{rx.notes}</span></div>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 3: ประวัติซื้อ
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{orders.length}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">คำสั่งซื้อทั้งหมด</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalSpent)}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">ยอดรวมทั้งหมด</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center sm:col-span-1 col-span-2">
              <p className="text-xl font-bold text-blue-400">
                {orders.length > 0 ? formatCurrency(Math.round(totalSpent / orders.length)) : "0 ฿"}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">เฉลี่ยต่อครั้ง</p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">ยังไม่มีประวัติการซื้อ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const statusInfo = ORDER_STATUS[order.status] || { label: order.status, className: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-700" };
                const isExpanded = expandedOrder === order.id;
                return (
                  <div key={order.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-900/30 border border-blue-800/50 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 dark:text-white">{order.orderNumber}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-slate-500">
                            <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                            {formatDate(order.createdAt)}
                          </span>
                          {order.sellerName && (
                            <span className="text-[10px] text-slate-500">by {order.sellerName}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(order.netAmount)}</p>
                        <p className="text-[10px] text-slate-500">{order.paymentMethod}</p>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      }
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-slate-800 px-4 pb-4 pt-3">
                        <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">รายการสินค้า</p>
                        <div className="space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-200 dark:border-slate-800/50 last:border-0">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                                <Package className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                              <div className="flex-grow min-w-0">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{item.productName}</p>
                                <p className="text-[10px] text-slate-500">{item.category} · จำนวน {item.quantity}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-semibold text-slate-800 dark:text-white">{formatCurrency(item.price)}</p>
                                {item.discount > 0 && (
                                  <p className="text-[10px] text-red-400">ส่วนลด -{formatCurrency(item.discount)}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {order.branchName && (
                          <p className="text-[10px] text-slate-500 mt-3">
                            <Building2 className="w-2.5 h-2.5 inline mr-1" />
                            {order.branchName}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 4: เคลม
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "claims" && (
        <div className="space-y-3">
          {claims.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">ไม่มีประวัติการเคลม</p>
            </div>
          ) : (
            claims.map(claim => {
              const statusInfo = CLAIM_STATUS[claim.status] || { label: claim.status, className: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-700" };
              return (
                <div key={claim.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          <Calendar className="w-2.5 h-2.5 inline mr-0.5" />
                          {formatDate(claim.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{claim.reason}</p>
                      {claim.resolution && (
                        <div className="mt-3 bg-emerald-900/10 border border-emerald-900/30 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-emerald-400 mb-1">การแก้ไข</p>
                          <p className="text-xs text-slate-300">{claim.resolution}</p>
                        </div>
                      )}
                    </div>
                    <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                      claim.status === "RESOLVED" ? "text-emerald-400" :
                      claim.status === "IN_REVIEW" ? "text-blue-400" : "text-amber-400"
                    }`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          EDIT CUSTOMER MODAL
          ════════════════════════════════════════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">แก้ไขข้อมูลลูกค้า</h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-grow px-6 py-5 space-y-4">

              {/* ── Photo Upload ── */}
              <div>
                <label className={labelCls}>รูปโปรไฟล์ลูกค้า</label>
                <div
                  className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/40 p-5 cursor-pointer hover:border-blue-500/60 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition group"
                  onClick={() => photoInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handlePhotoFile(f); }}
                >
                  {/* Hidden input */}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); }}
                  />

                  {photoUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  ) : photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="preview"
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-600 shadow-lg"
                      />
                      <button
                        onClick={e => { e.stopPropagation(); setPhotoPreview(null); setEditForm(p => ({ ...p, photoUrl: null })); }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center shadow"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-slate-700/60 border border-slate-600 flex items-center justify-center group-hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-400 transition" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">คลิกหรือลากรูปมาวาง</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WebP · ปรับขนาดอัตโนมัติ ≤ 480px</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>ชื่อ-นามสกุล (TH) *</label>
                  <input type="text" value={editForm.name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="ชื่อภาษาไทย" />
                </div>
                <div>
                  <label className={labelCls}>Name (EN)</label>
                  <input type="text" value={editForm.nameEn || ""} onChange={e => setEditForm(p => ({ ...p, nameEn: e.target.value }))} className={inputCls} placeholder="English name" />
                </div>
                <div>
                  <label className={labelCls}>เบอร์โทรศัพท์ *</label>
                  <input type="tel" value={editForm.phone || ""} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="08X-XXX-XXXX" />
                </div>
                <div>
                  <label className={labelCls}>อีเมล</label>
                  <input type="email" value={editForm.email || ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="email@example.com" />
                </div>
                <div>
                  <label className={labelCls}>LINE ID</label>
                  <input type="text" value={editForm.lineId || ""} onChange={e => setEditForm(p => ({ ...p, lineId: e.target.value }))} className={inputCls} placeholder="@lineId" />
                </div>
                <div>
                  <label className={labelCls}>เพศ</label>
                  <select value={editForm.gender || ""} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))} className={inputCls}>
                    <option value="">-- เลือก --</option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>วันเกิด</label>
                  <input type="date" value={editForm.birthDate ? editForm.birthDate.split("T")[0] : ""} onChange={e => setEditForm(p => ({ ...p, birthDate: e.target.value ? e.target.value + "T00:00:00Z" : null }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>เลขภาษี</label>
                  <input type="text" value={editForm.taxId || ""} onChange={e => setEditForm(p => ({ ...p, taxId: e.target.value }))} className={inputCls} placeholder="13 หลัก" maxLength={13} />
                </div>
              </div>
              <div>
                <label className={labelCls}>ที่อยู่</label>
                <textarea value={editForm.address || ""} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} rows={2} className={inputCls + " resize-none"} placeholder="ที่อยู่เต็ม" />
              </div>
              <div>
                <label className={labelCls}>ประวัติโรคประจำตัว / การแพ้ยา</label>
                <textarea value={editForm.medicalHistory || ""} onChange={e => setEditForm(p => ({ ...p, medicalHistory: e.target.value }))} rows={2} className={inputCls + " resize-none"} placeholder="ระบุโรคประจำตัวหรือยาที่แพ้ (ถ้ามี)" />
              </div>
              <div>
                <label className={labelCls}>หมายเหตุ</label>
                <textarea value={editForm.notes || ""} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={2} className={inputCls + " resize-none"} placeholder="หมายเหตุเพิ่มเติม" />
              </div>
              {editError && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-3">
                  <p className="text-xs text-red-300">{editError}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-700 transition">
                ยกเลิก
              </button>
              <button onClick={handleEditSave} disabled={!editForm.name || !editForm.phone || editSaving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          PRESCRIPTION FORM MODAL
          ════════════════════════════════════════════════════════════════════ */}
      {showRxModal && (() => {
        const rxCanSave = rxForm.sphR.trim() !== "" && rxForm.sphL.trim() !== "" && rxForm.recorderName.trim() !== "" && rxForm.recordedAt !== "";
        const reqCls = (val: string) => `px-3 py-2 text-sm text-center rounded-xl border font-mono focus:outline-none focus:ring-2 transition ${
          val.trim() === ""
            ? "border-red-300 dark:border-red-700/70 bg-red-50 dark:bg-red-900/10 text-slate-900 dark:text-slate-200 placeholder-red-300 dark:placeholder-red-700 focus:ring-red-500/40"
            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:ring-blue-500/50"
        }`;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRxModal(false)} />
            <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] flex flex-col">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white">บันทึกค่าสายตาใหม่</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-red-400 font-semibold">* จำเป็นต้องกรอก</span>
                  <button onClick={() => setShowRxModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-grow px-6 py-5 space-y-5">
                {/* ── Prescription values grid ───────────────────────── */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">ค่าสายตา</p>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-2.5">
                    {/* Column headers */}
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-end pb-1"></div>
                    <div className="text-center text-xs font-bold text-blue-500 dark:text-blue-400 pb-1">OD (ตาขวา)</div>
                    <div className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 pb-1">OS (ตาซ้าย)</div>

                    {[
                      { label: "Sph *", keyR: "sphR",  keyL: "sphL",  placeholder: "-2.50", required: true },
                      { label: "Cyl",   keyR: "cylR",  keyL: "cylL",  placeholder: "-0.75", required: false },
                      { label: "Axis",  keyR: "axisR", keyL: "axisL", placeholder: "180",   required: false },
                      { label: "Add",   keyR: "addR",  keyL: "addL",  placeholder: "+1.50", required: false },
                      { label: "PD",    keyR: "pdR",   keyL: "pdL",   placeholder: "32.0",  required: false },
                      { label: "VA",    keyR: "vaR",   keyL: "vaL",   placeholder: "6/6",   required: false },
                    ].map(row => (
                      <React.Fragment key={row.label}>
                        <div className="flex items-center">
                          <span className={`text-xs font-semibold ${row.required ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}`}>
                            {row.label}
                          </span>
                        </div>
                        <input
                          type="text" inputMode="decimal"
                          value={(rxForm as Record<string, string>)[row.keyR]}
                          onChange={e => setRxForm(p => ({ ...p, [row.keyR]: e.target.value }))}
                          placeholder={row.placeholder}
                          className={row.required ? reqCls((rxForm as Record<string, string>)[row.keyR]) + " focus:ring-blue-500/50" : "px-3 py-2 text-sm text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"}
                        />
                        <input
                          type="text" inputMode="decimal"
                          value={(rxForm as Record<string, string>)[row.keyL]}
                          onChange={e => setRxForm(p => ({ ...p, [row.keyL]: e.target.value }))}
                          placeholder={row.placeholder}
                          className={row.required ? reqCls((rxForm as Record<string, string>)[row.keyL]) + " focus:ring-emerald-500/50" : "px-3 py-2 text-sm text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"}
                        />
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* ── Date + Examiner (required) ─────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                      วันที่ตรวจ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={rxForm.recordedAt}
                      onChange={e => setRxForm(p => ({ ...p, recordedAt: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                      ผู้ตรวจ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={rxForm.recorderName}
                      onChange={e => setRxForm(p => ({ ...p, recorderName: e.target.value }))}
                      placeholder="ชื่อ OD / ผู้บันทึก"
                      className={rxForm.recorderName.trim() === ""
                        ? inputCls.replace("border-slate-200", "border-red-300").replace("dark:border-slate-700", "dark:border-red-700/70").replace("bg-slate-50", "bg-red-50").replace("dark:bg-slate-800/80", "dark:bg-red-900/10")
                        : inputCls
                      }
                    />
                  </div>
                </div>

                {/* ── Optional fields ───────────────────────────────── */}
                <div>
                  <label className={labelCls}>แว่นเดิม</label>
                  <textarea value={rxForm.oldGlassesNotes} onChange={e => setRxForm(p => ({ ...p, oldGlassesNotes: e.target.value }))} rows={2} className={inputCls + " resize-none"} placeholder="เช่น แว่น Oakley ใช้มา 2 ปี" />
                </div>
                <div>
                  <label className={labelCls}>ประวัติสุขภาพตา</label>
                  <textarea value={rxForm.medicalHistory} onChange={e => setRxForm(p => ({ ...p, medicalHistory: e.target.value }))} rows={2} className={inputCls + " resize-none"} placeholder="โรคตา / อาการที่เป็น" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>ชนิดกรอบ</label>
                    <input type="text" value={rxForm.frameType} onChange={e => setRxForm(p => ({ ...p, frameType: e.target.value }))} className={inputCls} placeholder="Half-rim / Full-rim" />
                  </div>
                  <div>
                    <label className={labelCls}>หมายเหตุ</label>
                    <input type="text" value={rxForm.notes} onChange={e => setRxForm(p => ({ ...p, notes: e.target.value }))} className={inputCls} placeholder="หมายเหตุเพิ่มเติม" />
                  </div>
                </div>

                {/* ── Error ─────────────────────────────────────────── */}
                {rxError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl p-3.5">
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 dark:text-red-400 text-lg leading-none shrink-0">⚠</span>
                      <p className="text-xs text-red-700 dark:text-red-300 whitespace-pre-line leading-relaxed">{rxError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <p className="text-[10px] text-slate-400">
                  {!rxCanSave ? "กรุณากรอก Sph OD, Sph OS, ผู้ตรวจ และวันที่ตรวจ" : ""}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowRxModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition">
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleRxSave}
                    disabled={rxSaving || !rxCanSave}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {rxSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    บันทึกค่าสายตา
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
