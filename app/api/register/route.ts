// app/api/register/route.ts — Self-service tenant registration
// Creates: tenant + default branch + OWNER user (all in one transaction)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, branches, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      shopName, shopSlug, shopPhone,
      ownerName, ownerEmail, ownerPassword,
      planType = "starter",
    } = body as {
      shopName: string;
      shopSlug: string;
      shopPhone?: string;
      ownerName: string;
      ownerEmail: string;
      ownerPassword: string;
      planType?: string;
    };

    // ── Validate ────────────────────────────────────────────────────────────
    if (!shopName?.trim()) return NextResponse.json({ error: "กรุณาระบุชื่อร้าน" }, { status: 400 });
    if (!shopSlug?.trim() || !/^[a-z0-9-]+$/.test(shopSlug))
      return NextResponse.json({ error: "Shop URL ใช้ได้เฉพาะตัวอักษรพิมพ์เล็ก ตัวเลข และเครื่องหมาย -" }, { status: 400 });
    if (!ownerEmail?.includes("@")) return NextResponse.json({ error: "อีเมลไม่ถูกต้อง" }, { status: 400 });
    if (!ownerPassword || ownerPassword.length < 8)
      return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });

    // ── Check slug uniqueness ────────────────────────────────────────────────
    const existing = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, shopSlug)).limit(1);
    if (existing.length) return NextResponse.json({ error: `Shop URL "${shopSlug}" ถูกใช้ไปแล้ว กรุณาเลือกชื่ออื่น` }, { status: 409 });

    // ── Plan limits ──────────────────────────────────────────────────────────
    const planLimits: Record<string, { maxBranches: number; maxUsers: number }> = {
      starter:    { maxBranches: 1,  maxUsers: 5  },
      pro:        { maxBranches: 3,  maxUsers: 15 },
      enterprise: { maxBranches: 999, maxUsers: 999 },
    };
    const limits = planLimits[planType] ?? planLimits.starter;

    // ── Trial end date (30 days) ─────────────────────────────────────────────
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // ── Create tenant ────────────────────────────────────────────────────────
    const [tenant] = await db.insert(tenants).values({
      name: shopName.trim(),
      slug: shopSlug.trim(),
      phone: shopPhone?.trim() || null,
      planType,
      trialEndsAt,
      maxBranches: limits.maxBranches,
      maxUsers: limits.maxUsers,
      isActive: true,
    }).returning();

    // ── Create default branch ────────────────────────────────────────────────
    const branchCode = shopSlug.replace(/-/g, "").substring(0, 10).toUpperCase() || "MAIN";
    const [branch] = await db.insert(branches).values({
      tenantId: tenant.id,
      name: `${shopName.trim()} (สาขาหลัก)`,
      code: branchCode,
      isActive: true,
    }).returning();

    // ── Hash password & create owner ─────────────────────────────────────────
    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    const [owner] = await db.insert(users).values({
      tenantId: tenant.id,
      branchId: branch.id,
      name: ownerName.trim(),
      email: ownerEmail.trim().toLowerCase(),
      passwordHash,
      role: "OWNER",
      isActive: true,
    }).returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    return NextResponse.json({
      success: true,
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, planType: tenant.planType },
      branch: { id: branch.id, name: branch.name },
      owner: { id: owner.id, name: owner.name, email: owner.email },
      message: `ร้าน "${shopName}" สร้างเรียบร้อย — ทดลองฟรี 30 วัน`,
    }, { status: 201 });

  } catch (error) {
    console.error("[POST /api/register]", error);
    const msg = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    // Unique constraint on slug
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Shop URL นี้ถูกใช้ไปแล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
  }
}
