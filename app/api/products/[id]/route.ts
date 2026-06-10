// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { products, stocks, branches } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auditFromRequest } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requirePermission(req, "products.view");
    const { id } = await ctx.params;

    const [product] = await db.select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.tenantId, auth.tenantId)));

    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const stocksData = await db.select({
      id: stocks.id,
      branchId: stocks.branchId,
      branchName: branches.name,
      quantity: stocks.quantity,
      minAlert: stocks.minAlert,
    })
      .from(stocks)
      .leftJoin(branches, eq(stocks.branchId, branches.id))
      .where(eq(stocks.productId, id));

    return NextResponse.json({ ...product, stocks: stocksData });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requirePermission(req, "products.edit");
    const { id } = await ctx.params;

    const body = await req.json();
    const { name, brand, model, price, cost, isActive, imageUrl } = body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (brand !== undefined) updates.brand = brand || null;
    if (model !== undefined) updates.model = model || null;
    if (price !== undefined) updates.price = price;
    if (cost !== undefined) updates.cost = cost;
    if (isActive !== undefined) updates.isActive = isActive;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl || null;

    const [updated] = await db.update(products)
      .set(updates as any)
      .where(and(eq(products.id, id), eq(products.tenantId, auth.tenantId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    auditFromRequest(req, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "PRODUCT_UPDATED",
      target: `product:${id}`,
      detail: `อัปเดตสินค้า ${updated.name}`,
    }).catch(() => {}); // fire-and-forget

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requirePermission(req, "products.delete");
    const { id } = await ctx.params;

    // Soft-delete by setting isActive = false
    const [updated] = await db.update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, auth.tenantId)))
      .returning({ id: products.id });

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    auditFromRequest(req, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "PRODUCT_DELETED",
      target: `product:${id}`,
      detail: `ลบสินค้า`,
    }).catch(() => {}); // fire-and-forget

    return NextResponse.json({ success: true, id: updated.id });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
