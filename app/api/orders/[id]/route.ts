// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  customers,
  users,
  branches,
  products,
  auditLogs,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission } from "@/lib/api-auth";
import { auditFromRequest } from "@/lib/audit";

// ─── GET /api/orders/[id] ─────────────────────────────────────────────────────
// Single order with full details: items (with product info), customer, seller, branch.
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/orders/[id]">
) {
  try {
    const auth = await requirePermission(req, "orders.view");
    const { tenantId } = auth;
    const { id } = await ctx.params;

    // Fetch the order header with joins
    const [orderRow] = await db
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
        shiftId: orders.shiftId,
        // Customer
        customerId: orders.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
        customerLoyaltyPoints: customers.loyaltyPoints,
        customerLoyaltyTier: customers.loyaltyTier,
        // Seller
        sellerId: orders.sellerId,
        sellerName: users.name,
        sellerEmail: users.email,
        // Branch
        branchId: orders.branchId,
        branchName: branches.name,
        branchCode: branches.code,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(users, eq(orders.sellerId, users.id))
      .innerJoin(branches, eq(orders.branchId, branches.id))
      .where(and(eq(orders.tenantId, tenantId), eq(orders.id, id)));

    if (!orderRow) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch order items with product info
    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        discount: orderItems.discount,
        productName: products.name,
        productCode: products.code,
        productCategory: products.category,
        productBrand: products.brand,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return NextResponse.json({
      data: {
        ...orderRow,
        items,
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("[GET /api/orders/[id]]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── PATCH /api/orders/[id] ───────────────────────────────────────────────────
// Update order status: PENDING → PAID, or any → CANCELLED.
// Body: { status: "PAID" | "CANCELLED" }
// Cancellation requires orders.cancel permission; other updates require orders.view.
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/orders/[id]">
) {
  try {
    // Peek at body to determine which permission to check
    const body = await req.json();
    const { status } = body as { status: "PAID" | "CANCELLED" };

    const requiredAction = status === "CANCELLED" ? "orders.cancel" : "orders.view";
    const auth = await requirePermission(req, requiredAction);
    const { tenantId, userId, name: userName } = auth;
    const { id } = await ctx.params;

    if (!status || !["PAID", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Allowed values: PAID, CANCELLED" },
        { status: 400 }
      );
    }

    // Verify order belongs to this tenant
    const [existing] = await db
      .select({ id: orders.id, status: orders.status, orderNumber: orders.orderNumber })
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.id, id)));

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate transition
    if (existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot update a cancelled order" },
        { status: 409 }
      );
    }
    if (existing.status === "PAID" && status === "PAID") {
      return NextResponse.json(
        { error: "Order is already paid" },
        { status: 409 }
      );
    }

    // Perform update
    const [updated] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.tenantId, tenantId), eq(orders.id, id)))
      .returning();

    // Write audit log
    const auditAction =
      status === "CANCELLED" ? "ORDER_CANCELLED" : "ORDER_UPDATED";
    await db.insert(auditLogs).values({
      tenantId,
      userId,
      userName,
      action: auditAction,
      target: id,
      detail: `Order ${existing.orderNumber} status changed from ${existing.status} to ${status}`,
    });

    auditFromRequest(req, {
      tenantId,
      userId,
      userName,
      action: status === "CANCELLED" ? "ORDER_CANCELLED" : "ORDER_UPDATED",
      target: `order:${id}`,
      detail: `สถานะเปลี่ยนเป็น ${body.status}`,
    }).catch(() => {}); // fire-and-forget

    return NextResponse.json({ data: updated });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("[PATCH /api/orders/[id]]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
