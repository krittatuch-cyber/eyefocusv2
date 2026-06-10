// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  orders, orderItems, customers, users, branches,
  products, stocks, jobTickets, appointments
} from "@/lib/db/schema";
import { eq, and, gte, lte, sum, count, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tenantId } = auth;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Run all queries in parallel
    const [
      revenueResult,
      todayRevenueResult,
      ordersCountResult,
      customersCountResult,
      newCustomersResult,
      lowStockResult,
      pendingJobsResult,
      pendingApptResult,
      recentOrdersRaw,
      topProductsRaw,
    ] = await Promise.all([
      // Monthly revenue
      db.select({ total: sum(orders.netAmount) })
        .from(orders)
        .where(and(
          eq(orders.tenantId, tenantId),
          eq(orders.status, "PAID"),
          gte(orders.createdAt, startOfMonth)
        )),

      // Today revenue
      db.select({ total: sum(orders.netAmount) })
        .from(orders)
        .where(and(
          eq(orders.tenantId, tenantId),
          eq(orders.status, "PAID"),
          gte(orders.createdAt, startOfToday)
        )),

      // Monthly order count
      db.select({ cnt: count() })
        .from(orders)
        .where(and(
          eq(orders.tenantId, tenantId),
          gte(orders.createdAt, startOfMonth)
        )),

      // Total customers
      db.select({ cnt: count() })
        .from(customers)
        .where(eq(customers.tenantId, tenantId)),

      // New customers this month
      db.select({ cnt: count() })
        .from(customers)
        .where(and(
          eq(customers.tenantId, tenantId),
          gte(customers.createdAt, startOfMonth)
        )),

      // Low stock items
      db.select({ cnt: count() })
        .from(stocks)
        .where(and(
          eq(stocks.tenantId, tenantId),
          sql`${stocks.quantity} <= ${stocks.minAlert}`
        )),

      // Pending jobs
      db.select({ cnt: count() })
        .from(jobTickets)
        .where(and(
          eq(jobTickets.tenantId, tenantId),
          sql`${jobTickets.status} IN ('PENDING', 'PREPARING')`
        )),

      // Pending appointments
      db.select({ cnt: count() })
        .from(appointments)
        .where(and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.status, "SCHEDULED")
        )),

      // Recent 5 orders
      db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        netAmount: orders.netAmount,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        createdAt: orders.createdAt,
        customerName: customers.name,
        sellerName: users.name,
        branchName: branches.name,
      })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .leftJoin(users, eq(orders.sellerId, users.id))
        .leftJoin(branches, eq(orders.branchId, branches.id))
        .where(eq(orders.tenantId, tenantId))
        .orderBy(desc(orders.createdAt))
        .limit(5),

      // Top 5 products this month by quantity sold
      db.select({
        productId: products.id,
        name: products.name,
        brand: products.brand,
        totalQuantity: sum(orderItems.quantity).as("totalQuantity"),
        totalRevenue: sum(sql`${orderItems.price} * ${orderItems.quantity} - COALESCE(${orderItems.discount}, 0)`).as("totalRevenue"),
      })
        .from(orderItems)
        .innerJoin(orders, and(
          eq(orderItems.orderId, orders.id),
          eq(orders.tenantId, tenantId),
          eq(orders.status, "PAID"),
          gte(orders.createdAt, startOfMonth)
        ))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .groupBy(products.id, products.name, products.brand)
        .orderBy(desc(sql`sum(${orderItems.quantity})`))
        .limit(5),
    ]);

    return NextResponse.json({
      totalRevenue: Number(revenueResult[0]?.total ?? 0),
      todayRevenue: Number(todayRevenueResult[0]?.total ?? 0),
      totalOrders: Number(ordersCountResult[0]?.cnt ?? 0),
      totalCustomers: Number(customersCountResult[0]?.cnt ?? 0),
      newCustomersThisMonth: Number(newCustomersResult[0]?.cnt ?? 0),
      lowStockItems: Number(lowStockResult[0]?.cnt ?? 0),
      pendingJobs: Number(pendingJobsResult[0]?.cnt ?? 0),
      pendingAppointments: Number(pendingApptResult[0]?.cnt ?? 0),
      recentOrders: recentOrdersRaw.map((o) => ({
        ...o,
        netAmount: Number(o.netAmount ?? 0),
        createdAt: o.createdAt?.toISOString() ?? null,
      })),
      topProducts: topProductsRaw.map((p) => ({
        ...p,
        totalQuantity: Number(p.totalQuantity ?? 0),
        totalRevenue: Number(p.totalRevenue ?? 0),
      })),
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
