// app/(seller)/seller/suppliers/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { db } from "@/lib/db-mock";
import { Truck, Phone, Mail, MapPin, Search, Plus, Tag, X, Check } from "lucide-react";

const CAT_COLOR: Record<string, string> = {
  FRAME: "bg-blue-100 dark:bg-blue-950/30 text-blue-600",
  LENS: "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600",
  CONTACT_LENS: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600",
  ACCESSORY: "bg-pink-100 dark:bg-pink-950/30 text-pink-600",
  SUNGLASSES: "bg-amber-100 dark:bg-amber-950/30 text-amber-600",
};

export default function SuppliersPage() {
  const { locale } = useI18n();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [catFilter, setCatFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", address: "", paymentTerms: "" });

  useEffect(() => {
    setSuppliers(db.suppliers.map((s: any) => {
      // Count products matching this supplier by categories
      const productCount = db.products.filter((p: any) => s.categories.includes(p.category)).length;
      return { ...s, productCount };
    }));
  }, []);

  const filtered = suppliers.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.contact.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "ALL" || (s.categories || []).includes(catFilter);
    return matchSearch && matchCat;
  });

  const handleAdd = () => {
    if (!form.name || !form.contact) return;
    const newS: any = { id: "sup_" + Date.now(), ...form, categories: [], productCount: 0, createdAt: new Date(), updatedAt: new Date() };
    db.suppliers.unshift(newS);
    setSuppliers([newS, ...suppliers]);
    setForm({ name: "", contact: "", phone: "", email: "", address: "", paymentTerms: "" });
    setShowForm(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {locale === "th" ? "รายชื่อผู้จำหน่าย / Supplier" : "Supplier Directory"}
          </h2>
          <p className="text-xs text-slate-500">{locale === "th" ? "บริษัทผู้จัดจำหน่ายกรอบแว่น เลนส์ และอุปกรณ์เสริม" : "Frame, lens, and accessory suppliers"}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>{locale === "th" ? "เพิ่ม Supplier" : "Add Supplier"}</span>
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2 text-xs text-emerald-600 font-semibold">
          <Check className="w-4 h-4" />{locale === "th" ? "เพิ่ม Supplier สำเร็จ" : "Supplier added"}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-slate-900 dark:text-white">{locale === "th" ? "เพิ่ม Supplier ใหม่" : "New Supplier"}</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button></div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: "name", l: locale === "th" ? "ชื่อบริษัท *" : "Company Name *" },
              { k: "contact", l: locale === "th" ? "ชื่อผู้ติดต่อ *" : "Contact Person *" },
              { k: "phone", l: locale === "th" ? "เบอร์โทร" : "Phone" },
              { k: "email", l: "Email" },
              { k: "address", l: locale === "th" ? "ที่อยู่" : "Address" },
              { k: "paymentTerms", l: locale === "th" ? "เงื่อนไขชำระ" : "Payment Terms" },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">{f.l}</label>
                <input value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl cursor-pointer">
              {locale === "th" ? "ยกเลิก" : "Cancel"}
            </button>
            <button onClick={handleAdd} className="px-4 py-1.5 text-xs font-bold bg-accent text-white rounded-xl cursor-pointer">
              {locale === "th" ? "บันทึก" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {["ALL","FRAME","LENS","CONTACT_LENS","ACCESSORY","SUNGLASSES"].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition cursor-pointer ${
                catFilter === c ? "bg-accent border-accent text-white" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"}`}>
              {c === "ALL" ? (locale === "th" ? "ทั้งหมด" : "All") : c}
            </button>
          ))}
        </div>
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={locale === "th" ? "ค้นหาชื่อบริษัท..." : "Search company..."}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none" />
        </div>
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</h3>
                <p className="text-[10px] text-slate-400">{s.contact}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-500">
              {s.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5"/>{s.phone}</div>}
              {s.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5"/>{s.email}</div>}
              {s.address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5"/>{s.address}</div>}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(s.categories || []).map((cat: string) => (
                <span key={cat} className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${CAT_COLOR[cat] || "bg-slate-100 text-slate-500"}`}>
                  <Tag className="w-2.5 h-2.5"/>{cat}
                </span>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between text-xs text-slate-500">
              <span>{locale === "th" ? `เครดิต: ${s.paymentTerms}` : `Terms: ${s.paymentTerms}`}</span>
              <span className="font-semibold text-accent">{s.productCount} {locale === "th" ? "ผลิตภัณฑ์" : "products"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
