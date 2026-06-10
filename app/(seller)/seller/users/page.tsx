// app/(seller)/seller/users/page.tsx — Staff Management (i18n + theme-aware)
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users, Plus, Shield, Mail, Building2, Check, X, Loader2,
  AlertCircle, Eye, EyeOff, Search, UserCheck, UserX,
  ChevronDown, Edit2, ChevronRight, Phone, Calendar, Key,
} from "lucide-react";
import { ROLE_INFO, TENANT_ROLES } from "@/lib/permissions";
import { useI18n } from "@/lib/i18n-context";
import ImageUpload from "@/components/ui/ImageUpload";
import { useSortPaginate } from "@/lib/hooks/useSortPaginate";
import SortHeader from "@/components/ui/SortHeader";
import Pagination from "@/components/ui/Pagination";

interface Branch { id: string; name: string; code: string; }
interface StaffUser {
  id: string; name: string; email: string;
  role: string; roles: string[];
  phone?: string | null;
  jobTitle?: string | null;
  photoUrl?: string | null;
  branchId: string | null; branchName: string | null;
  isActive: boolean; createdAt: string;
}
type ModalMode = "add" | "edit";

const EMPTY_FORM = { name: "", email: "", password: "", roles: ["SALES"] as string[], branchId: "", phone: "", jobTitle: "", photoUrl: "" };

const AVATAR_COLORS: Record<string, string> = {
  OWNER:    "from-amber-500 to-orange-600",
  MANAGER:  "from-blue-500 to-blue-700",
  OD:       "from-violet-500 to-purple-700",
  OPTICIAN: "from-cyan-500 to-teal-700",
  SALES:    "from-emerald-500 to-green-700",
  CASHIER:  "from-green-500 to-emerald-700",
  SELLER:   "from-slate-500 to-slate-700",
};

