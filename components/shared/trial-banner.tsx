"use client";
// components/shared/trial-banner.tsx — Trial period countdown banner
import React, { useEffect, useState } from "react";
import { Clock, Zap, X, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface TenantInfo {
  planType: string;
  isInTrial: boolean;
  trialDaysRemaining: number | null;
  isSuspended: boolean;
}

export default function TrialBanner() {
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show once per session
    const key = "trial_banner_dismissed";
    if (sessionStorage.getItem(key) === "true") { setDismissed(true); return; }

    fetch("/api/tenant", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setTenant(data); })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("trial_banner_dismissed", "true");
  };

  if (dismissed || !tenant) return null;

  // Suspended account
  if (tenant.isSuspended) {
    return (
      <div className="bg-red-900/50 border-b border-red-700/50 px-4 py-2.5 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
        <p className="text-sm text-red-200 flex-1">
          บัญชีของคุณถูกระงับชั่วคราว — กรุณาติดต่อ{" "}
          <a href="mailto:support@eyefocus.app" className="underline font-semibold">support@eyefocus.app</a>
        </p>
      </div>
    );
  }

  // Trial ending
  if (tenant.isInTrial && tenant.trialDaysRemaining !== null) {
    const days = tenant.trialDaysRemaining;
    const urgent = days <= 7;

    return (
      <div className={`border-b px-4 py-2.5 flex items-center gap-3 ${
        urgent
          ? "bg-orange-900/40 border-orange-700/50"
          : "bg-blue-900/30 border-blue-700/40"
      }`}>
        <Clock className={`w-4 h-4 shrink-0 ${urgent ? "text-orange-400" : "text-blue-400"}`} />
        <p className="text-sm text-slate-200 flex-1">
          {days === 0
            ? <span className="text-orange-300 font-semibold">ทดลองใช้หมดอายุแล้ว กรุณาเลือกแผน</span>
            : <>
                <span className={`font-semibold ${urgent ? "text-orange-300" : "text-white"}`}>
                  เหลือ {days} วัน
                </span>
                {" "}ในช่วงทดลองใช้ฟรี
              </>
          }
        </p>
        <button
          onClick={() => router.push("/seller/subscription")}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0 ${
            urgent
              ? "bg-orange-500 hover:bg-orange-400 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          <Zap className="w-3 h-3" />
          {days === 0 ? "เลือกแผนเลย" : "อัปเกรด"}
        </button>
        <button onClick={handleDismiss} className="text-slate-500 hover:text-slate-300 transition shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
}
