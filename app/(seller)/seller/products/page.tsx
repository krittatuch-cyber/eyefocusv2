// app/(seller)/seller/products/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import {
  Package, Plus, Search, Percent, Loader2, AlertCircle,
  X, ImageIcon, ChevronDown, ChevronUp, Save,
} from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";
import { useSortPaginate } from "@/lib/hooks/useSortPaginate";
import SortHeader from "@/components/ui/SortHeader";
import Pagination from "@/components/ui/Pagination";

// ─── Types ───────────────────────────────────────────────────────────────────
type ProductCategory = "FRAME" | "LENS" | "CONTACT_LENS" | "SUNGLASSES" | "ACCESSORY" | "OTHER";

interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  brand?: string | null;
  model?: string | null;
  price: number;
  cost: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormState {
  code: string;
  name: string;
  category: ProductCategory;
  brand: string;
  model: string;
  price: string;
  cost: string;
  imageUrl: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES: ProductCategory[] = ["FRAME", "LENS", "CONTACT_LENS", "SUNGLASSES", "ACCESSORY", "OTHER"];

const CAT_LABELS: Record<ProductCategory, string> = {
  FRAME: "กรอบแว่น",
  LENS: "เลนส์",
  CONTACT_LENS: "คอนแทคเลนส์",
  SUNGLASSES: "แว่นกันแดด",
  ACCESSORY: "อุปกรณ์เสริม",
  OTHER: "อื่นๆ",
};

const CAT_COLORS: Record<ProductCategory, string> = {
  FRAME: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  LENS: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  CONTACT_LENS: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  SUNGLASSES: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  ACCESSORY: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  OTHER: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const EMPTY_FORM: FormState = {
  code: "",
  name: "",
  category: "FRAME",
  brand: "",
  model: "",
  price: "",
  cost: "",
  imageUrl: "",
};

// ─── Reusable form field ──────────────────────────────────────────────────────
function Field({
  label, value, onChange, type = "text", required, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition"
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Add Product Modal ────────────────────────────────────────────────────────
function AddModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) { setForm(EMPTY_FORM); setErr(null); }
  }, [open]);

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.code || !form.name || !form.category || !form.price || !form.cost) {
      setErr("กรุณากรอกข้อมูลที่จำเป็นให้ครบ");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          category: form.category,
          brand: form.brand || undefined,
          model: form.model || undefined,
          price: +form.price,
          cost: +form.cost,
          imageUrl: form.imageUrl || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">เพิ่มสินค้าใหม่</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {err && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-xl px-3 py-2.5 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {err}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <Field label="ชื่อสินค้า" value={form.name} onChange={set("name")} required placeholder="เช่น กรอบ Titanium A01" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <Field label="รหัสสินค้า (SKU)" value={form.code} onChange={set("code")} required placeholder="เช่น FR-001" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <SelectField
                label="หมวดหมู่"
                value={form.category}
                onChange={set("category")}
                required
                options={CATEGORIES.map((c) => ({ value: c, label: CAT_LABELS[c] }))}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <Field label="แบรนด์" value={form.brand} onChange={set("brand")} placeholder="เช่น Silhouette" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <Field label="โมเดล" value={form.model} onChange={set("model")} placeholder="เช่น SPX Full Rim" />
            </div>
            <div className="col-span-2 md:col-span-1" />
            <div>
              <Field label="ราคาทุน (บาท)" value={form.cost} onChange={set("cost")} type="number" required placeholder="0" />
            </div>
            <div>
              <Field label="ราคาขาย (บาท)" value={form.price} onChange={set("price")} type="number" required placeholder="0" />
            </div>
          </div>

          <ImageUpload
            label="รูปสินค้า"
            hint="JPG, PNG, WEBP · สูงสุด 10MB · ปรับขนาดอัตโนมัติ"
            value={form.imageUrl || null}
            onChange={(v) => setForm((f) => ({ ...f, imageUrl: v ?? "" }))}
            maxSizePx={600}
          />

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              บันทึกสินค้า
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Inline Edit Row ──────────────────────────────────────────────────────────
function EditRow({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: (updated: Product) => void;
}) {
  const [form, setForm] = useState<FormState>({
    code: product.code,
    name: product.name,
    category: product.category,
    brand: product.brand ?? "",
    model: product.model ?? "",
    price: String(product.price),
    cost: String(product.cost),
    imageUrl: product.imageUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setErr(null);
    if (!form.name || !form.price || !form.cost) {
      setErr("กรุณากรอกชื่อ ราคาทุน และราคาขาย");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          brand: form.brand || null,
          model: form.model || null,
          price: +form.price,
          cost: +form.cost,
          imageUrl: form.imageUrl || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const updated = await res.json();
      onSaved(updated);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td colSpan={7} className="p-0">
        <div className="mx-1 mb-2 bg-slate-50 dark:bg-slate-800/60 border border-violet-200 dark:border-violet-800/50 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-violet-700 dark:text-violet-300">แก้ไขสินค้า: {product.code}</p>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {err && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-xl px-3 py-2 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {err}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="col-span-2 md:col-span-1">
              <Field label="ชื่อสินค้า" value={form.name} onChange={set("name")} required />
            </div>
            <div>
              <Field label="แบรนด์" value={form.brand} onChange={set("brand")} />
            </div>
            <div>
              <Field label="โมเดล" value={form.model} onChange={set("model")} />
            </div>
            <div>
              <Field label="ราคาทุน (บาท)" value={form.cost} onChange={set("cost")} type="number" required />
            </div>
            <div>
              <Field label="ราคาขาย (บาท)" value={form.price} onChange={set("price")} type="number" required />
            </div>
          </div>

          <div className="max-w-sm">
            <ImageUpload
              label="รูปสินค้า"
              hint="JPG, PNG, WEBP · ปรับขนาดอัตโนมัติ"
              value={form.imageUrl || null}
              onChange={(v) => setForm((f) => ({ ...f, imageUrl: v ?? "" }))}
              maxSizePx={600}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              บันทึก
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { t, locale, formatCurrency } = useI18n();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<"ALL" | ProductCategory>("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/products", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => {
        setProducts([]);
        setError(err.message || "Failed to load products");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.brand ?? "").toLowerCase().includes(q);
    const matchesCat = catFilter === "ALL" || p.category === catFilter;
    return matchesSearch && matchesCat;
  });

  const { rows, sort, onSort, page, setPage, pageSize, onPageSize, totalPages, totalRows, from, to } = useSortPaginate({
    data: filtered,
    defaultSort: { key: "code", dir: "asc" },
    storageKey: "products",
    comparators: {
      price: (a, b) => a.price - b.price,
      cost: (a, b) => a.cost - b.cost,
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleProductSaved = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setExpandedId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {t("menu_products")}
          </h2>
          <p className="text-xs text-slate-500">
            {locale === "th"
              ? "จัดการรายการกรอบแว่น เลนส์ คอนแทคเลนส์ และอุปกรณ์เสริม"
              : "Manage frames, lenses, contact lenses and accessories"}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{locale === "th" ? "เพิ่มสินค้าใหม่" : "Add Product"}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {(["ALL", ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border shrink-0 transition duration-150 cursor-pointer ${
                catFilter === cat
                  ? "bg-accent border-accent text-white"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {cat === "ALL" ? (locale === "th" ? "ทั้งหมด" : "All") : CAT_LABELS[cat as ProductCategory]}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "th" ? "ค้นหาชื่อ รหัส หรือแบรนด์..." : "Search name, code, brand..."}
            className="block w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/40"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">{locale === "th" ? "กำลังโหลดข้อมูล..." : "Loading products..."}</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center space-x-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-500 rounded-2xl p-4 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">{locale === "th" ? "โหลดข้อมูลไม่สำเร็จ" : "Failed to load products"}</p>
            <p className="text-xs mt-0.5 text-red-400">{error}</p>
          </div>
          <button onClick={fetchProducts} className="ml-auto text-xs font-bold underline cursor-pointer">
            {locale === "th" ? "ลองใหม่" : "Retry"}
          </button>
        </div>
      )}

      {/* Product List — Card (mobile) + Table (md+) */}
      {!loading && !error && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Summary */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              แสดง <span className="font-bold text-slate-800 dark:text-slate-200">{filtered.length}</span> รายการ
              {catFilter !== "ALL" && <span> · หมวด {CAT_LABELS[catFilter as ProductCategory]}</span>}
            </p>
          </div>

          {/* ── Mobile Cards (< md) ───────────────────────────── */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center gap-2 text-slate-400">
                <Package className="w-8 h-8 opacity-40" />
                <p className="text-sm font-medium">ไม่พบสินค้า</p>
              </div>
            ) : (
              filtered.map((p) => {
                const margin = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
                const isExpanded = expandedId === p.id;
                return (
                  <div key={p.id}>
                    <button
                      onClick={() => toggleExpand(p.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition ${isExpanded ? "bg-violet-50/60 dark:bg-violet-900/10" : ""}`}
                    >
                      {/* Image */}
                      <div className="shrink-0">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            <ImageIcon className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono text-[10px] text-slate-400">{p.code}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${CAT_COLORS[p.category]}`}>{CAT_LABELS[p.category]}</span>
                        </div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{p.brand || "—"}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(p.price)}</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-bold">
                            <Percent className="w-2.5 h-2.5" />{margin.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    {/* Inline edit (mobile) */}
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <EditRow product={p} onClose={() => setExpandedId(null)} onSaved={handleProductSaved} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ── Desktop Table (≥ md) ───────────────────────────── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                  <th className="pl-5 py-3 w-12">รูป</th>
                  <SortHeader col="code" label={locale === "th" ? "รหัสสินค้า" : "SKU"} sortKey={sort.key} dir={sort.dir} onSort={onSort} />
                  <SortHeader col="name" label={locale === "th" ? "ชื่อสินค้า / หมวด" : "Product / Category"} sortKey={sort.key} dir={sort.dir} onSort={onSort} />
                  <th className="py-3">{locale === "th" ? "แบรนด์" : "Brand"}</th>
                  <SortHeader col="cost" label={locale === "th" ? "ราคาทุน" : "Cost"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="right" />
                  <SortHeader col="price" label={locale === "th" ? "ราคาขาย" : "Price"} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="right" />
                  <th className="py-3 text-right pr-5">{locale === "th" ? "มาร์จิ้น" : "Margin"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Package className="w-8 h-8 opacity-40" />
                        <p className="text-sm font-medium">{locale === "th" ? "ไม่พบสินค้า" : "No products found"}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => {
                    const margin = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
                    const isExpanded = expandedId === p.id;
                    return (
                      <React.Fragment key={p.id}>
                        <tr onClick={() => toggleExpand(p.id)} className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${isExpanded ? "bg-violet-50/60 dark:bg-violet-900/10" : ""}`}>
                          <td className="pl-5 py-3">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                <ImageIcon className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                              </div>
                            )}
                          </td>
                          <td className="py-3 font-mono font-semibold text-slate-700 dark:text-slate-200 text-[11px]">{p.code}</td>
                          <td className="py-3">
                            <p className="text-slate-900 dark:text-slate-100 font-semibold leading-tight">{p.name}</p>
                            <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${CAT_COLORS[p.category]}`}>{CAT_LABELS[p.category]}</span>
                          </td>
                          <td className="py-3 text-slate-500 dark:text-slate-400">{p.brand || "—"}</td>
                          <td className="py-3 text-right text-slate-400">{formatCurrency(p.cost)}</td>
                          <td className="py-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(p.price)}</td>
                          <td className="py-3 text-right pr-5">
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-bold border border-emerald-500/10">
                              <Percent className="w-2.5 h-2.5" />{margin.toFixed(0)}%
                            </span>
                            <span className="ml-1.5 text-slate-300 dark:text-slate-600">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 inline" /> : <ChevronDown className="w-3.5 h-3.5 inline" />}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && <EditRow product={p} onClose={() => setExpandedId(null)} onSaved={handleProductSaved} />}
                      </React.Fragment>
                    );
                  })
                )}
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
        </div>
      )}

      {/* Add Product Modal */}
      <AddModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={fetchProducts}
      />
    </div>
  );
}
