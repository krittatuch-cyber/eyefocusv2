// app/(admin)/admin/users/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Users, Search, Shield, RefreshCw, Loader2,
  CheckCircle, XCircle, Building2, GitBranch, UserCheck, UserX
} from "lucide-react";
import { useSortPaginate } from "@/lib/hooks/useSortPaginate";
import SortHeader from "@/components/ui/SortHeader";
import Pagination from "@/components/ui/Pagination";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  tenantId: string;
  tenantName: string | null;
  tenantSlug: string | null;
  branchId: string | null;
  branchName: string | null;
}

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  SUPER_ADMIN: { label: "Super Admin", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
  OWNER:       { label: "Owner",       cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  MANAGER:     { label: "Manager",     cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  SELLER:      { label: "Seller",      cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function getAvatarColor(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: "from-red-600 to-red-800",
    OWNER:       "from-amber-500 to-amber-700",
    MANAGER:     "from-blue-600 to-blue-800",
    SELLER:      "from-emerald-600 to-emerald-800",
  };
  return map[role] ?? "from-slate-600 to-slate-800";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (q = search, role = roleFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (q) params.set("search", q);
      if (role) params.set("role", role);
      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      setToast({ msg: "โหลดข้อมูลไม่สำเร็จ", ok: false });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers("", ""); }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(val, roleFilter), 400);
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    fetchUsers(search, role);
  };

  const handleAction = async (userId: string, action: "activate" | "deactivate") => {
    setActioning(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (!res.ok) throw new Error();
      setToast({ msg: action === "activate" ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว", ok: true });
      await fetchUsers(search, roleFilter);
    } catch {
      setToast({ msg: "ดำเนินการไม่สำเร็จ", ok: false });
    } finally {
      setActioning(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    superAdmin: users.filter(u => u.role === "SUPER_ADMIN").length,
    owner: users.filter(u => u.role === "OWNER").length,
    manager: users.filter(u => u.role === "MANAGER").length,
    seller: users.filter(u => u.role === "SELLER").length,
  };

  const ROLES = [
    { key: "", label: "ทั้งหมด" },
    { key: "SUPER_ADMIN", label: "Super Admin" },
    { key: "OWNER", label: "Owner" },
    { key: "MANAGER", label: "Manager" },
    { key: "SELLER", label: "Seller" },
  ];

  // Sort + pagination — `users` is the full (already server-filtered) array
  const { rows, sort, onSort, page, setPage, pageSize, onPageSize, totalPages, totalRows, from, to } =
    useSortPaginate({
      data: users,
      defaultSort: { key: "name", dir: "asc" },
      storageKey: "admin_users",
      comparators: {
        // Boolean sort: active first when asc
        isActive: (a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1),
      },
    });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium ${
          toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-400" /> จัดการผู้ใช้งาน
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">ผู้ใช้งานทั้งหมดในระบบ (ทุก Tenant)</p>
        </div>
        <button onClick={() => fetchUsers(search, roleFilter)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-xl transition">
          <RefreshCw className="w-4 h-4" /> รีเฟรช
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "ทั้งหมด",    value: stats.total,      color: "from-slate-700 to-slate-800",       text: "text-white" },
          { label: "ใช้งานอยู่", value: stats.active,     color: "from-emerald-600/20 to-emerald-800/20", text: "text-emerald-400" },
          { label: "Super Admin",value: stats.superAdmin,  color: "from-red-600/20 to-red-800/20",     text: "text-red-400" },
          { label: "Owner",      value: stats.owner,       color: "from-amber-600/20 to-amber-800/20", text: "text-amber-400" },
          { label: "Manager",    value: stats.manager,     color: "from-blue-600/20 to-blue-800/20",   text: "text-blue-400" },
          { label: "Seller",     value: stats.seller,      color: "from-emerald-600/20 to-emerald-800/20", text: "text-emerald-400" },
        ].map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl border border-slate-800 p-4 text-center`}>
            <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหรืออีเมล..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLES.map(({ key, label }) => (
            <button key={key} onClick={() => handleRoleFilter(key)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                roleFilter === key ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
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
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-400">ไม่พบผู้ใช้งาน</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <SortHeader col="name"      label="ผู้ใช้"       sortKey={sort.key} dir={sort.dir} onSort={onSort} />
                  <SortHeader col="role"      label="Role"         sortKey={sort.key} dir={sort.dir} onSort={onSort} />
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Tenant</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">สาขา</th>
                  <SortHeader col="isActive"  label="สถานะ"       sortKey={sort.key} dir={sort.dir} onSort={onSort} />
                  <SortHeader col="createdAt" label="วันที่สมัคร" sortKey={sort.key} dir={sort.dir} onSort={onSort} />
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map(user => {
                  const roleCfg = ROLE_CONFIG[user.role] ?? { label: user.role, cls: "bg-slate-700 text-slate-300 border-slate-600" };
                  const isActioning = actioning === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition">
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(user.role)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleCfg.cls}`}>
                          {roleCfg.label}
                        </span>
                      </td>

                      {/* Tenant */}
                      <td className="px-5 py-4">
                        {user.tenantName ? (
                          <div>
                            <p className="text-sm text-white">{user.tenantName}</p>
                            <p className="text-xs text-slate-500">{user.tenantSlug}.eyefocus.app</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-300">{user.branchName ?? "—"}</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full ${
                          user.isActive
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-slate-700 text-slate-400"
                        }`}>
                          {user.isActive
                            ? <><UserCheck className="w-3 h-3" /> ใช้งาน</>
                            : <><UserX className="w-3 h-3" /> ปิด</>
                          }
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("th-TH")}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        {user.role !== "SUPER_ADMIN" && (
                          <button
                            onClick={() => handleAction(user.id, user.isActive ? "deactivate" : "activate")}
                            disabled={isActioning}
                            className={`text-xs px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 ${
                              user.isActive
                                ? "bg-red-600/20 hover:bg-red-600/40 text-red-400"
                                : "bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400"
                            }`}
                          >
                            {isActioning
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : user.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"
                            }
                          </button>
                        )}
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
