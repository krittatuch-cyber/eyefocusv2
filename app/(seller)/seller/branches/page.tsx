// app/(seller)/seller/branches/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Building2, Plus, Phone, MapPin, Users, ShoppingBag, Loader2, AlertCircle } from "lucide-react";

export default function BranchesPage() {
  const { t, locale } = useI18n();

  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchBranches = () => {
    setLoading(true);
    setError(null);
    fetch("/api/branches", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch((err) => {
        setBranches([]);
        setError(err.message || "Failed to load branches");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddBranch = async () => {
    const name = window.prompt(locale === "th" ? "ชื่อสาขา:" : "Branch name:");
    if (!name) return;
    const code = window.prompt(locale === "th" ? "รหัสสาขา:" : "Branch code:");
    if (!code) return;
    const address = window.prompt(locale === "th" ? "ที่อยู่:" : "Address:") ?? "";
    const phone = window.prompt(locale === "th" ? "เบอร์โทร:" : "Phone:") ?? "";

    setAdding(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, address, phone }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchBranches();
    } catch (err: any) {
      alert(locale === "th" ? `เกิดข้อผิดพลาด: ${err.message}` : `Error: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white leading-none mb-1">
            {t("menu_branches")}
          </h2>
          <p className="text-xs text-slate-500">
            {locale === "th"
              ? "จัดการข้อมูลที่ตั้งสาขา เบอร์ติดต่อ และรายชื่อพนักงานขายประจำสาขา"
              : "Manage branch locations, contact numbers, and store details"}
          </p>
        </div>
        <button
          onClick={handleAddBranch}
          disabled={adding}
          className="px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {adding ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-1" />
          )}
          <span>{locale === "th" ? "เพิ่มสาขาใหม่" : "Add Branch"}</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">{locale === "th" ? "กำลังโหลดข้อมูล..." : "Loading branches..."}</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex items-center space-x-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-500 rounded-2xl p-4 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">{locale === "th" ? "โหลดข้อมูลไม่สำเร็จ" : "Failed to load branches"}</p>
            <p className="text-xs mt-0.5 text-red-400">{error}</p>
          </div>
          <button
            onClick={fetchBranches}
            className="ml-auto text-xs font-bold underline cursor-pointer"
          >
            {locale === "th" ? "ลองใหม่" : "Retry"}
          </button>
        </div>
      )}

      {/* Branches grid list */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-sm">
              {locale === "th" ? "ยังไม่มีสาขา" : "No branches found"}
            </div>
          ) : (
            branches.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition"
              >
                {/* Header */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] px-1.5 py-0.5 rounded mr-1.5 font-bold uppercase">
                        {b.code}
                      </span>
                      <span>{b.name}</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center">
                      <Phone className="w-3 h-3 mr-1 text-slate-500" />
                      <span>{b.phone}</span>
                    </p>
                  </div>
                </div>

                {/* Address details */}
                <p className="text-[11px] text-slate-500 leading-normal flex items-start">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{b.address || "-"}</span>
                </p>

                {/* Analytics mini */}
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-[10px] text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-accent" />
                    <span>
                      {b.staffCount ?? b._count?.users ?? 0}{" "}
                      {locale === "th" ? "คนหน้าร้าน" : "agents"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <ShoppingBag className="w-4 h-4 text-indigo-500" />
                    <span>
                      {b.orderCount ?? b._count?.orders ?? 0}{" "}
                      {locale === "th" ? "ยอดขาย" : "sales"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
