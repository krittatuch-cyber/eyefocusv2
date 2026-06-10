// app/api/admin/tenants/route.ts — SUPER_ADMIN: List all tenants with stats
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { tenants, branches, users, orders } from "@/lib/db/schema";
import { eq, count, sql, desc } from "drizzle-orm";
import { PLAN_PRICES_SATANG } from "@/lib/omise";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q")?.toLowerCase() ?? "";

    // Get all tenants with counts
    const rows = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        planType: tenants.planType,
        isActive: tenants.isActive,
        isSuspended: tenants.isSuspended,
        trialEndsAt: tenants.trialEndsAt,
        planExpiresAt: tenants.planExpiresAt,
        maxBranches: tenants.maxBranches,
        maxUsers: tenants.maxUsers,
        billingEmail: tenants.billingEmail,
        paymentMethod: tenants.paymentMethod,
        dunningCount: tenants.dunningCount,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .orderBy(desc(tenants.createdAt));

    // Get branch + user counts per tenant in one query each
    const branchCounts = await db
      .select({ tenantId: branches.tenantId, count: count() })
      .from(branches)
      .groupBy(branches.tenantId);

    const userCounts = await db
      .select({ tenantId: users.tenantId, count: count() })
      .from(users)
      .groupBy(users.tenantId);

    const bcMap = Object.fromEntries(branchCounts.map(r => [r.tenantId, r.count]));
    const ucMap = Object.fromEntries(userCounts.map(r => [r.tenantId, r.count]));

    const now = new Date();
    const enriched = rows
      .map(t => {
        const trialDays = t.trialEndsAt
          ? Math.max(0, Math.ceil((new Date(t.trialEndsAt).getTime() - now.getTime()) / 86400000))
          : null;
        const isInTrial = trialDays !== null && trialDays > 0;
        const mrr = PLAN_PRICES_SATANG[t.planType] ? PLAN_PRICES_SATANG[t.planType] / 100 : 0;
        return {
          ...t,
          trialDaysRemaining: trialDays,
          isInTrial,
          currentBranches: bcMap[t.id] ?? 0,
          currentUsers: ucMap[t.id] ?? 0,
          mrr,
        };
      })
      .filter(t => !search || t.name.toLowerCase().includes(search) || t.slug.includes(search));

    // Platform summary
    const totalMrr = enriched
      .filter(t => !t.isInTrial && !t.isSuspended && t.isActive)
      .reduce((sum, t) => sum + t.mrr, 0);

    return NextResponse.json({
      tenants: enriched,
      summary: {
        total: rows.length,
        active: enriched.filter(t => t.isActive && !t.isSuspended).length,
        trial: enriched.filter(t => t.isInTrial).length,
        suspended: enriched.filter(t => t.isSuspended).length,
        mrr: totalMrr,
        byPlan: {
          starter: enriched.filter(t => t.planType === "starter").length,
          pro: enriched.filter(t => t.planType === "pro").length,
          enterprise: enriched.filter(t => t.planType === "enterprise").length,
        },
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/admin/tenants]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
