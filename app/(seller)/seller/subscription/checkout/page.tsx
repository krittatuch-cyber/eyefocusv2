// app/(seller)/seller/subscription/checkout/page.tsx — Payment checkout
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard, QrCode, Loader2, CheckCircle, AlertCircle,
  ArrowLeft, Shield, Lock, Zap, RefreshCw
} from "lucide-react";
import { PLANS, type PlanType } from "@/lib/plans";

type PayMethod = "promptpay" | "card";
type CheckoutState = "idle" | "loading" | "qr_waiting" | "success" | "error";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = (searchParams.get("plan") ?? "pro") as PlanType;
  const plan = PLANS[planId] ?? PLANS.pro;

  const [method, setMethod] = useState<PayMethod>("promptpay");
  const [state, setState] = useState<CheckoutState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [chargeId, setChargeId] = useState("");
  const [cardToken, setCardToken] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Card form fields ───────────────────────────────────────────────────────
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });

  // ── Load Omise.js for card tokenization ───────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const script = document.createElement("script");
    script.src = "https://cdn.omise.co/omise.js";
    script.onload = () => {
      if (process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY) {
        (window as unknown as Record<string, unknown>).Omise = { publicKey: process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY };
      }
    };
    document.head.appendChild(script);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── PromptPay QR polling ──────────────────────────────────────────────────
  const startPolling = (cId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/billing/charge-status?chargeId=${cId}&planId=${planId}`, { credentials: "include" });
        const data = await res.json();
        if (data.paid || data.status === "successful") {
          clearInterval(pollRef.current!);
          setState("success");
        } else if (data.status === "failed" || data.status === "expired") {
          clearInterval(pollRef.current!);
          setState("error");
          setErrorMsg("การชำระเงินหมดอายุ กรุณาลองใหม่");
        }
      } catch { /* keep polling */ }
    }, 3000);
  };

  // ── Tokenize card with Omise.js ───────────────────────────────────────────
  const tokenizeCard = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const OmiseJS = (window as unknown as Record<string, unknown>).OmiseCard as {
        configure: (opts: Record<string, unknown>) => void;
        open: (opts: Record<string, unknown>) => void;
      } | undefined;

      // Fallback: use direct token API (test only)
      // In production, Omise.js handles this securely
      reject(new Error("กรุณาใช้ Omise.js token (ดูเอกสาร Omise)"));
    });
  };

  const handleSubmit = async () => {
    setState("loading");
    setErrorMsg("");

    try {
      const body: Record<string, unknown> = { planId, paymentMethod: method };

      if (method === "card") {
        // In production: use Omise.js to get secure token
        // body.cardToken = await tokenizeCard();
        setErrorMsg("กรุณาใช้ Omise.js token — ดูเอกสาร Omise สำหรับ integration จริง");
        setState("error");
        return;
      }

      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");

      if (method === "promptpay") {
        setQrUrl(data.qrUrl);
        setChargeId(data.chargeId);
        setState("qr_waiting");
        startPolling(data.chargeId);
      } else if (data.status === "successful") {
        setState("success");
      } else {
        throw new Error(data.error || "การชำระเงินไม่สำเร็จ");
      }
    } catch (e: unknown) {
      setState("error");
      setErrorMsg(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
  };

  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  // ── Success state ──────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ชำระเงินสำเร็จ! 🎉</h1>
          <p className="text-slate-400 mb-2">
            แผน <span className="text-white font-semibold">{plan.nameTh} ({plan.name})</span> เปิดใช้งานแล้ว
          </p>
          <p className="text-slate-500 text-sm mb-8">บันทึกเสร็จ — ขอบคุณที่ไว้วางใจ EyeFocus</p>
          <button onClick={() => router.push("/seller/subscription")} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition">
            ดูแผนการใช้งาน
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
        </button>

        {/* Order summary */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">สั่งซื้อแผน</p>
              <h2 className="text-xl font-bold text-white">{plan.nameTh} ({plan.name})</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {plan.maxBranches === -1 ? "ไม่จำกัดสาขา" : `${plan.maxBranches} สาขา`}
                {" · "}
                {plan.maxUsers === -1 ? "ไม่จำกัดผู้ใช้" : `${plan.maxUsers} ผู้ใช้`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">฿{plan.price.toLocaleString()}</p>
              <p className="text-xs text-slate-400">/เดือน</p>
            </div>
          </div>
        </div>

        {/* Payment method selector */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 mb-4">
          <p className="text-sm font-semibold text-slate-300 mb-3">เลือกวิธีชำระเงิน</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {([["promptpay", QrCode, "PromptPay QR", "ทันที ไม่ต้องสมัคร"], ["card", CreditCard, "บัตรเครดิต", "Visa / Mastercard"]] as const).map(
              ([id, Icon, label, sub]) => (
                <button
                  key={id}
                  onClick={() => setMethod(id as PayMethod)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition text-center ${
                    method === id ? "border-blue-500 bg-slate-800" : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${method === id ? "text-blue-400" : "text-slate-500"}`} />
                  <span className={`text-sm font-semibold ${method === id ? "text-white" : "text-slate-400"}`}>{label}</span>
                  <span className="text-[10px] text-slate-500">{sub}</span>
                </button>
              )
            )}
          </div>

          {/* PromptPay QR waiting */}
          {state === "qr_waiting" && qrUrl && (
            <div className="text-center py-4">
              <div className="bg-white rounded-2xl p-4 inline-block mb-4">
                <img src={qrUrl} alt="PromptPay QR" className="w-48 h-48 mx-auto" />
              </div>
              <p className="text-sm text-slate-300 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                รอการยืนยันชำระเงิน...
              </p>
              <p className="text-xs text-slate-500 mt-1">สแกน QR ด้วยแอปธนาคาร แล้วยืนยันการชำระเงิน</p>
            </div>
          )}

          {/* Card form (placeholder — real integration needs Omise.js) */}
          {method === "card" && state !== "qr_waiting" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">เลขบัตร</label>
                <input type="text" maxLength={19} placeholder="0000 0000 0000 0000" value={card.number} onChange={e => setCard(p => ({ ...p, number: e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim() }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">ชื่อบนบัตร</label>
                <input type="text" placeholder="NAME ON CARD" value={card.name} onChange={e => setCard(p => ({ ...p, name: e.target.value.toUpperCase() }))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">วันหมดอายุ</label>
                  <input type="text" placeholder="MM/YY" maxLength={5} value={card.expiry} onChange={e => setCard(p => ({ ...p, expiry: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">CVV</label>
                  <input type="password" maxLength={4} placeholder="•••" value={card.cvv} onChange={e => setCard(p => ({ ...p, cvv: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 text-xs text-amber-400 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                ต้อง integrate Omise.js สำหรับ card tokenization — ดู <a href="https://docs.omise.co/omise-js" target="_blank" rel="noreferrer" className="underline">docs.omise.co</a>
              </div>
            </div>
          )}

          {/* Error */}
          {state === "error" && errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-sm text-red-400 flex items-center gap-2 mt-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}

          {/* Submit */}
          {state !== "qr_waiting" && (
            <button
              onClick={handleSubmit}
              disabled={state === "loading"}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              {state === "loading" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> กำลังดำเนินการ...</>
              ) : method === "promptpay" ? (
                <><QrCode className="w-4 h-4" /> สร้าง QR PromptPay</>
              ) : (
                <><Lock className="w-4 h-4" /> ชำระเงิน ฿{plan.price.toLocaleString()}</>
              )}
            </button>
          )}
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Shield className="w-3.5 h-3.5" />
          <span>ชำระเงินปลอดภัยผ่าน Omise — PCI DSS Level 1 Certified</span>
        </div>
      </div>
    </div>
  );
}
