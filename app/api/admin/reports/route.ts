// app/api/admin/reports/route.ts — Platform MRR & revenue report
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { PLAN_PRICES_SATANG } from "@/lib/omise";
import { PLANS } from "@/lib/plans";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);

    const all = await db.select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      planType: tenants.planType,
      isActive: tenants.isActive,
      isSuspended: tenants.isSuspended,
      trialEndsAt: tenants.trialEndsAt,
      planExpiresAt: tenants.planExpiresAt,
      createdAt: tenants.createdAt,
      dunningCount: tenants.dunningCount,
    }).from(tenants);

    const now = new Date();

    const enriched = all.map(t => {
      const trialDays = t.trialEndsAt
        ? Math.max(0, Math.ceil((new Date(t.trialEndsAt).getTime() - now.getTime()) / 86400000))
        : null;
      const isInTrial = trialDays !== null && trialDays > 0;
      const isPaying = !isInTrial && t.isActive && !t.isSuspended;
      const mrr = isPaying ? (PLAN_PRICES_SATANG[t.planType] ?? 0) / 100 : 0;
      return { ...t, isInTrial, isPaying, mrr };
    });

    // MRR by plan
    const mrrByPlan: Record<string, number> = {};
    for (const t of enriched) {
      if (t.mrr > 0) mrrByPlan[t.planType] = (mrrByPlan[t.planType] ?? 0) + t.mrr;
    }

    const totalMrr = enriched.reduce((s, t) => s + t.mrr, 0);
    const arr = totalMrr * 12;

    // Monthly signups (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyCounts: Record<string, { signups: number; mrr: number }> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyCounts[key] = { signups: 0, mrr: 0 };
    }

    for (const t of enriched) {
      const d = new Date(t.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyCounts[key] !== undefined) {
        monthlyCounts[key].signups += 1;
        monthlyCounts[key].mrr += t.mrr;
      }
    }

    const monthly = Object.entries(monthlyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    // Top paying tenants
    const topTenants = enriched
      .filter(t => t.mrr > 0)
      .sort((a, b) => b.mrr - a.mrr)
      .slice(0, 10)
      .map(t => ({ id: t.id, name: t.name, slug: t.slug, planType: t.planType, mrr: t.mrr }));

    return NextResponse.json({
      totalMrr, arr, mrrByPlan,
      counts: {
        total: all.length,
        paying: enriched.filter(t => t.isPaying).length,
        trial: enriched.filter(t => t.isInTrial).length,
        suspended: enriched.filter(t => t.isSuspended).length,
        dunning: enriched.filter(t => t.dunningCount > 0).length,
      },
      monthly, topTenants,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/admin/reports]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
