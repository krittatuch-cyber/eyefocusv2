// app/(seller)/seller/customers/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSortPaginate } from "@/lib/hooks/useSortPaginate";
import SortHeader from "@/components/ui/SortHeader";
import Pagination from "@/components/ui/Pagination";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import {
  Users, Search, Eye, Star, Phone, Mail, Plus, X, Check,
  RefreshCw, Crown, Award, Shield, Loader2, Download,
  Calendar, FileText, User, MapPin, CreditCard, Heart,
} from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  nameEn?: string | null;
  phone: string;
  email?: string | null;
  lineId?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  address?: string | null;
  taxId?: string | null;
  photoUrl?: string | null;
  medicalHistory?: string | null;
  loyaltyPoints: number;
  loyaltyTier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  createdAt: string;
}

interface ApiSummary {
  total: number;
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
  newThisMonth: number;
}

interface ApiResponse {
  data: Customer[];
  pagination: { page: number; limit: number; total: number };
  summary?: ApiSummary;
}

interface AddForm {
  name: string;
  nameEn: string;
  phone: string;
  email: string;
  lineId: string;
  gender: string;
  birthDate: string;
  address: string;
  taxId: string;
  photoUrl: string;
  medicalHistory: string;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_STYLE: Record<string, { badge: string; avatar: string; label: string }> = {
  PLATINUM: {
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300 dark:border-purple-700",
    avatar: "bg-purple-500",
    label: "PLATINUM",
  },
  GOLD: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
    avatar: "bg-amber-500",
    label: "GOLD",
  },
  SILVER: {
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300 border border-slate-300 dark:border-slate-600",
    avatar: "bg-slate-400",
    label: "SILVER",
  },
  BRONZE: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-300 dark:border-orange-700",
    avatar: "bg-orange-400",
    label: "BRONZE",
  },
};

const TIER_ICONS: Record<string, React.ElementType> = {
  PLATINUM: Crown,
  GOLD: Award,
  SILVER: Shield,
  BRONZE: Star,
};

const EMPTY_FORM: AddForm = {
  name: "", nameEn: "", phone: "", email: "", lineId: "",
  gender: "", birthDate: "", address: "", taxId: "",
  photoUrl: "", medicalHistory: "", notes: "",
};

const INPUT_CLS =
  "w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 " +
  "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition";

// ─── Page Component ───────────────────────────────────────────────────────────

