// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  customers,
  users,
  branches,
  stocks,
  auditLogs,
} from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { requirePermission } from "@/lib/api-auth";
import { auditFromRequest } from "@/lib/audit";

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// List orders for the authenticated tenant with optional filters.
// Query params: status?, branchId?, startDate?, endDate?, sellerId?
export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "orders.view");
    const { tenantId } = auth;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sellerId = searchParams.get("sellerId");

    // Build WHERE conditions
    const conditions = [eq(orders.tenantId, tenantId)];
    if (status) {
      conditions.push(eq(orders.status, status as "PENDING" | "PAID" | "CANCELLED"));
    }
    if (branchId) {
      conditions.push(eq(orders.branchId, branchId));
    }
    if (sellerId) {
      conditions.push(eq(orders.sellerId, sellerId));
    }
    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate)));
    }
    if (endDate) {
      // Include the full end day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.createdAt, end));
    }

    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        totalAmount: orders.totalAmount,
        discountAmount: orders.discountAmount,
        netAmount: orders.netAmount,
        paidAmount: orders.paidAmount,
        paymentMethod: orders.paymentMethod,
        status: orders.status,
        isETaxRequested: orders.isETaxRequested,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        // Customer
        customerId: orders.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        // Seller
        sellerId: orders.sellerId,
        sellerName: users.name,
        // Branch
        branchId: orders.branchId,
        branchName: branches.name,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(users, eq(orders.sellerId, users.id))
      .innerJoin(branches, eq(orders.branchId, branches.id))
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({ data: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("[GET /api/orders]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Create a new order with items, deduct stock, award loyalty points, write audit log.
// Body: { customerId?, branchId, shiftId?, items, paymentMethod,
//         totalAmount, discountAmount, netAmount, paidAmount,
//         isETaxRequested, notes? }
export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "orders.create");
    const { tenantId, userId, name: userName } = auth;

    const body = await req.json();
    const {
      customerId,
      branchId,
      shiftId,
      items,
      paymentMethod,
      totalAmount,
      discountAmount = 0,
      netAmount,
      paidAmount,
      isETaxRequested = false,
      notes,
    } = body as {
      customerId?: string;
      branchId: string;
      shiftId?: string;
      items: Array<{
        productId: string;
        quantity: number;
        price: number;
        discount?: number;
      }>;
      paymentMethod: "CASH" | "QR_PROMPTPAY" | "CREDIT_CARD" | "INSTALLMENT";
      totalAmount: number;
      discountAmount?: number;
      netAmount: number;
      paidAmount: number;
      isETaxRequested?: boolean;
      notes?: string;
    };

    // Validate required fields
    if (!branchId || !items?.length || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields: branchId, items, paymentMethod" },
        { status: 400 }
      );
    }

    // ── Generate orderNumber: EF-YYYYMMDD-XXXX ─────────────────────────────
    const now = new Date();
    const datePart = now
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, ""); // e.g. "20260607"

    const todayStart = new Date(now.toISOString().slice(0, 10) + "T00:00:00.000Z");
    const todayEnd = new Date(now.toISOString().slice(0, 10) + "T23:59:59.999Z");

    const [{ count: todayCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          gte(orders.createdAt, todayStart),
          lte(orders.createdAt, todayEnd)
        )
      );

    const sequence = String((todayCount ?? 0) + 1).padStart(4, "0");
    const orderNumber = `EF-${datePart}-${sequence}`;

    // ── Insert order ───────────────────────────────────────────────────────
    const [newOrder] = await db
      .insert(orders)
      .values({
        tenantId,
        orderNumber,
        customerId: customerId ?? null,
        sellerId: userId,
        branchId,
        shiftId: shiftId ?? null,
        totalAmount,
        discountAmount,
        netAmount,
        paidAmount,
        paymentMethod,
        status: "PENDING",
        isETaxRequested,
        notes: notes ?? null,
      })
      .returning();

    // ── Insert order items & deduct stock ──────────────────────────────────
    for (const item of items) {
      const { productId, quantity, price, discount = 0 } = item;

      await db.insert(orderItems).values({
        tenantId,
        orderId: newOrder.id,
        productId,
        quantity,
        price,
        discount,
      });

      // Deduct stock for matching productId + branchId
      await db
        .update(stocks)
        .set({
          quantity: sql`${stocks.quantity} - ${quantity}`,
        })
        .where(
          and(
            eq(stocks.tenantId, tenantId),
            eq(stocks.productId, productId),
            eq(stocks.branchId, branchId)
          )
        );
    }

    // ── Award loyalty points (1 pt per 100 THB of netAmount) ───────────────
    if (customerId) {
      const pointsToAdd = Math.floor(netAmount / 100);
      if (pointsToAdd > 0) {
        await db
          .update(customers)
          .set({
            loyaltyPoints: sql`${customers.loyaltyPoints} + ${pointsToAdd}`,
            updatedAt: now,
          })
          .where(
            and(
              eq(customers.tenantId, tenantId),
              eq(customers.id, customerId)
            )
          );
      }
    }

    // ── Write audit log ────────────────────────────────────────────────────
    await db.insert(auditLogs).values({
      tenantId,
      userId,
      userName,
      action: "ORDER_CREATED",
      target: newOrder.id,
      detail: `Order ${orderNumber} created. Net: ${netAmount} THB`,
    });

    auditFromRequest(req, {
      tenantId,
      userId,
      userName,
      action: "ORDER_CREATED",
      target: `order:${newOrder.orderNumber || newOrder.id}`,
      detail: `สร้างออเดอร์ ฿${body.netAmount}`,
    }).catch(() => {}); // fire-and-forget

    return NextResponse.json({ data: newOrder }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("[POST /api/orders]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
