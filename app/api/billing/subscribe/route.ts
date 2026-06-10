// app/api/billing/subscribe/route.ts — Create/upgrade subscription via Omise
// Supports: PromptPay (QR) and Credit Card (token from Omise.js)
import { NextRequest, NextResponse } from "next/server";
import { requireManager } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createOmiseCustomer,
  createPromptPayCharge,
  chargeCustomer,
  PLAN_PRICES_SATANG,
} from "@/lib/omise";
import { PLANS } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireManager(req);
    const body = await req.json();
    const {
      planId,          // "starter" | "pro" | "enterprise"
      paymentMethod,   // "promptpay" | "card"
      cardToken,       // Omise.js token (card only)
      billingEmail,    // optional override
    } = body as {
      planId: string;
      paymentMethod: "promptpay" | "card";
      cardToken?: string;
      billingEmail?: string;
    };

    // Validate plan
    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const amountSatang = PLAN_PRICES_SATANG[planId];
    if (!amountSatang) return NextResponse.json({ error: "Plan price not found" }, { status: 400 });

    // Get current tenant
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, auth.tenantId)).limit(1);
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const email = billingEmail || (await getOwnerEmail(auth.tenantId)) || "";
    const description = `EyeFocus ${plan.name} — ${tenant.name} (${tenant.slug})`;
    const metadata = { tenantId: auth.tenantId, planId, slug: tenant.slug };

    // ── PromptPay: Create QR charge ──────────────────────────────────────────
    if (paymentMethod === "promptpay") {
      const charge = await createPromptPayCharge({
        amount: amountSatang,
        description,
        metadata,
      });

      // Save pending charge info
      await db.update(tenants).set({
        billingEmail: billingEmail || tenant.billingEmail,
        paymentMethod: "promptpay",
        lastChargeId: charge.id,
      } as Record<string, unknown>).where(eq(tenants.id, auth.tenantId));

      return NextResponse.json({
        success: true,
        paymentMethod: "promptpay",
        chargeId: charge.id,
        status: charge.status,
        qrUrl: charge.authorizeUri, // PromptPay QR page
        amount: amountSatang / 100,
        planId,
        planName: plan.name,
      });
    }

    // ── Credit Card: Create customer + charge ────────────────────────────────
    if (paymentMethod === "card") {
      if (!cardToken) return NextResponse.json({ error: "cardToken required for card payment" }, { status: 400 });

      let omiseCustomerId = tenant.omiseCustomerId;

      // Create Omise customer if not exists
      if (!omiseCustomerId) {
        omiseCustomerId = await createOmiseCustomer({
          email,
          description: `${tenant.name} (${tenant.slug})`,
          cardToken,
        });
      }

      // Charge the customer
      const charge = await chargeCustomer({
        customerId: omiseCustomerId,
        amount: amountSatang,
        description,
        metadata,
      });

      if (charge.paid || charge.status === "successful") {
        // Extend plan by 1 month
        const now = new Date();
        const currentExpiry = tenant.planExpiresAt && new Date(tenant.planExpiresAt) > now
          ? new Date(tenant.planExpiresAt)
          : now;
        const nextExpiry = new Date(currentExpiry);
        nextExpiry.setMonth(nextExpiry.getMonth() + 1);

        const planLimits = { starter: { maxBranches: 1, maxUsers: 5 }, pro: { maxBranches: 3, maxUsers: 15 }, enterprise: { maxBranches: 999, maxUsers: 999 } };
        const limits = planLimits[planId as keyof typeof planLimits] ?? planLimits.starter;

        await db.update(tenants).set({
          planType: planId,
          planExpiresAt: nextExpiry,
          trialEndsAt: null,              // end trial
          omiseCustomerId,
          lastChargeId: charge.id,
          billingEmail: billingEmail || tenant.billingEmail,
          paymentMethod: "card",
          maxBranches: limits.maxBranches,
          maxUsers: limits.maxUsers,
          dunningCount: 0,
          dunningNextAttemptAt: null,
          isSuspended: false,
        } as Record<string, unknown>).where(eq(tenants.id, auth.tenantId));

        return NextResponse.json({
          success: true,
          paymentMethod: "card",
          chargeId: charge.id,
          status: "successful",
          amount: amountSatang / 100,
          planId,
          planName: plan.name,
          expiresAt: nextExpiry.toISOString(),
        });
      } else {
        return NextResponse.json({
          success: false,
          chargeId: charge.id,
          status: charge.status,
          error: "การชำระเงินไม่สำเร็จ กรุณาตรวจสอบข้อมูลบัตร",
        }, { status: 402 });
      }
    }

    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });

  } catch (error) {
    console.error("[POST /api/billing/subscribe]", error);
    const msg = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Get owner email for billing
async function getOwnerEmail(tenantId: string): Promise<string | null> {
  try {
    const { users } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");
    const [owner] = await db
      .select({ email: users.email })
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.role, "OWNER")))
      .limit(1);
    return owner?.email ?? null;
  } catch { return null; }
}
