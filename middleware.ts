// middleware.ts — Auth guard + Subdomain tenant routing for EyeFocus SaaS
// Note: "middleware" convention deprecated in Next.js 16 — use "proxy.ts" for Node.js
// This file uses Edge Runtime for Cloudflare Workers compatibility
import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";

export const runtime = "experimental-edge";

// Routes that never need auth
const PUBLIC_PREFIXES = ["/api/auth", "/api/register", "/api/billing/webhook", "/_next", "/favicon", "/static", "/login", "/register"];
// Routes that require a valid JWT
const PROTECTED_PREFIXES = ["/seller", "/user", "/admin"];
// Static asset extensions
const STATIC_EXT = /\.(ico|png|jpg|jpeg|svg|css|js|woff2?|map|txt)$/;

// ─── Subdomain extraction ──────────────────────────────────────────────────────
// e.g. "tonglor.eyefocus.app" → "tonglor"
// e.g. "localhost" → null (dev mode, no subdomain)
function extractSubdomain(hostname: string): string | null {
  // Strip port if present
  const host = hostname.split(":")[0];
  const parts = host.split(".");
  // Need at least 3 parts for a real subdomain (sub.domain.tld)
  if (parts.length >= 3) {
    const sub = parts[0];
    // Exclude common non-tenant subdomains
    if (sub && !["www", "admin", "api", "app"].includes(sub)) {
      return sub;
    }
  }
  return null;
}

function getTokenFromCookies(req: NextRequest): string | null {
  return req.cookies.get("auth_token")?.value || null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const tenantSlug = extractSubdomain(hostname);

  // ── Skip static assets ───────────────────────────────────────────────────
  if (STATIC_EXT.test(pathname)) return NextResponse.next();

  // ── Skip public routes (no auth needed) ──────────────────────────────────
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Verify JWT ────────────────────────────────────────────────────────────
  const token = getTokenFromCookies(req);
  const payload = token ? await verifyJwt(token) : null;

  // ── Redirect unauthenticated users to login ───────────────────────────────
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!payload) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── RBAC routing guards ─────────────────────────────────────────────────
    // /admin — SUPER_ADMIN only
    if (pathname.startsWith("/admin") && payload.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // /seller — OWNER or MANAGER only
    if (pathname.startsWith("/seller") && payload.role === "SELLER") {
      return NextResponse.redirect(new URL("/user/dashboard", req.url));
    }
    // /seller or /user — SUPER_ADMIN goes to /admin
    if ((pathname.startsWith("/seller") || pathname.startsWith("/user")) && payload.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // ── Inject context headers for API handlers ─────────────────────────────
    const headers = new Headers(req.headers);
    headers.set("x-user-id", payload.userId);
    headers.set("x-tenant-id", payload.tenantId);
    headers.set("x-user-role", payload.role);
    if (tenantSlug) headers.set("x-tenant-slug", tenantSlug);

    return NextResponse.next({ request: { headers } });
  }

  // ── Redirect authenticated users away from login ──────────────────────────
  if (pathname === "/login" || pathname === "/") {
    if (payload) {
      const target =
        payload.role === "SUPER_ADMIN" ? "/admin/dashboard" :
        payload.role === "SELLER" ? "/user/dashboard" :
        "/seller/dashboard";
      return NextResponse.redirect(new URL(target, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

