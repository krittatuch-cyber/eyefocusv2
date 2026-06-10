// app/api/claims/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { claims, orders, customers, branches, auditLogs } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { auditFromRequest } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "20");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const offset = (page - 1) * limit;

  try {
    const conds: any[] = [eq(claims.tenantId, auth.tenantId)];
    if (status && status !== "ALL") conds.push(eq(claims.status, status as any));

    const [data, totalResult] = await Promise.all([
      db.select({
        id: claims.id,
        orderId: claims.orderId,
        orderNumber: orders.orderNumber,
        customerId: claims.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        branchId: claims.branchId,
        branchName: branches.name,
        reason: claims.reason,
        status: claims.status,
        resolution: claims.resolution,
        createdAt: claims.createdAt,
        updatedAt: claims.updatedAt,
      })
        .from(claims)
        .leftJoin(orders, eq(claims.orderId, orders.id))
        .leftJoin(customers, eq(claims.customerId, customers.id))
        .leftJoin(branches, eq(claims.branchId, branches.id))
        .where(and(...conds))
        .orderBy(desc(claims.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ cnt: count() }).from(claims).where(and(...conds)),
    ]);

    const total = Number(totalResult[0]?.cnt ?? 0);

    // Status counts
    const [pending, inReview, resolved] = await Promise.all([
      db.select({ cnt: count() }).from(claims).where(and(eq(claims.tenantId, auth.tenantId), eq(claims.status, "PENDING"))),
      db.select({ cnt: count() }).from(claims).where(and(eq(claims.tenantId, auth.tenantId), eq(claims.status, "IN_REVIEW"))),
      db.select({ cnt: count() }).from(claims).where(and(eq(claims.tenantId, auth.tenantId), eq(claims.status, "RESOLVED"))),
    ]);

    return NextResponse.json({
      data: data.map(c => ({
        ...c,
        createdAt: c.createdAt?.toISOString(),
        updatedAt: c.updatedAt?.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        pending: Number(pending[0]?.cnt ?? 0),
        inReview: Number(inReview[0]?.cnt ?? 0),
        resolved: Number(resolved[0]?.cnt ?? 0),
      },
    });
  } catch (err) {
    console.error("Claims GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { orderId, customerId, branchId, reason } = body;

    if (!reason || !orderId || !branchId) {
      return NextResponse.json({ error: "orderId, branchId, reason are required" }, { status: 400 });
    }

    const [claim] = await db.insert(claims).values({
      tenantId: auth.tenantId,
      orderId,
      branchId,
      customerId: customerId || null,
      reason,
      status: "PENDING",
    }).returning();

    await db.insert(auditLogs).values({
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name || auth.email,
      action: "CLAIM_CREATED",
      target: claim.id,
      detail: `สร้างเคลมใหม่: ${reason.slice(0, 50)}`,
    });

    auditFromRequest(req, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "CLAIM_CREATED",
      target: `claim:${claim.id}`,
      detail: `เปิดเคลม: ${body.reason}`,
    }).catch(() => {}); // fire-and-forget

    return NextResponse.json({
      ...claim,
      createdAt: claim.createdAt?.toISOString(),
    }, { status: 201 });
  } catch (err) {
    console.error("Claims POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, status, resolution } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const [updated] = await db.update(claims)
      .set({ status, resolution: resolution || null, updatedAt: new Date() })
      .where(and(eq(claims.id, id), eq(claims.tenantId, auth.tenantId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

    await db.insert(auditLogs).values({
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name || auth.email,
      action: "CLAIM_UPDATED",
      target: id,
      detail: `อัพเดตสถานะเคลม → ${status}`,
    });

    auditFromRequest(req, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "CLAIM_UPDATED",
      target: `claim:${id}`,
      detail: `อัปเดตสถานะเคลม → ${body.status}`,
    }).catch(() => {}); // fire-and-forget

    return NextResponse.json({ ...updated, createdAt: updated.createdAt?.toISOString() });
  } catch (err) {
    console.error("Claims PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
