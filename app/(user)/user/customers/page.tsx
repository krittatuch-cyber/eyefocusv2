// app/(user)/user/customers/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Users, Plus, Save, Award, Loader2, AlertCircle, X, Search } from "lucide-react";

export default function CustomersPage() {
  const { t, locale, formatDate } = useI18n();

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [lineId, setLineId] = useState("");
  const [gender, setGender] = useState("หญิง");
  const [notes, setNotes] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/customers?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setCustomers(data.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadCustomers, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search, loadCustomers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert(locale === "th" ? "กรุณากรอกชื่อและเบอร์โทรศัพท์" : "Please fill in Name and Phone");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, phone, email, lineId, gender, notes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setLineId("");
      setNotes("");
      setShowAddForm(false);
      await loadCustomers();
    } catch (err: any) {
      setError(err.message || "Failed to register customer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-1.5">
          <Users className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
            {t("menu_customers")}
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>{showAddForm ? t("cancel") : t("addCustomer")}</span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={locale === "th" ? "ค้นหาชื่อหรือเบอร์โทร..." : "Search name or phone..."}
          className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none shadow-sm"
        />
      </div>

      {/* 1. Add Customer Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{locale === "th" ? "ชื่อ-นามสกุล" : "Name"}</label>
              <input
                type="text" required value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="คุณใจดี มีสุข"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("phone")}</label>
              <input
                type="text" required value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081-xxxxxxx"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("email")}</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">LINE ID</label>
              <input
                type="text" value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder="line_id"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("gender")}</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              >
                <option value="หญิง">หญิง</option>
                <option value="ชาย">ชาย</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t("notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ข้อควรระวังหรือข้อมูลเพิ่มเติม..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{t("save")}</span>
          </button>
        </form>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-accent animate-spin" />
          <span className="ml-2 text-xs text-slate-400">{locale === "th" ? "กำลังโหลด..." : "Loading..."}</span>
        </div>
      )}

      {/* 2. Customer Directory */}
      {!loading && (
        <div className="space-y-2.5">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 font-bold text-xs">
                    {(c.name || "?").charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{c.name}</h3>
                    <span className="text-[9px] text-slate-400">{t("phone")}: {c.phone}</span>
                  </div>
                </div>

                {c.loyaltyTier && (
                  <span className="text-[9px] font-bold bg-accent/5 text-accent px-2 py-1 rounded-lg flex items-center">
                    <Award className="w-3 h-3 mr-1" />
                    <span>{c.loyaltyTier}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-slate-500">
                <div>
                  <span>{t("points")}:</span>{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{c.loyaltyPoints ?? 0}</span>
                </div>
                <div>
                  <span>LINE ID:</span>{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{c.lineId || "-"}</span>
                </div>
              </div>

              {c.notes && (
                <p className="text-[9px] bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-slate-500 leading-tight">
                  <span className="font-bold">{t("notes")}:</span> {c.notes}
                </p>
              )}

              {/* Link to measurements */}
              <div className="flex justify-between text-[9px] text-slate-400 border-t border-slate-100 dark:border-slate-800/40 pt-2">
                <span>{locale === "th" ? "สมาชิกเมื่อ:" : "Joined:"} {formatDate(c.createdAt)}</span>
              </div>
            </div>
          ))}
          {customers.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400 text-xs">
              {locale === "th" ? "ไม่พบลูกค้า" : "No customers found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
