// app/api/stocks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { stocks, products, branches } from "@/lib/db/schema";
import { eq, and, sql, lte } from "drizzle-orm";
import { auditFromRequest } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "products.view");

    const { searchParams } = new URL(req.url);
    const lowStockOnly = searchParams.get("lowStock") === "true";
    const branchId = searchParams.get("branchId") || "";

    const whereClause = and(
      eq(stocks.tenantId, auth.tenantId),
      branchId ? eq(stocks.branchId, branchId) : undefined,
      lowStockOnly ? lte(stocks.quantity, stocks.minAlert) : undefined
    );

    const result = await db.select({
      id: stocks.id,
      productId: stocks.productId,
      productCode: products.code,
      productName: products.name,
      productCategory: products.category,
      productBrand: products.brand,
      branchId: stocks.branchId,
      branchName: branches.name,
      quantity: stocks.quantity,
      minAlert: stocks.minAlert,
      isLowStock: sql<boolean>`${stocks.quantity} <= ${stocks.minAlert}`,
    })
      .from(stocks)
      .innerJoin(products, eq(stocks.productId, products.id))
      .innerJoin(branches, eq(stocks.branchId, branches.id))
      .where(whereClause)
      .orderBy(products.category, products.name, branches.name);

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("Stocks GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "stocks.adjust");

    const body = await req.json();
    const { productId, branchId, newQuantity, minAlert } = body as {
      productId: string; branchId: string; newQuantity?: number; minAlert?: number;
    };

    if (!productId || !branchId) {
      return NextResponse.json({ error: "productId and branchId are required" }, { status: 400 });
    }

    // Upsert stock record
    const [existing] = await db.select({ id: stocks.id })
      .from(stocks)
      .where(and(eq(stocks.productId, productId), eq(stocks.branchId, branchId)));

    if (existing) {
      const [updated] = await db.update(stocks)
        .set({
          ...(newQuantity != null && { quantity: newQuantity }),
          ...(minAlert != null && { minAlert }),
        })
        .where(and(eq(stocks.productId, productId), eq(stocks.branchId, branchId)))
        .returning();

      auditFromRequest(req, {
        tenantId: auth.tenantId,
        userId: auth.userId,
        userName: auth.name,
        action: "STOCK_ADJUSTED",
        target: `stock:${body.productId}`,
        detail: `ปรับสต็อก qty=${body.quantity}`,
      }).catch(() => {}); // fire-and-forget

      return NextResponse.json(updated);
    } else {
      const [inserted] = await db.insert(stocks).values({
        tenantId: auth.tenantId,
        productId,
        branchId,
        quantity: newQuantity ?? 0,
        minAlert: minAlert ?? 5,
      }).returning();

      auditFromRequest(req, {
        tenantId: auth.tenantId,
        userId: auth.userId,
        userName: auth.name,
        action: "STOCK_ADJUSTED",
        target: `stock:${body.productId}`,
        detail: `ปรับสต็อก qty=${body.quantity}`,
      }).catch(() => {}); // fire-and-forget

      return NextResponse.json(inserted, { status: 201 });
    }
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("Stocks PATCH error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
