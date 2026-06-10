// app/api/tenant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requirePermission } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { tenants, branches, users } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, auth.tenantId)).limit(1);
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    const [branchCount] = await db.select({ count: count() }).from(branches).where(eq(branches.tenantId, auth.tenantId));
    const [userCount] = await db.select({ count: count() }).from(users).where(eq(users.tenantId, auth.tenantId));
    let trialDaysRemaining: number | null = null;
    if (tenant.trialEndsAt) {
      const diff = Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / 86400000);
      trialDaysRemaining = Math.max(0, diff);
    }
    return NextResponse.json({
      id: tenant.id, name: tenant.name, slug: tenant.slug,
      taxId: tenant.taxId, phone: tenant.phone, address: tenant.address, logoUrl: tenant.logoUrl,
      planType: tenant.planType, isActive: tenant.isActive, isSuspended: tenant.isSuspended,
      isInTrial: trialDaysRemaining !== null && trialDaysRemaining > 0,
      trialDaysRemaining, trialEndsAt: tenant.trialEndsAt, planExpiresAt: tenant.planExpiresAt,
      maxBranches: tenant.maxBranches, maxUsers: tenant.maxUsers,
      currentBranches: branchCount.count, currentUsers: userCount.count,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "settings.edit");
    const body = await req.json();
    const { name, taxId, phone, address, logoUrl } = body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (taxId !== undefined) updates.taxId = taxId || null;
    if (phone !== undefined) updates.phone = phone || null;
    if (address !== undefined) updates.address = address || null;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl || null;
    const [updated] = await db.update(tenants).set(updates as any)
      .where(eq(tenants.id, auth.tenantId)).returning();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, logoUrl: updated.logoUrl, name: updated.name });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
