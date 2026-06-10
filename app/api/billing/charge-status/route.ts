// app/api/billing/charge-status/route.ts — Poll charge status (for PromptPay)
// Frontend polls this after user scans QR until paid or expired
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getCharge } from "@/lib/omise";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PLANS } from "@/lib/plans";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const chargeId = searchParams.get("chargeId");
    const planId = searchParams.get("planId");

    if (!chargeId) return NextResponse.json({ error: "chargeId required" }, { status: 400 });

    const charge = await getCharge(chargeId);

    // If paid and planId provided — activate plan
    if ((charge.paid || charge.status === "successful") && planId) {
      const plan = PLANS[planId as keyof typeof PLANS];
      if (plan) {
        const [tenant] = await db.select().from(tenants).where(eq(tenants.id, auth.tenantId)).limit(1);
        if (tenant) {
          const now = new Date();
          const currentExpiry = tenant.planExpiresAt && new Date(tenant.planExpiresAt) > now
            ? new Date(tenant.planExpiresAt)
            : now;
          const nextExpiry = new Date(currentExpiry);
          nextExpiry.setMonth(nextExpiry.getMonth() + 1);

          const planLimits: Record<string, { maxBranches: number; maxUsers: number }> = {
            starter:    { maxBranches: 1,   maxUsers: 5   },
            pro:        { maxBranches: 3,   maxUsers: 15  },
            enterprise: { maxBranches: 999, maxUsers: 999 },
          };
          const limits = planLimits[planId] ?? planLimits.starter;

          await db.update(tenants).set({
            planType: planId,
            planExpiresAt: nextExpiry,
            trialEndsAt: null,
            maxBranches: limits.maxBranches,
            maxUsers: limits.maxUsers,
            isSuspended: false,
            dunningCount: 0,
            lastChargeId: chargeId,
            paymentMethod: "promptpay",
          } as Record<string, unknown>).where(eq(tenants.id, auth.tenantId));
        }
      }
    }

    return NextResponse.json({
      chargeId: charge.id,
      status: charge.status,
      paid: charge.paid,
    });
  } catch (error) {
    console.error("[GET /api/billing/charge-status]", error);
    return NextResponse.json({ error: "Failed to retrieve charge" }, { status: 500 });
  }
}
