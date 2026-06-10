// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { auditFromRequest } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "products.view");
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const whereClause = and(
      eq(products.tenantId, auth.tenantId),
      activeOnly ? eq(products.isActive, true) : undefined,
      category ? eq(products.category, category as any) : undefined
    );
    const result = await db
      .select({
        id: products.id,
        tenantId: products.tenantId,
        code: products.code,
        name: products.name,
        category: products.category,
        brand: products.brand,
        model: products.model,
        price: products.price,
        cost: products.cost,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // imageUrl excluded from list — fetched via GET /api/products/[id] in edit form
      })
      .from(products)
      .where(whereClause)
      .orderBy(asc(products.category), asc(products.name));
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "products.create");
    const body = await req.json();
    const { code, name, category, brand, model, price, cost, imageUrl } = body as {
      code: string; name: string; category: string;
      brand?: string; model?: string; price: number; cost: number; imageUrl?: string;
    };
    if (!code || !name || !category || price == null || cost == null) {
      return NextResponse.json({ error: "code, name, category, price, cost are required" }, { status: 400 });
    }
    const [product] = await db.insert(products).values({
      tenantId: auth.tenantId,
      code,
      name,
      category: category as any,
      brand: brand || null,
      model: model || null,
      price,
      cost,
      imageUrl: imageUrl || null,
      isActive: true,
    }).returning();
    auditFromRequest(req, {
      tenantId: auth.tenantId, userId: auth.userId, userName: auth.name,
      action: "PRODUCT_CREATED", target: `product:${product.id}`, detail: `สร้างสินค้า ${name}`,
    }).catch(() => {});
    return NextResponse.json(product, { status: 201 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    if (e?.message?.includes("unique")) return NextResponse.json({ error: "Product code already exists" }, { status: 409 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
