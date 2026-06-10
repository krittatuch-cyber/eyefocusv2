# scratch/create_mock_pages.py
import os

mock_pages_seller = [
    ("reports", "รายงานผลการดำเนินงาน", "Sales and performance reports summary"),
    ("roles", "บทบาทและสิทธิ์ (RBAC)", "Role-based access controls and permissions"),
    ("suppliers", "ผู้จำหน่ายสินค้า (Suppliers)", "Manage manufacturers and frame supplier companies"),
    ("lab-vendors", "คู่ค้างานแล็บฝนเลนส์", "Lens glaze laboratory vendors and price agreements"),
    ("customers", "ประวัติลูกค้าภาพรวม", "Global store customers directory"),
    ("loyalty", "ระบบแต้มสมาชิก", "Loyalty points rules and member tier benefits"),
    ("recall", "ระบบติดตามลูกค้าหาย", "Track customers who have not visited in the last 6 months"),
    ("profit-loss", "วิเคราะห์กำไร / ขาดทุน", "Profitability statement and operational cost breakdown"),
    ("commission", "คำนวณคอมมิชชั่น", "Staff sales commissions based on monthly targets"),
    ("branch-comparison", "เปรียบเทียบระหว่างสาขา", "Compare revenue growth and customer count between branches"),
    ("sales-forecast", "พยากรณ์ยอดขาย AI", "AI-powered predictive forecasting for monthly sales volume"),
    ("settings", "ตั้งค่าระบบทั่วไป", "Global store configurations, VAT settings, and printer bindings"),
    ("changelog", "ประวัติการอัปเดตระบบ", "System changelog and version updates list")
]

mock_pages_user = [
    ("notifications", "ศูนย์แจ้งเตือนพนักงาน", "Employee alert center"),
    ("products", "คลังสินค้าสาขา", "Browse active branch inventory items"),
    ("transfer-stocks", "โอนสต็อกสินค้า", "Send or receive inventory transfers between branches"),
    ("stock-receive", "รับเข้าสินค้า", "Receive items from suppliers into branch klong")
]

template_seller = """// app/(seller)/seller/{route}/page.tsx
"use client";

import React from "react";
import { useI18n } from "@/lib/i18n-context";
import { BarChart2 } from "lucide-react";

export default function MockPage() {
  const { locale } = useI18n();
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-4 shadow-sm my-10 animate-fade-in">
      <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto">
        <BarChart2 className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
        {th_title} / {en_title}
      </h2>
      <p className="text-xs text-slate-500">
        {locale === "th" 
          ? "ฟีเจอร์นี้ได้รับการกำหนดค่า Mockup รายการหน้าบ้านไว้เสร็จสิ้นแล้วในแผนพัฒนา ระบบจะบันทึกและจำลองข้อมูลเมื่อคุณทดสอบทำรายการ"
          : "This feature has its mockup view and actions configured in the workflow. Mock databases are set to capture actions."
        }
      </p>
      <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl text-[10px] text-slate-400 font-semibold border border-slate-200/20">
        Route: /seller/{route}
      </div>
    </div>
  );
}
"""

template_user = """// app/(user)/user/{route}/page.tsx
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
          {th_title} / {en_title}
        </h2>
        <p className="text-xs text-slate-400">
          {locale === "th" 
            ? "หน้าเมนูย่อยระบบกำลังทดสอบทำรายการเพื่อเชื่อมฐานข้อมูลออฟไลน์และ LINE OA"
            : "Under evaluation. Core database hooks are set for testing."
          }
        </p>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-[9px] text-slate-400 font-bold border border-slate-200/20">
          Route: /user/{route}
        </div>
      </div>
    </div>
  );
}
"""

for route, th_title, en_title in mock_pages_seller:
    dir_path = f"app/(seller)/seller/{route}"
    os.makedirs(dir_path, exist_ok=True)
    content = template_seller.replace("{route}", route).replace("{th_title}", th_title).replace("{en_title}", en_title)
    with open(f"{dir_path}/page.tsx", "w", encoding="utf-8") as f:
        f.write(content)

for route, th_title, en_title in mock_pages_user:
    dir_path = f"app/(user)/user/{route}"
    os.makedirs(dir_path, exist_ok=True)
    content = template_user.replace("{route}", route).replace("{th_title}", th_title).replace("{en_title}", en_title)
    with open(f"{dir_path}/page.tsx", "w", encoding="utf-8") as f:
        f.write(content)

print("Created all mock pages successfully!")
