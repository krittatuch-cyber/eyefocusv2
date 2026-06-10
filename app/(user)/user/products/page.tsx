// app/(user)/user/products/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import {
  Package, Search, Loader2, AlertCircle, ImageIcon, RefreshCw,
  Tag, Layers,
} from "lucide-react";

type Category = "FRAME" | "LENS" | "CONTACT_LENS" | "SUNGLASSES" | "ACCESSORY" | "OTHER";

interface Product {
  id: string;
  code: string;
  name: string;
  category: Category;
  brand?: string | null;
  model?: string | null;
  price: number;
  imageUrl?: string | null;
  isActive: boolean;
}

const CAT_LABELS: Record<Category, string> = {
  FRAME: "กรอบแว่น",
  LENS: "เลนส์",
  CONTACT_LENS: "คอนแทคเลนส์",
  SUNGLASSES: "แว่นกันแดด",
  ACCESSORY: "อุปกรณ์เสริม",
  OTHER: "อื่นๆ",
};

const CAT_COLORS: Record<Category, string> = {
  FRAME:        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  LENS:         "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  CONTACT_LENS: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  SUNGLASSES:   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  ACCESSORY:    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  OTHER:        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const CATEGORIES: Category[] = ["FRAME", "LENS", "CONTACT_LENS", "SUNGLASSES", "ACCESSORY", "OTHER"];

export default function UserProductsPage() {
  const { locale, formatCurrency } = useI18n();

  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState<"ALL" | Category>("ALL");

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/products", { credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => setProducts(Array.isArray(data) ? data.filter((p: Product) => p.isActive) : []))
      .catch((err) => setError(err.message || "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q);
    const matchCat = catFilter === "ALL" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <Package className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
            {locale === "th" ? "คลังสินค้า" : "Products"}
          </h2>
        </div>
        <button
          onClick={fetchProducts}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === "th" ? "ค้นหาชื่อ รหัส หรือแบรนด์..." : "Search name, code or brand..."}
          className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none shadow-sm min-h-[44px]"
        />
      </div>

      {/* Category filter — horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(["ALL", ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border transition min-h-[36px] ${
              catFilter === cat
                ? "bg-accent border-accent text-white"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-accent hover:text-accent"
            }`}
          >
            {cat === "ALL" ? (locale === "th" ? "ทั้งหมด" : "All") : CAT_LABELS[cat as Category]}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchProducts} className="ml-auto underline font-semibold">{locale === "th" ? "ลองใหม่" : "Retry"}</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
          <Package className="w-10 h-10 opacity-30" />
          <p className="text-sm">{search ? (locale === "th" ? "ไม่พบสินค้าที่ค้นหา" : "No matching products") : (locale === "th" ? "ยังไม่มีสินค้า" : "No products yet")}</p>
        </div>
      ) : (
        <>
          <p className="text-[11px] text-slate-400">
            {locale === "th" ? "แสดง" : "Showing"} <span className="font-bold text-slate-600 dark:text-slate-300">{filtered.length}</span> {locale === "th" ? "รายการ" : "items"}
          </p>

          {/* Product cards — 1 col on mobile, 2 on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-3.5 shadow-sm flex gap-3"
              >
                {/* Thumbnail */}
                <div className="shrink-0">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* SKU + category */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{p.code}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${CAT_COLORS[p.category]}`}>
                      {CAT_LABELS[p.category]}
                    </span>
                  </div>

                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight truncate">{p.name}</p>

                  {p.brand && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{p.brand}{p.model ? ` · ${p.model}` : ""}</p>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Tag className="w-3 h-3 text-accent shrink-0" />
                    <span className="font-bold text-sm text-accent">{formatCurrency(p.price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
