// app/api/tenant/permissions/route.ts — OWNER-only: get/update tenant permission overrides
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, invalidateTenantPermissionsCache } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { tenants, auditLogs } from "@/lib/db/schema";
import { PERMISSIONS, type AppRole, TENANT_ROLES } from "@/lib/permissions";
import { eq } from "drizzle-orm";

/** Merge code-defined PERMISSIONS with tenant-specific overrides (local helper) */
function mergePermissionsConfig(
  tenantConfig?: Record<string, string[]> | null
): Record<string, string[]> {
  const merged: Record<string, string[]> = {};
  for (const [action, roles] of Object.entries(PERMISSIONS)) {
    merged[action] = [...roles];
  }
  if (tenantConfig) {
    for (const [action, roles] of Object.entries(tenantConfig)) {
      // Only override known actions with valid roles
      if (PERMISSIONS[action] !== undefined && Array.isArray(roles)) {
        merged[action] = roles.filter(r => TENANT_ROLES.includes(r as AppRole));
      }
    }
  }
  return merged;
}

// GET — Return current merged permissions (defaults + tenant overrides)
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.roles.some(r => ["OWNER", "MANAGER", "SUPER_ADMIN"].includes(r))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [tenant] = await db.select({ permissionsConfig: tenants.permissionsConfig })
      .from(tenants)
      .where(eq(tenants.id, auth.tenantId))
      .limit(1);

    const merged = mergePermissionsConfig(tenant?.permissionsConfig);
    return NextResponse.json({
      defaults: PERMISSIONS,
      overrides: tenant?.permissionsConfig ?? {},
      merged,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("GET /api/tenant/permissions error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT — Save tenant permission overrides (OWNER only)
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.roles.includes("OWNER") && !auth.roles.includes("SUPER_ADMIN")) {
      return NextResponse.json({
        error: "คุณไม่มีสิทธิ์แก้ไขสิทธิ์การใช้งาน\nเฉพาะเจ้าของร้าน (OWNER) เท่านั้น"
      }, { status: 403 });
    }

    const body = await req.json();
    const { overrides } = body as { overrides: Record<string, string[]> };

    // Validate: only allow known actions + valid roles
    const validated: Record<string, string[]> = {};
    for (const [action, roles] of Object.entries(overrides ?? {})) {
      if (PERMISSIONS[action] !== undefined && Array.isArray(roles)) {
        // Filter to only valid tenant roles
        validated[action] = roles.filter(r => TENANT_ROLES.includes(r as AppRole));
      }
    }

    await db.update(tenants)
      .set({ permissionsConfig: validated, updatedAt: new Date() })
      .where(eq(tenants.id, auth.tenantId));

    // Invalidate in-process cache
    invalidateTenantPermissionsCache(auth.tenantId);

    // Audit log
    await db.insert(auditLogs).values({
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "USER_ROLE_CHANGED",
      target: "tenant_permissions",
      detail: `อัปเดตสิทธิ์การใช้งาน: ${Object.keys(validated).length} action(s) ถูกแก้ไข`,
    });

    const merged = mergePermissionsConfig(validated);
    return NextResponse.json({ success: true, merged });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("PUT /api/tenant/permissions error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
