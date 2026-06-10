// app/(user)/user/stock-receive/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import {
  PackagePlus, Search, Plus, Minus, Loader2, AlertCircle,
  CheckCircle2, ChevronDown, ChevronUp, Package,
} from "lucide-react";

interface Product { id: string; code: string; name: string; category: string; }
interface Branch  { id: string; name: string; }
interface CartItem { product: Product; qty: number; }

export default function StockReceivePage() {
  const { locale } = useI18n();

  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // Form state
  const [branchId, setBranchId] = useState("");
  const [search,   setSearch]   = useState("");
  const [cart,     setCart]     = useState<CartItem[]>([]);
  const [notes,    setNotes]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [showCart,   setShowCart]   = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [pRes, bRes] = await Promise.all([
        fetch("/api/products", { credentials: "include" }),
        fetch("/api/branches", { credentials: "include" }),
      ]);
      if (!pRes.ok) throw new Error(`Products: HTTP ${pRes.status}`);
      if (!bRes.ok) throw new Error(`Branches: HTTP ${bRes.status}`);
      const pData = await pRes.json();
      const bData = await bRes.json();
      setProducts(Array.isArray(pData) ? pData : []);
      const bList = Array.isArray(bData) ? bData : bData.data ?? [];
      setBranches(bList);
      if (bList.length > 0) setBranchId(bList[0].id);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  const addToCart = (p: Product) => {
    setCart(prev => {
      const exists = prev.find(i => i.product.id === p.id);
      if (exists) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: p, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(i => i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
        .filter(i => i.qty > 0)
    );
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.product.id !== id));

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const handleSubmit = async () => {
    if (!branchId || cart.length === 0) return;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "RECEIVE",
          branchId,
          items: cart.map(i => ({ productId: i.product.id, quantity: i.qty })),
          notes,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      setCart([]); setNotes(""); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-2">
        <PackagePlus className="w-5 h-5 text-accent" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
          {locale === "th" ? "รับเข้าสต็อกสินค้า" : "Receive Stock"}
        </h2>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{locale === "th" ? "รับสินค้าเข้าสต็อกสำเร็จ!" : "Stock received successfully!"}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
      ) : (
        <>
          {/* Branch selector */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{locale === "th" ? "รับเข้าสาขา" : "Receiving Branch"}</label>
            <select
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none min-h-[44px]"
            >
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Product search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={locale === "th" ? "ค้นหาสินค้าเพื่อเพิ่ม..." : "Search product to add..."}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none shadow-sm min-h-[44px]"
            />
          </div>

          {/* Product list */}
          {search && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
              {filtered.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">{locale === "th" ? "ไม่พบสินค้า" : "No products found"}</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                  {filtered.slice(0, 20).map(p => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.code} · {p.category}</p>
                      </div>
                      <button
                        onClick={() => addToCart(p)}
                        className="shrink-0 ml-3 w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cart toggle */}
          {cart.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowCart(!showCart)}
                className="w-full flex items-center justify-between px-4 py-3 min-h-[52px]"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {locale === "th" ? "รายการรับเข้า" : "Receive List"}
                  </span>
                  <span className="text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-full">{totalItems} ชิ้น</span>
                </div>
                {showCart ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showCart && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-700">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">{item.product.name}</p>
                        <p className="text-[10px] text-slate-400">{item.product.code}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <button onClick={() => changeQty(item.product.id, -1)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <Minus className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                        </button>
                        <span className="font-bold text-sm w-8 text-center">{item.qty}</span>
                        <button onClick={() => changeQty(item.product.id, 1)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <Plus className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{locale === "th" ? "หมายเหตุ" : "Notes"}</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={locale === "th" ? "เช่น จากซัพพลายเออร์ใด, เลขที่ใบสั่งซื้อ..." : "e.g., supplier name, PO number..."}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={cart.length === 0 || !branchId || submitting}
            className="w-full py-3.5 bg-accent hover:bg-accent-hover text-white text-sm font-bold rounded-2xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px]"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PackagePlus className="w-5 h-5" />}
            <span>{locale === "th" ? `รับเข้าสต็อก (${totalItems} ชิ้น)` : `Receive to Stock (${totalItems} pcs)`}</span>
          </button>
        </>
      )}
    </div>
  );
}
