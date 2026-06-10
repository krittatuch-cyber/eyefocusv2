// app/(auth)/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import LanguageSwitcher from "@/components/shared/language-switcher";
import { db } from "@/lib/db-mock";
import { Eye, EyeOff, Shield, User, Lock, Moon, Sun, Database } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loginMode, setLoginMode] = useState<"api" | "mock">("api"); // api = real, mock = demo

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  };

  // ─── Real API Login ────────────────────────────────────────────────────────
  const loginWithApi = async (emailVal: string, passwordVal: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailVal, password: passwordVal }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Login failed");
    }

    const data = await res.json();
    // Also store in sessionStorage so seller/user layout can read user info
    sessionStorage.setItem("currentUser", JSON.stringify(data.user));
    return data.user;
  };

  // ─── Mock Login (fallback for demo without DB) ────────────────────────────
  const loginWithMock = (emailVal: string, passwordVal: string) => {
    const user = db.users.find(
      (u) => u.email.toLowerCase() === emailVal.toLowerCase() && u.passwordHash === passwordVal
    );
    if (!user) throw new Error(locale === "th" ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : "Invalid email or password");
    sessionStorage.setItem("currentUser", JSON.stringify(user));
    return user;
  };

  // ─── Submit Handler ────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let user: any;

      if (loginMode === "api") {
        try {
          user = await loginWithApi(email, password);
        } catch {
          // Fallback to mock if API not available (no DB yet)
          user = loginWithMock(email, password);
        }
      } else {
        user = loginWithMock(email, password);
      }

      // Redirect based on role
      if (user.role === "OWNER" || user.role === "MANAGER") {
        router.push("/seller/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    } catch (err: any) {
      setError(err.message || (locale === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
      setLoading(false);
    }
  };

  // ─── Quick Login for any account ─────────────────────────────────────────
  const triggerMockLogin = async (mockEmail: string) => {
    setEmail(mockEmail);
    setPassword("123456");
    setError("");
    setLoading(true);

    try {
      let user: any;
      try {
        user = await loginWithApi(mockEmail, "123456");
      } catch {
        user = loginWithMock(mockEmail, "123456");
      }

      const sellerRoles = ["OWNER", "MANAGER", "OD"];
      if (sellerRoles.includes(user.role) || user.roles?.some((r: string) => sellerRoles.includes(r))) {
        router.push("/seller/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header controls */}
      <header className="p-4 flex justify-between items-center max-w-7xl w-full mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold shadow-md shadow-accent/25">
            EF
          </div>
          <span className="font-bold font-heading text-lg tracking-wider text-primary-dark dark:text-white">EYE FOCUS</span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Auth mode indicator */}
          <button
            onClick={() => setLoginMode(loginMode === "api" ? "mock" : "api")}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              loginMode === "api"
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
            }`}
            title="สลับโหมด: API จริง / Mock Demo"
          >
            <Database className="w-3 h-3" />
            {loginMode === "api" ? "API Mode" : "Mock Mode"}
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main card */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-100 dark:shadow-none transition-all duration-300">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white mb-2">
              {locale === "th" ? "ยินดีต้อนรับกลับมา" : "Welcome Back"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("appSubtitle")}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {locale === "th" ? "อีเมลผู้ใช้งาน" : "Email Address"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@eyefocus.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-accent dark:focus:border-accent text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {locale === "th" ? "รหัสผ่าน" : "Password"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-accent dark:focus:border-accent text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl">
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 disabled:opacity-50 disabled:shadow-none transition-all duration-200 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                locale === "th" ? "เข้าสู่ระบบ" : "Sign In"
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                บัญชีทดสอบระบบ · รหัสผ่านทุกบัญชี: 123456
              </span>
            </div>
          </div>

          {/* Quick Login Buttons — ครบทุก Role */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { email: "owner@eyefocus.com",    label: "เจ้าของร้าน",   role: "OWNER",    color: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/50",  dot: "bg-violet-500" },
              { email: "manager@eyefocus.com",  label: "ผู้จัดการ",     role: "MANAGER",  color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50", dot: "bg-emerald-500" },
              { email: "od@eyefocus.com",       label: "นักทัศนมาตร",   role: "OD",       color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50",           dot: "bg-blue-500" },
              { email: "optician@eyefocus.com", label: "ช่างแว่นตา",    role: "OPTICIAN", color: "text-cyan-600 dark:text-cyan-400",        bg: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/50",           dot: "bg-cyan-500" },
              { email: "sales@eyefocus.com",    label: "พนักงานขาย",    role: "SALES",    color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50",       dot: "bg-amber-500" },
              { email: "cashier@eyefocus.com",  label: "แคชเชียร์",     role: "CASHIER",  color: "text-orange-600 dark:text-orange-400",   bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50",   dot: "bg-orange-500" },
            ].map((acc) => (
              <button
                key={acc.email}
                id={`quick-login-${acc.role.toLowerCase()}`}
                onClick={() => triggerMockLogin(acc.email)}
                disabled={loading}
                className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition hover:opacity-80 disabled:opacity-40 cursor-pointer ${acc.bg}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${acc.dot}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${acc.color}`}>{acc.role}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{acc.label}</span>
                <span className="text-[9px] text-slate-400 mt-0.5 truncate w-full">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-accent tracking-wide">v2.2.0 — Phase 0 Auth Ready</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} Eye Focus. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
