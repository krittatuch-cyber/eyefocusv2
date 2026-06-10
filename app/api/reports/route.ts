// app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, products, branches, users } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getAuthContext } from "@/lib/api-auth";

// ─── GET /api/reports ─────────────────────────────────────────────────────────
// Sales reports for a date range, optionally filtered by branch.
// Query params: startDate (required), endDate (required), branchId?
//
// Returns:
//   revenueByDay        — [{date, revenue, orderCount}]
//   revenueByBranch     — [{branchId, branchName, revenue, orderCount}]
//   revenueByPaymentMethod — [{method, revenue, count}]
//   revenueByCategory   — [{category, revenue}]
//   topProducts         — [{productId, name, revenue, quantity}] top 10
//   staffLeaderboard    — [{userId, name, revenue, orderCount}]
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { tenantId } = auth;

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const branchId = searchParams.get("branchId");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required query parameters" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Base conditions shared across all queries (only PAID orders count as revenue)
    const baseConditions = [
      eq(orders.tenantId, tenantId),
      eq(orders.status, "PAID"),
      gte(orders.createdAt, start),
      lte(orders.createdAt, end),
    ];
    if (branchId) {
      baseConditions.push(eq(orders.branchId, branchId));
    }

    // ── 1. Revenue by Day ──────────────────────────────────────────────────
    const revenueByDay = await db
      .select({
        date: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
        revenue: sql<number>`coalesce(sum(${orders.netAmount}), 0)::float`,
        orderCount: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(and(...baseConditions))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

    // ── 2. Revenue by Branch ───────────────────────────────────────────────
    const revenueByBranch = await db
      .select({
        branchId: orders.branchId,
        branchName: branches.name,
        revenue: sql<number>`coalesce(sum(${orders.netAmount}), 0)::float`,
        orderCount: sql<number>`count(${orders.id})::int`,
      })
      .from(orders)
      .innerJoin(branches, eq(orders.branchId, branches.id))
      .where(and(...baseConditions))
      .groupBy(orders.branchId, branches.name)
      .orderBy(sql`sum(${orders.netAmount}) desc`);

    // ── 3. Revenue by Payment Method ───────────────────────────────────────
    const revenueByPaymentMethod = await db
      .select({
        method: orders.paymentMethod,
        revenue: sql<number>`coalesce(sum(${orders.netAmount}), 0)::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(and(...baseConditions))
      .groupBy(orders.paymentMethod)
      .orderBy(sql`sum(${orders.netAmount}) desc`);

    // ── 4. Revenue by Category ─────────────────────────────────────────────
    // Join orderItems → products to get category, then join with orders for filter
    const revenueByCategory = await db
      .select({
        category: products.category,
        revenue: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity} - ${orderItems.discount}), 0)::float`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(and(...baseConditions))
      .groupBy(products.category)
      .orderBy(
        sql`sum(${orderItems.price} * ${orderItems.quantity} - ${orderItems.discount}) desc`
      );

    // ── 5. Top 10 Products ─────────────────────────────────────────────────
    const topProducts = await db
      .select({
        productId: products.id,
        name: products.name,
        revenue: sql<number>`coalesce(sum(${orderItems.price} * ${orderItems.quantity} - ${orderItems.discount}), 0)::float`,
        quantity: sql<number>`sum(${orderItems.quantity})::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(and(...baseConditions))
      .groupBy(products.id, products.name)
      .orderBy(
        sql`sum(${orderItems.price} * ${orderItems.quantity} - ${orderItems.discount}) desc`
      )
      .limit(10);

    // ── 6. Staff Leaderboard ───────────────────────────────────────────────
    const staffLeaderboard = await db
      .select({
        userId: orders.sellerId,
        name: users.name,
        revenue: sql<number>`coalesce(sum(${orders.netAmount}), 0)::float`,
        orderCount: sql<number>`count(${orders.id})::int`,
      })
      .from(orders)
      .innerJoin(users, eq(orders.sellerId, users.id))
      .where(and(...baseConditions))
      .groupBy(orders.sellerId, users.name)
      .orderBy(sql`sum(${orders.netAmount}) desc`);

    return NextResponse.json({
      data: {
        revenueByDay,
        revenueByBranch,
        revenueByPaymentMethod,
        revenueByCategory,
        topProducts,
        staffLeaderboard,
      },
    });
  } catch (error) {
    console.error("[GET /api/reports]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
