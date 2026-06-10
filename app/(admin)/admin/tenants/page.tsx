// app/(admin)/admin/tenants/page.tsx — All Tenants List + Management
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Search, CheckCircle, AlertTriangle, Clock, Loader2,
  ChevronRight, Shield, Users, GitBranch, Filter, X, RefreshCw
} from "lucide-react";
import { useSortPaginate } from "@/lib/hooks/useSortPaginate";
import SortHeader from "@/components/ui/SortHeader";
import Pagination from "@/components/ui/Pagination";

interface Tenant {
  id: string; name: string; slug: string; planType: string;
  isActive: boolean; isSuspended: boolean; isInTrial: boolean;
  trialDaysRemaining: number | null; currentBranches: number;
  currentUsers: number; mrr: number; createdAt: string;
  dunningCount: number;
}

type FilterType = "all" | "trial" | "suspended" | "active" | "pro" | "enterprise";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:    { label: "ใช้งาน", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  trial:     { label: "ทดลองใช้", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  suspended: { label: "ระงับ", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
  dunning:   { label: "ค้างชำระ", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
};

const PLAN_COLORS: Record<string, string> = {
  starter: "text-slate-400", pro: "text-blue-400", enterprise: "text-amber-400",
};

function getStatus(t: Tenant): string {
  if (t.isSuspended) return "suspended";
  if (t.dunningCount > 0) return "dunning";
  if (t.isInTrial) return "trial";
  return "active";
}

export default function AdminTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tenants", { credentials: "include" });
      const data = await res.json();
      setTenants(data.tenants ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleAction = async (tenantId: string, action: string, planId?: string) => {
    setActioning(tenantId);
    try {
      await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, planId }),
      });
      await fetchTenants();
    } finally { setActioning(null); }
  };

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.slug.includes(q);
    const status = getStatus(t);
    const matchFilter =
      filter === "all" ? true :
      filter === "trial" ? t.isInTrial :
      filter === "suspended" ? t.isSuspended :
      filter === "active" ? (status === "active") :
      filter === t.planType;
    return matchSearch && matchFilter;
  });

  const { rows, sort, onSort, page, setPage, pageSize, onPageSize, totalPages, totalRows, from, to } =
    useSortPaginate<Tenant>({
      data: filtered,
      defaultSort: { key: "name", dir: "asc" },
      storageKey: "admin_tenants",
      comparators: {
        isActive: (a, b) => Number(a.isActive) - Number(b.isActive),
      },
    });

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "trial", label: "ทดลองใช้" },
    { key: "suspended", label: "ระงับ" },
    { key: "pro", label: "Pro" },
    { key: "enterprise", label: "Enterprise" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">จัดการ Tenants</h1>
          <p className="text-slate-400 text-sm mt-0.5">{tenants.length} ร้านทั้งหมด</p>
        </div>
        <button onClick={fetchTenants} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-xl transition">
          <RefreshCw className="w-4 h-4" /> รีเฟรช
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="ค้นหาชื่อร้านหรือ slug..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                filter === key ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">ไม่พบข้อมูล</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <SortHeader col="name" label="ร้าน" sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                  <SortHeader col="planType" label="Plan" sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                  <SortHeader col="isActive" label="สถานะ" sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">สาขา / User</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">MRR</th>
                  <SortHeader col="createdAt" label="สมัคร" sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map(t => {
                  const status = getStatus(t);
                  const badge = STATUS_BADGE[status];
                  const isActioning = actioning === t.id;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{t.name}</p>
                            <p className="text-xs text-slate-500">{t.slug}.eyefocus.app</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold capitalize ${PLAN_COLORS[t.planType] ?? "text-slate-400"}`}>
                          {t.planType}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                          {badge.label}
                          {t.isInTrial && t.trialDaysRemaining !== null && ` (${t.trialDaysRemaining}d)`}
                          {t.dunningCount > 0 && ` ×${t.dunningCount}`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{t.currentBranches}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.currentUsers}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-semibold ${t.mrr > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                          {t.mrr > 0 ? `฿${t.mrr.toLocaleString()}` : "-"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(t.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => router.push(`/admin/tenants/${t.id}`)}
                            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition">
                            ดู <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          {t.isSuspended ? (
                            <button onClick={() => handleAction(t.id, "activate")} disabled={isActioning}
                              className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50">
                              {isActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : "เปิด"}
                            </button>
                          ) : (
                            <button onClick={() => handleAction(t.id, "suspend")} disabled={isActioning}
                              className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50">
                              {isActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : "ระงับ"}
                            </button>
                          )}
                        </div>
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
              locale="th"
            />
          </div>
        )}
      </div>
    </div>
  );
}
