// app/api/admin/tenants/[id]/route.ts — SUPER_ADMIN: Get/Update tenant
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PLANS } from "@/lib/plans";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(req);
    const { id } = await params;
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(tenant);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const { action, planId, isSuspended, isActive, planExpiresAt } = body as {
      action?: "suspend" | "activate" | "change_plan" | "reset_dunning" | "extend_trial";
      planId?: string;
      isSuspended?: boolean;
      isActive?: boolean;
      planExpiresAt?: string;
    };

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};

    if (action === "suspend") {
      updates.isSuspended = true;
    } else if (action === "activate") {
      updates.isSuspended = false;
      updates.isActive = true;
    } else if (action === "change_plan" && planId) {
      const plan = PLANS[planId as keyof typeof PLANS];
      if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      updates.planType = planId;
      updates.maxBranches = plan.maxBranches;
      updates.maxUsers = plan.maxUsers;
      // Set plan to expire in 30 days if no current expiry
      if (!tenant.planExpiresAt || new Date(tenant.planExpiresAt) < new Date()) {
        const exp = new Date();
        exp.setDate(exp.getDate() + 30);
        updates.planExpiresAt = exp;
      }
      updates.isSuspended = false;
    } else if (action === "reset_dunning") {
      updates.dunningCount = 0;
      updates.dunningNextAttemptAt = null;
      updates.isSuspended = false;
    } else if (action === "extend_trial") {
      // Extend trial by 14 days
      const current = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : new Date();
      const extended = new Date(Math.max(current.getTime(), Date.now()));
      extended.setDate(extended.getDate() + 14);
      updates.trialEndsAt = extended;
    } else {
      // Manual field updates
      if (typeof isSuspended === "boolean") updates.isSuspended = isSuspended;
      if (typeof isActive === "boolean") updates.isActive = isActive;
      if (planExpiresAt) updates.planExpiresAt = new Date(planExpiresAt);
    }

    const [updated] = await db.update(tenants).set(updates).where(eq(tenants.id, id)).returning();
    return NextResponse.json({ success: true, tenant: updated });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[PATCH /api/admin/tenants/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
