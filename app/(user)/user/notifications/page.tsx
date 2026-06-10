// app/(user)/user/notifications/page.tsx
"use client";

import React from "react";
import { useI18n } from "@/lib/i18n-context";
import { ArrowLeft, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MockPage() {
  const router = useRouter();
  const { locale } = useI18n();
  return (
    <div className="space-y-4">
      <button 
        onClick={() => router.back()} 
        className="flex items-center space-x-1 text-xs font-bold text-slate-500"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-3xl p-6 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto">
          <Bell className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold font-heading text-slate-900 dark:text-white">
          ศูนย์แจ้งเตือนพนักงาน / Employee alert center
        </h2>
        <p className="text-xs text-slate-400">
          {locale === "th" 
            ? "หน้าเมนูย่อยระบบกำลังทดสอบทำรายการเพื่อเชื่อมฐานข้อมูลออฟไลน์และ LINE OA"
            : "Under evaluation. Core database hooks are set for testing."
          }
        </p>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-[9px] text-slate-400 font-bold border border-slate-200/20">
          Route: /user/notifications
        </div>
      </div>
    </div>
  );
}
