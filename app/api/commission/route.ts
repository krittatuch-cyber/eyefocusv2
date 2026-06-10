// app/api/commission/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { orders, users, branches, commissionRules } from "@/lib/db/schema";
import { eq, and, gte, lte, sum, count, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  try {
    // Get all users + commission rules
    const [allUsers, rules, salesByUser] = await Promise.all([
      db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        branchId: users.branchId,
        branchName: branches.name,
        isActive: users.isActive,
      })
        .from(users)
        .leftJoin(branches, eq(users.branchId, branches.id))
        .where(eq(users.tenantId, auth.tenantId)),

      db.select()
        .from(commissionRules)
        .where(eq(commissionRules.tenantId, auth.tenantId)),

      // Sales per seller this month
      db.select({
        sellerId: orders.sellerId,
        totalRevenue: sum(orders.netAmount),
        orderCount: count(),
      })
        .from(orders)
        .where(and(
          eq(orders.tenantId, auth.tenantId),
          eq(orders.status, "PAID"),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        ))
        .groupBy(orders.sellerId),
    ]);

    // Build result
    const rulesMap = new Map(rules.map(r => [r.userId, r]));
    const salesMap = new Map(salesByUser.map(s => [s.sellerId, s]));

    const result = allUsers
      .filter(u => u.role === "SELLER" || u.role === "MANAGER")
      .map(u => {
        const rule = rulesMap.get(u.id);
        const sales = salesMap.get(u.id);
        const ratePercent = rule?.ratePercent ?? 5; // default 5%
        const targetMonthly = rule?.targetMonthly ?? 0;
        const totalRevenue = Number(sales?.totalRevenue ?? 0);
        const commissionAmount = totalRevenue * (ratePercent / 100);
        const achievementPercent = targetMonthly > 0 ? (totalRevenue / targetMonthly) * 100 : 0;

        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          branchId: u.branchId,
          branchName: u.branchName,
          isActive: u.isActive,
          ratePercent,
          targetMonthly,
          totalRevenue,
          orderCount: Number(sales?.orderCount ?? 0),
          commissionAmount,
          achievementPercent: Math.round(achievementPercent * 10) / 10,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const totalCommissionPayout = result.reduce((sum, r) => sum + r.commissionAmount, 0);

    return NextResponse.json({
      data: result,
      meta: {
        year,
        month,
        totalCommissionPayout,
        staffCount: result.length,
      },
    });
  } catch (err) {
    console.error("Commission GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role === "SELLER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { userId, ratePercent, targetMonthly } = body as {
      userId: string; ratePercent: number; targetMonthly?: number;
    };

    if (!userId || ratePercent == null) {
      return NextResponse.json({ error: "userId and ratePercent are required" }, { status: 400 });
    }

    // Upsert commission rule
    const existing = await db.select({ id: commissionRules.id })
      .from(commissionRules)
      .where(and(eq(commissionRules.userId, userId), eq(commissionRules.tenantId, auth.tenantId)));

    if (existing.length > 0) {
      const [updated] = await db.update(commissionRules)
        .set({
          ratePercent,
          targetMonthly: targetMonthly ?? 0,
          updatedAt: new Date(),
        })
        .where(and(eq(commissionRules.userId, userId), eq(commissionRules.tenantId, auth.tenantId)))
        .returning();
      return NextResponse.json(updated);
    } else {
      const [inserted] = await db.insert(commissionRules).values({
        tenantId: auth.tenantId,
        userId,
        ratePercent,
        targetMonthly: targetMonthly ?? 0,
      }).returning();
      return NextResponse.json(inserted, { status: 201 });
    }
  } catch (err) {
    console.error("Commission PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
