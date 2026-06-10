// app/(admin)/admin/audit-logs/page.tsx — Super Admin Audit Log Viewer
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Shield, Search, Filter, Loader2, RefreshCw,
  LogIn, ShoppingCart, Package, Users, AlertTriangle,
  CreditCard, Trash2, Download, ChevronDown
} from "lucide-react";

interface AuditEntry {
  id: string;
  tenantId: string;
  tenantName: string | null;
  tenantSlug: string | null;
  userId: string | null;
  userName: string;
  action: string;
  target: string | null;
  detail: string | null;
  createdAt: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  SYSTEM_LOGIN: LogIn,
  ORDER_CREATED: ShoppingCart,
  ORDER_CANCELLED: ShoppingCart,
  STOCK_ADJUSTED: Package,
  USER_CREATED: Users,
  BILLING_SUBSCRIBE: CreditCard,
  BILLING_FAILED: AlertTriangle,
  GDPR_ERASE_REQUEST: Trash2,
  GDPR_EXPORT: Download,
};

const ACTION_COLORS: Record<string, string> = {
  SYSTEM_LOGIN: "text-blue-400 bg-blue-500/10",
  ORDER_CREATED: "text-emerald-400 bg-emerald-500/10",
  ORDER_CANCELLED: "text-red-400 bg-red-500/10",
  BILLING_FAILED: "text-red-400 bg-red-500/10",
  BILLING_SUBSCRIBE: "text-emerald-400 bg-emerald-500/10",
  GDPR_ERASE_REQUEST: "text-amber-400 bg-amber-500/10",
  TENANT_SUSPENDED: "text-red-400 bg-red-500/10",
};

const DAYS_OPTIONS = [1, 7, 14, 30];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?days=${days}&limit=200`, { credentials: "include" });
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch {} finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.userName.toLowerCase().includes(q) ||
      (l.tenantName ?? "").toLowerCase().includes(q) ||
      (l.target ?? "").toLowerCase().includes(q) ||
      (l.detail ?? "").toLowerCase().includes(q);
    const matchAction = !filterAction || l.action === filterAction;
    return matchSearch && matchAction;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))].sort();

  const inputCls = "bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} รายการ ใน {days} วันที่ผ่านมา</p>
        </div>
        <div className="flex items-center gap-2">
          {DAYS_OPTIONS.map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                days === d ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}>
              {d}d
            </button>
          ))}
          <button onClick={fetchLogs} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="ค้นหา user, tenant, action..." value={search}
            onChange={e => setSearch(e.target.value)}
            className={`${inputCls} w-full pl-10`} />
        </div>
        <div className="relative">
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className={`${inputCls} appearance-none pr-8`}>
            <option value="">ทุก Action</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">ไม่พบข้อมูล</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filtered.map(log => {
              const Icon = ACTION_ICONS[log.action] ?? Shield;
              const colorCls = ACTION_COLORS[log.action] ?? "text-slate-400 bg-slate-500/10";
              const dt = new Date(log.createdAt);
              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-800/30 transition">
                  <div className={`w-8 h-8 rounded-lg ${colorCls} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="text-sm font-semibold text-white">{log.action.replace(/_/g, " ")}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400 font-medium">{log.userName}</span>
                      {log.tenantSlug && (
                        <><span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-violet-400">{log.tenantSlug}</span></>
                      )}
                    </div>
                    {log.target && (
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">{log.target}</p>
                    )}
                    {log.detail && (
                      <p className="text-xs text-slate-400 mt-0.5">{log.detail}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">{dt.toLocaleDateString("th-TH")}</p>
                    <p className="text-xs text-slate-600 font-mono">{dt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
