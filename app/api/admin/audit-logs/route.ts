// app/api/admin/audit-logs/route.ts — SUPER_ADMIN: View audit logs across all tenants
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { auditLogs, tenants } from "@/lib/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    const action = searchParams.get("action");
    const days = parseInt(searchParams.get("days") ?? "7");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const conditions = [gte(auditLogs.createdAt, since)];
    if (tenantId) conditions.push(eq(auditLogs.tenantId, tenantId));

    const logs = await db
      .select({
        id: auditLogs.id,
        tenantId: auditLogs.tenantId,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        userId: auditLogs.userId,
        userName: auditLogs.userName,
        action: auditLogs.action,
        target: auditLogs.target,
        detail: auditLogs.detail,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(tenants, eq(auditLogs.tenantId, tenants.id))
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return NextResponse.json({ logs, total: logs.length, days, since: since.toISOString() });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/admin/audit-logs]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
