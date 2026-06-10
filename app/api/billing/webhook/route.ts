// app/api/billing/webhook/route.ts — Omise webhook handler
// Handles: charge.complete, charge.failed events
// Omise sends webhooks for ALL charges including PromptPay completions
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature, PLAN_PRICES_SATANG } from "@/lib/omise";
import { PLANS } from "@/lib/plans";

// Omise webhook event types we care about
type OmiseEvent =
  | { key: "charge.complete"; data: OmiseChargeData }
  | { key: "charge.failed"; data: OmiseChargeData };

interface OmiseChargeData {
  id: string;
  amount: number;
  currency: string;
  status: "successful" | "failed" | "pending" | "reversed" | "expired";
  paid: boolean;
  metadata?: { tenantId?: string; planId?: string; slug?: string };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-omise-signature") ?? "";
    const webhookSecret = process.env.OMISE_WEBHOOK_SECRET ?? "";

    // Verify webhook signature (skip in dev if secret not set)
    if (webhookSecret && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.warn("[webhook] Invalid Omise signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as OmiseEvent;
    console.log(`[webhook] Received: ${event.key} — charge: ${event.data.id}`);

    const charge = event.data;
    const tenantId = charge.metadata?.tenantId;
    const planId = charge.metadata?.planId;

    if (!tenantId || !planId) {
      // Charge not from EyeFocus subscription — ignore
      return NextResponse.json({ received: true });
    }

    // ── charge.complete: Payment succeeded ───────────────────────────────────
    if (event.key === "charge.complete" && charge.paid) {
      const plan = PLANS[planId as keyof typeof PLANS];
      if (!plan) {
        console.warn(`[webhook] Unknown planId: ${planId}`);
        return NextResponse.json({ received: true });
      }

      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      if (!tenant) {
        console.warn(`[webhook] Tenant not found: ${tenantId}`);
        return NextResponse.json({ received: true });
      }

      // Extend plan by 1 month
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
        dunningNextAttemptAt: null,
        lastChargeId: charge.id,
      } as Record<string, unknown>).where(eq(tenants.id, tenantId));

      console.log(`[webhook] ✅ Plan activated: ${tenantId} → ${planId} until ${nextExpiry.toISOString()}`);
      return NextResponse.json({ received: true, action: "plan_activated" });
    }

    // ── charge.failed: Payment failed ────────────────────────────────────────
    if (event.key === "charge.failed") {
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      if (!tenant) return NextResponse.json({ received: true });

      const newCount = (tenant.dunningCount ?? 0) + 1;

      // Dunning schedule: retry in 1d, 3d, 7d — then suspend
      const retryDays = [1, 3, 7];
      const nextAttempt = retryDays[newCount - 1]
        ? new Date(Date.now() + retryDays[newCount - 1] * 86400000)
        : null;

      const shouldSuspend = newCount >= 3;

      await db.update(tenants).set({
        dunningCount: newCount,
        dunningNextAttemptAt: nextAttempt,
        isSuspended: shouldSuspend,
      } as Record<string, unknown>).where(eq(tenants.id, tenantId));

      console.log(`[webhook] ❌ Charge failed: ${tenantId} — dunning count: ${newCount}${shouldSuspend ? " — SUSPENDED" : ""}`);
      return NextResponse.json({ received: true, action: shouldSuspend ? "tenant_suspended" : "dunning_incremented" });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[POST /api/billing/webhook]", error);
    // Always return 200 to Omise (avoid retry storm)
    return NextResponse.json({ received: true });
  }
}
