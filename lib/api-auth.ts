// lib/api-auth.ts — Shared auth context extractor for API routes (multi-role support)
import { NextRequest } from "next/server";
import { verifyJwt, getTokenFromRequest, type JwtPayload } from "@/lib/auth";
import { hasPermission, type AppRole, PERMISSIONS } from "@/lib/permissions";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface AuthContext extends JwtPayload {
  roles: string[]; // multi-role array
}

// ─── Tenant permission cache (in-process, ~60s TTL) ─────────────────────────
const _permCache = new Map<string, { config: Record<string, string[]> | null; exp: number }>();

async function loadTenantPermissions(tenantId: string): Promise<Record<string, string[]> | null> {
  const now = Date.now();
  const cached = _permCache.get(tenantId);
  if (cached && cached.exp > now) return cached.config;

  try {
    const [row] = await db.select({ permissionsConfig: tenants.permissionsConfig })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    const config = row?.permissionsConfig ?? null;
    _permCache.set(tenantId, { config, exp: now + 60_000 }); // 60s cache
    return config;
  } catch {
    return null; // fall back to code defaults
  }
}

/** Merge code defaults with tenant overrides */
function getMergedPermissions(tenantConfig: Record<string, string[]> | null): Record<string, string[]> {
  if (!tenantConfig) return PERMISSIONS;
  const merged: Record<string, string[]> = { ...PERMISSIONS };
  for (const [action, roles] of Object.entries(tenantConfig)) {
    if (merged[action] !== undefined) merged[action] = roles;
  }
  return merged;
}

/**
 * Extract and verify JWT from request cookie or Authorization header.
 * Returns null if unauthenticated.
 */
export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const ctx = await verifyJwt(token);
  if (!ctx) return null;
  // Normalize: ensure roles[] exists (backward compat with old JWTs that only have role)
  if (!ctx.roles || !Array.isArray(ctx.roles) || ctx.roles.length === 0) {
    (ctx as any).roles = [ctx.role ?? "SALES"];
  }
  return ctx as AuthContext;
}

/**
 * Require auth — returns context or throws 401.
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const ctx = await getAuthContext(req);
  if (!ctx) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  return ctx;
}

/**
 * Require a specific permission action.
 * Checks tenant's custom permissionsConfig from DB, falling back to code defaults.
 * Throws 403 if the user's roles don't include the permission.
 */
export async function requirePermission(req: NextRequest, action: string): Promise<AuthContext> {
  const ctx = await requireAuth(req);

  // SUPER_ADMIN bypasses everything
  if (ctx.roles.includes("SUPER_ADMIN")) return ctx;

  // Load tenant-specific permission overrides (cached 60s)
  const tenantConfig = await loadTenantPermissions(ctx.tenantId);
  const permissions = getMergedPermissions(tenantConfig);

  const allowed = permissions[action];
  const hasAccess = allowed && ctx.roles.some(r => r === "SUPER_ADMIN" || allowed.includes(r as AppRole));

  if (!hasAccess) {
    throw new Response(
      JSON.stringify({
        error: "Forbidden",
        required: action,
        yourRoles: ctx.roles,
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  return ctx;
}

/** Invalidate the tenant permissions cache (call after PUT /api/tenant/permissions) */
export function invalidateTenantPermissionsCache(tenantId: string) {
  _permCache.delete(tenantId);
}

/**
 * Require OWNER or MANAGER role (management-level access).
 * @deprecated Use requirePermission(req, 'users.view') etc. instead.
 */
export async function requireManager(req: NextRequest): Promise<AuthContext> {
  const ctx = await requireAuth(req);
  const isManager = ctx.roles.some(r => ["OWNER","MANAGER","SUPER_ADMIN"].includes(r));
  if (!isManager) {
    throw new Response(JSON.stringify({ error: "Forbidden: Manager+ required" }), {
      status: 403, headers: { "Content-Type": "application/json" },
    });
  }
  return ctx;
}

/**
 * Require SUPER_ADMIN role — platform-level access only.
 */
export async function requireSuperAdmin(req: NextRequest): Promise<AuthContext> {
  const ctx = await requireAuth(req);
  if (!ctx.roles.includes("SUPER_ADMIN")) {
    throw new Response(JSON.stringify({ error: "Forbidden: Super Admin only" }), {
      status: 403, headers: { "Content-Type": "application/json" },
    });
  }
  return ctx;
}

/**
 * Convenience: check permission without throwing — returns boolean.
 */
export async function canDo(req: NextRequest, action: string): Promise<boolean> {
  const ctx = await getAuthContext(req);
  if (!ctx) return false;
  return hasPermission(ctx.roles, action);
}