export default function UsersPage() {
  const { t } = useI18n();
  const [users, setUsers]           = useState<StaffUser[]>([]);
  const [branches, setBranches]     = useState<Branch[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalMode, setModalMode]   = useState<ModalMode>("add");
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [showPwd, setShowPwd]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [uRes, bRes] = await Promise.all([
        fetch("/api/users", { credentials: "include" }),
        fetch("/api/branches", { credentials: "include" }),
      ]);
      if (!uRes.ok) throw new Error(`HTTP ${uRes.status}`);
      const uData = await uRes.json();
      const bData = bRes.ok ? await bRes.json() : { data: [] };
      const raw: StaffUser[] = Array.isArray(uData) ? uData : [];
      setUsers(raw.map(u => ({ ...u, roles: (u.roles?.length > 0) ? u.roles : [u.role || "SALES"] })));
      setBranches(Array.isArray(bData.data) ? bData.data : Array.isArray(bData) ? bData : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => { setModalMode("add"); setForm(EMPTY_FORM); setFormError(null); setShowPwd(false); setEditTarget(null); setShowModal(true); };
  const openEdit = (u: StaffUser) => {
    setModalMode("edit"); setEditTarget(u);
    setForm({ name: u.name, email: u.email, password: "", roles: u.roles, branchId: u.branchId || "", phone: u.phone || "", jobTitle: u.jobTitle || "", photoUrl: u.photoUrl || "" });
    setFormError(null); setShowPwd(false); setShowModal(true);
  };
  const toggleRole = (role: string) => setForm(p => { const has = p.roles.includes(role); const next = has ? p.roles.filter(r => r !== role) : [...p.roles, role]; return { ...p, roles: next.length > 0 ? next : [role] }; });

  const handleToggle = async (userId: string, current: boolean) => {
    setTogglingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !current }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !current } : u));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : t("error")); }
    finally { setTogglingId(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null); setSaving(true);
    if (form.roles.length === 0) { setFormError(t("roleLabel") + " required"); setSaving(false); return; }
    try {
      if (modalMode === "add") {
        const res = await fetch("/api/users", {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.roles[0], roles: form.roles, branchId: form.branchId || undefined, phone: form.phone || undefined, jobTitle: form.jobTitle || undefined, photoUrl: form.photoUrl || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      } else {
        const body: Record<string, unknown> = { name: form.name, roles: form.roles, role: form.roles[0], branchId: form.branchId || null, phone: form.phone || null, jobTitle: form.jobTitle || null, photoUrl: form.photoUrl || null };
        if (form.password.length >= 8) body.password = form.password;
        const res = await fetch(`/api/users/${editTarget!.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      }
      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); setShowModal(false); fetchAll(); }, 800);
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : t("error")); }
    finally { setSaving(false); }
  };

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const { rows, sort, onSort, page, setPage, pageSize, onPageSize, totalPages, totalRows, from, to } = useSortPaginate<StaffUser>({
    data: filtered,
    defaultSort: { key: "name", dir: "asc" },
    storageKey: "seller_users",
    comparators: {
      isActive: (a, b) => Number(a.isActive) - Number(b.isActive),
    },
  });

  const stats = {
    total:    users.length,
    active:   users.filter(u => u.isActive).length,
    clinical: users.filter(u => u.roles.some(r => ["OD","OPTICIAN"].includes(r))).length,
    floor:    users.filter(u => u.roles.some(r => ["SALES","CASHIER"].includes(r))).length,
  };

  // Shared class helpers for theme-awareness
  const card   = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800";
  const inputCls = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition";
  const rowHover = "hover:bg-slate-50 dark:hover:bg-slate-800/40";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("menu_users")}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t("staffMultiRoleNote")}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition">
          <Plus className="w-4 h-4" /> {t("addStaff")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("staffTotal"),    value: stats.total,    icon: Users,     color: "text-slate-500 dark:text-slate-300" },
          { label: t("staffActive"),   value: stats.active,   icon: UserCheck, color: "text-green-600 dark:text-green-400" },
          { label: t("staffClinical"), value: stats.clinical, icon: Shield,    color: "text-violet-600 dark:text-violet-400", sub: "OD / Optician" },
          { label: t("staffFloor"),    value: stats.floor,    icon: Shield,    color: "text-emerald-600 dark:text-emerald-400", sub: "Sales / Cashier" },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className={`${card} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder={t("search")} value={search} onChange={e => setSearch(e.target.value)}
          className={`${inputCls} pl-10`} />
      </div>

      {/* Staff List — Card (mobile) + Table (md+) */}
      <div className={`${card} rounded-2xl overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={fetchAll} className="text-xs text-blue-500 hover:underline">{t("back")}</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">{search ? t("noStaffSearch") : t("noStaffFound")}</p>
          </div>
        ) : (
          <>
            {/* ── Mobile Cards (< md) ──────────────────────────────── */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(u => {
                const primaryRole = u.roles[0] || "SALES";
                return (
                  <div key={u.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="shrink-0">
                        {u.photoUrl ? (
                          <img src={u.photoUrl} alt={u.name} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[primaryRole] || "from-slate-500 to-slate-700"} flex items-center justify-center text-white font-bold text-sm`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{u.name}</p>
                        {u.jobTitle && <p className="text-xs text-slate-500 dark:text-slate-400">{u.jobTitle}</p>}
                        {u.phone && <p className="text-xs text-slate-400">{u.phone}</p>}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {u.roles.map(r => { const info = ROLE_INFO[r]; return info ? (
                            <span key={r} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.bgColor} ${info.color} ${info.border}`}>{info.labelEn}</span>
                          ) : null; })}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />{u.branchName ?? t("allBranches")}
                          </span>
                          <span className={`text-[11px] font-semibold flex items-center gap-1 ${u.isActive ? "text-green-600" : "text-slate-400"}`}>
                            {u.isActive ? <><Check className="w-3 h-3" />{t("activeLabel")}</> : <><X className="w-3 h-3" />{t("suspendedLabel")}</>}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEdit(u)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[44px]">
                        <Edit2 className="w-3.5 h-3.5" />{t("edit")}
                      </button>
                      {!u.roles.includes("OWNER") && (
                        <button onClick={() => handleToggle(u.id, u.isActive)} disabled={togglingId === u.id}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition ${
                            u.isActive ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                          }`}>
                          {togglingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : u.isActive ? <><UserX className="w-3.5 h-3.5" />{t("suspendAccount")}</> : <><UserCheck className="w-3.5 h-3.5" />{t("activateAccount")}</>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop Table (≥ md) ─────────────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="w-6 px-4 py-3" />
                    <SortHeader col="name" label={t("staff")} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{t("roleLabel")}</th>
                    <SortHeader col="branchName" label={t("branch")} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                    <SortHeader col="isActive" label={t("status")} sortKey={sort.key} dir={sort.dir} onSort={onSort} align="left" />
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(u => {
                    const isExpanded = expandedId === u.id;
                    const primaryRole = u.roles[0] || "SALES";
                    return (
                      <React.Fragment key={u.id}>
                        <tr onClick={() => setExpandedId(isExpanded ? null : u.id)}
                          className={`border-b border-slate-100 dark:border-slate-800/60 ${rowHover} transition cursor-pointer`}>
                          <td className="px-4 py-4">
                            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {u.photoUrl ? (
                                <img src={u.photoUrl} alt={u.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                              ) : (
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${AVATAR_COLORS[primaryRole] || "from-slate-500 to-slate-700"} shrink-0`}>
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                                {u.jobTitle && <p className="text-xs text-slate-500 dark:text-slate-400">{u.jobTitle}</p>}
                                {u.phone && <p className="text-xs text-slate-400 dark:text-slate-500">{u.phone}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.map(r => { const info = ROLE_INFO[r]; return info ? (
                                <span key={r} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.bgColor} ${info.color} ${info.border}`}>{info.labelEn}</span>
                              ) : null; })}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" />{u.branchName ?? t("allBranches")}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`flex items-center gap-1.5 text-xs font-semibold ${u.isActive ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
                              {u.isActive ? <><Check className="w-3.5 h-3.5" />{t("activeLabel")}</> : <><X className="w-3.5 h-3.5" />{t("suspendedLabel")}</>}
                            </span>
                          </td>
                          <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2 justify-end">
                              <button onClick={() => openEdit(u)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
                                <Edit2 className="w-3.5 h-3.5" />{t("edit")}
                              </button>
                              {!u.roles.includes("OWNER") && (
                                <button onClick={() => handleToggle(u.id, u.isActive)} disabled={togglingId === u.id}
                                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                                    u.isActive ? "bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-600 dark:text-slate-300 hover:text-red-600" : "bg-slate-100 dark:bg-slate-700 hover:bg-green-100 text-slate-600 hover:text-green-600"
                                  }`}>
                                  {togglingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : u.isActive ? <><UserX className="w-3.5 h-3.5" />{t("suspendAccount")}</> : <><UserCheck className="w-3.5 h-3.5" />{t("activateAccount")}</>}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/20">
                            <td colSpan={6} className="px-6 py-5">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div className="space-y-3">
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("staffDetail")}</p>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div><span className="text-xs text-slate-500">โทรศัพท์</span><p className="font-medium text-sm text-slate-900 dark:text-white">{u.phone || "—"}</p></div>
                                    <div><span className="text-xs text-slate-500">ตำแหน่ง</span><p className="font-medium text-sm text-slate-900 dark:text-white">{u.jobTitle || "—"}</p></div>
                                    <div><span className="text-xs text-slate-500">อีเมล</span><p className="font-medium text-sm text-slate-900 dark:text-white">{u.email}</p></div>
                                    <div><span className="text-xs text-slate-500">สาขา</span><p className="font-medium text-sm text-slate-900 dark:text-white">{u.branchName || "—"}</p></div>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Calendar className="w-3.5 h-3.5 shrink-0" />{t("staffAdded")} {new Date(u.createdAt).toLocaleDateString("th-TH", { year:"numeric", month:"long", day:"numeric" })}
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("staffRoleDetail")}</p>
                                  <div className="space-y-2">
                                    {u.roles.map(r => { const info = ROLE_INFO[r]; return info ? (
                                      <div key={r} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${info.bgColor} ${info.border}`}>
                                        <Shield className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${info.color}`} />
                                        <div><p className={`text-xs font-bold ${info.color}`}>{info.labelEn} — {info.label}</p><p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{info.description}</p></div>
                                      </div>
                                    ) : null; })}
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("staffManage")}</p>
                                  <div className="space-y-2">
                                    <button onClick={e => { e.stopPropagation(); openEdit(u); }} className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold transition">
                                      <Edit2 className="w-3.5 h-3.5" />{t("editStaffInfo")}
                                    </button>
                                    {!u.roles.includes("OWNER") && (
                                      <button onClick={e => { e.stopPropagation(); handleToggle(u.id, u.isActive); }} disabled={togglingId === u.id}
                                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition border ${
                                          u.isActive ? "bg-red-50 dark:bg-red-500/10 hover:bg-red-100 border-red-200 dark:border-red-500/30 text-red-600" : "bg-green-50 hover:bg-green-100 border-green-200 text-green-600"
                                        }`}>
                                        {u.isActive ? <><UserX className="w-3.5 h-3.5" />{t("suspendAccount")}</> : <><UserCheck className="w-3.5 h-3.5" />{t("activateAccount")}</>}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              <Pagination page={page} totalPages={totalPages} totalRows={totalRows} from={from} to={to} pageSize={pageSize} onPage={setPage} onPageSize={onPageSize} locale="th" />
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {modalMode === "add" ? t("addStaff") : `${t("edit")} — ${editTarget?.name}`}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>

            {saveSuccess && (
              <div className="mb-4 flex items-center gap-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-600 dark:text-green-400">
                <Check className="w-4 h-4 shrink-0" /> {t("saveSuccess")}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">{t("staffName")} *</label>
                <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={t("staffName")} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">{t("email")} {modalMode === "add" ? "*" : ""}</label>
                <input type="email" required={modalMode === "add"} value={form.email} readOnly={modalMode === "edit"}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={`${inputCls} ${modalMode === "edit" ? "opacity-50 cursor-not-allowed" : ""}`} />
                {modalMode === "edit" && <p className="text-[10px] text-slate-400 mt-1">{t("emailReadOnly")}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  {t("password")} {modalMode === "add" ? "*" : <span className="font-normal normal-case text-slate-400">{t("passwordOptional")}</span>}
                </label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} required={modalMode === "add"} minLength={modalMode === "add" ? 8 : 0}
                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder={modalMode === "add" ? t("passwordHint") : t("changePassword")} className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">เบอร์โทรศัพท์</label>
                <input type="tel" placeholder="0812345678" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className={inputCls} />
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">ตำแหน่งงาน</label>
                <input type="text" placeholder="เช่น ผู้จัดการสาขา, นักทัศนมาตร" value={form.jobTitle}
                  onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
                  className={inputCls} />
              </div>

              {/* Photo Upload */}
              <ImageUpload
                label="รูปโปรไฟล์พนักงาน"
                value={form.photoUrl || null}
                onChange={v => setForm(p => ({ ...p, photoUrl: v ?? "" }))}
                maxSizePx={400}
                hint="JPG, PNG, WEBP · สูงสุด 10MB · ปรับขนาดอัตโนมัติ"
              />

              {/* Multi-Role Checkboxes */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  {t("roleLabel")} * <span className="font-normal normal-case text-slate-400">({t("roleMultiHint")})</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TENANT_ROLES.filter(r => r !== "OWNER").map(role => {
                    const info = ROLE_INFO[role];
                    const checked = form.roles.includes(role);
                    return (
                      <label key={role} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition select-none ${checked ? `${info.bgColor} ${info.border}` : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/40"}`}>
                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleRole(role)} />
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition ${checked ? info.border : "border-slate-300 dark:border-slate-600"}`}>
                          {checked && <Check className={`w-2.5 h-2.5 ${info.color}`} />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold leading-none ${info.color}`}>{info.labelEn}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{info.label}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {form.roles.length > 1 && (
                  <p className="text-[10px] text-blue-500 mt-2 flex items-center gap-1.5"><Shield className="w-3 h-3" />{t("rolesMergeNote")}</p>
                )}
              </div>
              {/* Branch */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">{t("branch")}</label>
                <div className="relative">
                  <select value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))} className={`${inputCls} appearance-none pr-8`}>
                    <option value="">{t("allBranches")}</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              {formError && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />{formError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white py-2.5 rounded-xl text-sm font-semibold transition">
                  {t("cancel")}
                </button>
                <button type="submit" disabled={saving || form.roles.length === 0}
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />{t("loading")}</>
                    : modalMode === "add" ? <><Plus className="w-4 h-4" />{t("addStaff")}</>
                    : <><Check className="w-4 h-4" />{t("saveChanges")}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
