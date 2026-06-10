// app/(user)/user/branch-select/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { db } from "@/lib/db-mock";
import { Building2, ChevronRight, Check } from "lucide-react";

export default function BranchSelectPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("currentUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSelectBranch = (branchId: string) => {
    if (!user) return;
    const updatedUser = { ...user, branchId };
    sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
    router.push("/user/dashboard");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center py-4 space-y-1">
        <Building2 className="w-10 h-10 text-accent mx-auto" />
        <h2 className="text-lg font-bold font-heading text-slate-800 dark:text-white">
          {locale === "th" ? "เลือกสาขาปฎิบัติงาน" : "Select Active Branch"}
        </h2>
        <p className="text-xs text-slate-400">
          {locale === "th" ? "โปรดเลือกสาขาเพื่อเข้าสู่ระบบ POS และคลังสินค้าสาขา" : "Please select your active branch to view stock and sales"}
        </p>
      </div>

      <div className="space-y-2.5">
        {db.branches.map((b) => {
          const isActive = user.branchId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => handleSelectBranch(b.id)}
              className={`w-full flex items-center justify-between p-4 border rounded-2xl text-left transition duration-150 cursor-pointer ${
                isActive
                  ? "bg-accent/5 border-accent text-accent font-semibold"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 py-0.5 px-2 rounded-lg">
                    {b.code}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{b.name}</span>
                </div>
                <p className="text-[10px] text-slate-400">{b.address}</p>
                <p className="text-[10px] text-slate-400">{b.phone}</p>
              </div>

              {isActive ? (
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white">
                  <Check className="w-3.5 h-3.5" />
                </div>
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