export default function SellerCustomersPage() {
  const { locale } = useI18n();
  const router = useRouter();

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<ApiSummary>({
    total: 0, platinum: 0, gold: 0, silver: 0, bronze: 0, newThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filter / search
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AddForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ─── Load Customers ──────────────────────────────────────────────────────

  const loadCustomers = useCallback(async (searchVal: string, tier: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (searchVal) params.set("search", searchVal);
      if (tier !== "ALL") params.set("tier", tier);

      const res = await fetch(`/api/customers?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json: ApiResponse = await res.json();

      setCustomers(json.data || []);
      setTotal(json.pagination?.total || 0);
      if (json.summary) setSummary(json.summary);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCustomers(search, tierFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadCustomers(val, tierFilter);
    }, 400);
  };

  // Tier filter (instant)
  const handleTierChange = (tier: string) => {
    setTierFilter(tier);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    loadCustomers(search, tier);
  };

  // ─── Add Customer ────────────────────────────────────────────────────────

  const handleAddCustomer = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          nameEn: form.nameEn.trim() || undefined,
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          lineId: form.lineId.trim() || undefined,
          gender: form.gender || undefined,
          birthDate: form.birthDate || undefined,
          address: form.address.trim() || undefined,
          taxId: form.taxId.trim() || undefined,
          photoUrl: form.photoUrl.trim() || undefined,
          medicalHistory: form.medicalHistory.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error || `Error ${res.status}`);
        return;
      }
      setSaveSuccess(true);
      setForm(EMPTY_FORM);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowModal(false);
      }, 1200);
      await loadCustomers(search, tierFilter);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setSaveError("");
    setSaveSuccess(false);
  };

  // ─── Sort + Pagination ───────────────────────────────────────────────────

  const TIER_ORDER: Record<string, number> = { BRONZE: 0, SILVER: 1, GOLD: 2, PLATINUM: 3 };

  const { rows, sort, onSort, page, setPage, pageSize, onPageSize, totalPages, totalRows, from, to } =
    useSortPaginate<Customer>({
      data: customers,
      defaultSort: { key: "name", dir: "asc" },
      storageKey: "customers",
      comparators: {
        loyaltyTier: (a, b) => TIER_ORDER[a.loyaltyTier] - TIER_ORDER[b.loyaltyTier],
      },
    });

  // ─── Summary Cards ───────────────────────────────────────────────────────

  const cards = [
    {
      label: "ลูกค้าทั้งหมด",
      value: summary.total || total,
      color: "text-blue-600 dark:text-blue-400",
      bg: "from-blue-50 to-blue-100/60 dark:from-blue-900/20 dark:to-blue-900/10",
      border: "border-blue-200 dark:border-blue-800",
      icon: Users,
    },
    {
      label: "PLATINUM",
      value: summary.platinum,
      color: "text-purple-600 dark:text-purple-400",
      bg: "from-purple-50 to-purple-100/60 dark:from-purple-900/20 dark:to-purple-900/10",
      border: "border-purple-200 dark:border-purple-800",
      icon: Crown,
    },
    {
      label: "GOLD",
      value: summary.gold,
      color: "text-amber-600 dark:text-amber-400",
      bg: "from-amber-50 to-amber-100/60 dark:from-amber-900/20 dark:to-amber-900/10",
      border: "border-amber-200 dark:border-amber-800",
      icon: Award,
    },
    {
      label: "สมาชิกใหม่เดือนนี้",
      value: summary.newThisMonth,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "from-emerald-50 to-emerald-100/60 dark:from-emerald-900/20 dark:to-emerald-900/10",
      border: "border-emerald-200 dark:border-emerald-800",
      icon: User,
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">

      {/* ── Gradient Header ─────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-6 shadow-lg">
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(30%, -40%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(-30%, 40%)" }}
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">รายการลูกค้า</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm">
                {total.toLocaleString()} ราย
              </span>
            </div>
            <p className="text-blue-100 text-xs">
              {locale === "th" ? "จัดการฐานข้อมูลลูกค้าและโปรแกรมสะสมแต้ม" : "Manage customer database and loyalty program"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Refresh */}
            <button
              onClick={() => loadCustomers(search, tierFilter)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              รีเฟรช
            </button>

            {/* Export CSV */}
            <a
              href="/api/customers?export=csv"
              download
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </a>

            {/* Add Customer */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-700 text-xs font-bold shadow-md hover:bg-blue-50 transition"
            >
              <Plus className="w-4 h-4" />
              + เพิ่มลูกค้า
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`bg-gradient-to-br ${card.bg} rounded-2xl p-4 border ${card.border} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{card.label}</p>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className={`text-2xl font-bold font-heading ${card.color}`}>
                {card.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Search + Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, เบอร์โทร..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition"
          />
        </div>

        {/* Tier filter */}
        <div className="flex gap-1 flex-wrap">
          {["ALL", "PLATINUM", "GOLD", "SILVER", "BRONZE"].map((tier) => (
            <button
              key={tier}
              onClick={() => handleTierChange(tier)}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition ${
                tierFilter === tier
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* ── Customer List — Card (mobile) + Table (md+) ─────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs text-slate-400">กำลังโหลดข้อมูล...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Users className="w-10 h-10 opacity-30" />
            <p className="text-sm">{search ? "ไม่พบลูกค้าที่ค้นหา" : "ยังไม่มีลูกค้า"}</p>
          </div>
        ) : (
          <>
            {/* ── Mobile Cards (< md) ──────────────────────────────── */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {customers.map((c) => {
                const style = TIER_STYLE[c.loyaltyTier] ?? TIER_STYLE.BRONZE;
                const TierIcon = TIER_ICONS[c.loyaltyTier] ?? Star;
                return (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    {/* Avatar */}
                    <div className="shrink-0">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.name} className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700" />
                      ) : (
                        <div className={`w-12 h-12 rounded-xl ${style.avatar} flex items-center justify-center text-white text-sm font-bold`}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{c.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[11px] text-slate-500">{c.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${style.badge}`}>
                          <TierIcon className="w-2.5 h-2.5" />{c.loyaltyTier}
                        </span>
                        <span className="text-[10px] text-slate-400">{c.loyaltyPoints.toLocaleString()} pts</span>
                      </div>
                    </div>
                    {/* Action */}
                    <button
                      onClick={() => router.push(`/seller/customers/${c.id}`)}
                      className="shrink-0 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop Table (≥ md) ─────────────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left px-4 py-3 font-semibold w-16">รูป</th>
                    <SortHeader col="name" label="ชื่อ" sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                    <SortHeader col="phone" label="เบอร์โทร" sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                    <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">อีเมล</th>
                    <SortHeader col="loyaltyTier" label="ระดับ" sortKey={sort.key} dir={sort.dir} onSort={onSort} align="center" />
                    <SortHeader col="loyaltyPoints" label="แต้ม" sortKey={sort.key} dir={sort.dir} onSort={onSort} align="right" className="hidden lg:table-cell" />
                    <SortHeader col="createdAt" label="วันที่สมัคร" sortKey={sort.key} dir={sort.dir} onSort={onSort} align="center" className="hidden xl:table-cell" />
                    <th className="text-center px-4 py-3 font-semibold">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((c) => {
                    const style = TIER_STYLE[c.loyaltyTier] ?? TIER_STYLE.BRONZE;
                    const TierIcon = TIER_ICONS[c.loyaltyTier] ?? Star;
                    const initials = c.name.charAt(0).toUpperCase();
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-2.5">
                          {c.photoUrl ? (
                            <img src={c.photoUrl} alt={c.name} className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm" />
                          ) : (
                            <div className={`w-12 h-12 rounded-xl ${style.avatar} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>{initials}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</p>
                          {c.nameEn && <p className="text-[10px] text-slate-400 mt-0.5">{c.nameEn}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400 shrink-0" />{c.phone}</div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {c.email ? <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Mail className="w-3 h-3 shrink-0" /><span className="truncate max-w-[160px]">{c.email}</span></div> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${style.badge}`}><TierIcon className="w-2.5 h-2.5" />{c.loyaltyTier}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300 hidden lg:table-cell">
                          {c.loyaltyPoints.toLocaleString()}<span className="text-[9px] text-slate-400 font-normal ml-0.5">pts</span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400 hidden xl:table-cell">
                          {new Date(c.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => router.push(`/seller/customers/${c.id}`)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition">
                            <Eye className="w-3 h-3" />ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalRows={totalRows}
                from={from}
                to={to}
                pageSize={pageSize}
                onPage={setPage}
                onPageSize={onPageSize}
                locale={locale}
              />
            </div>
          </>
        )}

        {/* Footer — handled by Pagination inside the desktop table wrapper */}
      </div>

      {/* ── Add Customer Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white">เพิ่มลูกค้าใหม่</h2>
                  <p className="text-[10px] text-slate-400">กรอกข้อมูลลูกค้าให้ครบถ้วน</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body — scrollable */}
            <div className="overflow-y-auto px-6 py-5 space-y-5">

              {/* Section: ข้อมูลหลัก */}
              <div>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <User className="w-3 h-3" /> ข้อมูลหลัก
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">
                      ชื่อ (ภาษาไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="สมชาย ใจดี"
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">ชื่อ (ภาษาอังกฤษ)</label>
                    <input
                      type="text"
                      value={form.nameEn}
                      onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
                      placeholder="Somchai Jaidee"
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
              </div>

              {/* Section: ช่องทางติดต่อ */}
              <div>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> ช่องทางติดต่อ
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">
                      เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="0812345678"
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">อีเมล</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="example@email.com"
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">LINE ID</label>
                    <input
                      type="text"
                      value={form.lineId}
                      onChange={(e) => setForm((p) => ({ ...p, lineId: e.target.value }))}
                      placeholder="@lineid"
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
              </div>

              {/* Section: ข้อมูลส่วนตัว */}
              <div>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> ข้อมูลส่วนตัว
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">เพศ</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                      className={INPUT_CLS}
                    >
                      <option value="">— ไม่ระบุ —</option>
                      <option value="M">ชาย</option>
                      <option value="F">หญิง</option>
                      <option value="OTHER">ไม่ระบุ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">วันเกิด</label>
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">
                    <MapPin className="w-3 h-3 inline mr-1" />ที่อยู่
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    rows={2}
                    placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด"
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>
              </div>

              {/* Section: ข้อมูลทางการ */}
              <div>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" /> ข้อมูลทางการ
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">เลขประจำตัวผู้เสียภาษี</label>
                    <input
                      type="text"
                      value={form.taxId}
                      onChange={(e) => setForm((p) => ({ ...p, taxId: e.target.value }))}
                      placeholder="1234567890123"
                      maxLength={13}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
              </div>

              {/* Section: รูปโปรไฟล์ */}
              <div>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <User className="w-3 h-3" /> รูปโปรไฟล์ลูกค้า
                </p>
                <ImageUpload
                  value={form.photoUrl || null}
                  onChange={v => setForm(p => ({ ...p, photoUrl: v ?? "" }))}
                  maxSizePx={400}
                  hint="JPG, PNG, WEBP · สูงสุด 10MB · ปรับขนาดอัตโนมัติ"
                />
              </div>

              {/* Section: ข้อมูลสุขภาพ */}
              <div>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Heart className="w-3 h-3" /> ข้อมูลสุขภาพ &amp; หมายเหตุ
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">ประวัติโรคประจำตัว</label>
                    <textarea
                      value={form.medicalHistory}
                      onChange={(e) => setForm((p) => ({ ...p, medicalHistory: e.target.value }))}
                      rows={2}
                      placeholder="เบาหวาน, ความดัน, แพ้ยา..."
                      className={`${INPUT_CLS} resize-none`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">
                      <FileText className="w-3 h-3 inline mr-1" />หมายเหตุ
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                      rows={2}
                      placeholder="หมายเหตุเพิ่มเติม..."
                      className={`${INPUT_CLS} resize-none`}
                    />
                  </div>
                </div>
              </div>

              {/* Error */}
              {saveError && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                  ❌ {saveError}
                </p>
              )}

              {/* Success */}
              {saveSuccess && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
                  ✅ เพิ่มลูกค้าสำเร็จ!
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={!form.name.trim() || !form.phone.trim() || saving || saveSuccess}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {saving ? "กำลังบันทึก..." : saveSuccess ? "บันทึกแล้ว!" : "บันทึกข้อมูล"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
