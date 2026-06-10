// app/api/job-tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { jobTickets, orders, customers, auditLogs } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "20");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const offset = (page - 1) * limit;

  try {
    const conds: any[] = [eq(jobTickets.tenantId, auth.tenantId)];
    if (status && status !== "ALL") conds.push(eq(jobTickets.status, status as any));

    const [data, totalResult] = await Promise.all([
      db.select({
        id: jobTickets.id,
        orderId: jobTickets.orderId,
        orderNumber: orders.orderNumber,
        customerName: customers.name,
        labId: jobTickets.labId,
        labName: jobTickets.labName,
        status: jobTickets.status,
        lensType: jobTickets.lensType,
        lensDetails: jobTickets.lensDetails,
        notes: jobTickets.notes,
        targetDate: jobTickets.targetDate,
        createdAt: jobTickets.createdAt,
        updatedAt: jobTickets.updatedAt,
      })
        .from(jobTickets)
        .leftJoin(orders, eq(jobTickets.orderId, orders.id))
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(and(...conds))
        .orderBy(desc(jobTickets.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ cnt: count() }).from(jobTickets).where(and(...conds)),
    ]);

    const total = Number(totalResult[0]?.cnt ?? 0);

    // Status counts
    const statusCounts = await db
      .select({ status: jobTickets.status, cnt: count() })
      .from(jobTickets)
      .where(eq(jobTickets.tenantId, auth.tenantId))
      .groupBy(jobTickets.status);

    const summary = Object.fromEntries(statusCounts.map(s => [s.status, Number(s.cnt)]));

    return NextResponse.json({
      data: data.map(j => ({
        ...j,
        targetDate: j.targetDate instanceof Date
          ? j.targetDate.toISOString().split("T")[0]
          : j.targetDate ?? null,
        createdAt: j.createdAt?.toISOString(),
        updatedAt: j.updatedAt?.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary,
    });
  } catch (err) {
    console.error("Job tickets GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { orderId, labId, labName, targetDate, lensType, lensDetails, notes } = body;

    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

    const [ticket] = await db.insert(jobTickets).values({
      tenantId: auth.tenantId,
      orderId,
      labId: labId || null,
      labName: labName || null,
      status: "PENDING",
      lensType: lensType || null,
      lensDetails: lensDetails || null,
      targetDate: targetDate ? new Date(targetDate) : null,
      notes: notes || null,
    }).returning();

    return NextResponse.json({
      ...ticket,
      targetDate: ticket.targetDate instanceof Date
        ? ticket.targetDate.toISOString().split("T")[0]
        : null,
      createdAt: ticket.createdAt?.toISOString(),
    }, { status: 201 });
  } catch (err) {
    console.error("Job tickets POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, status, notes, targetDate, lensType } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (targetDate) updateData.targetDate = new Date(targetDate);
    if (lensType) updateData.lensType = lensType;

    const [updated] = await db.update(jobTickets)
      .set(updateData)
      .where(and(eq(jobTickets.id, id), eq(jobTickets.tenantId, auth.tenantId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Job ticket not found" }, { status: 404 });

    await db.insert(auditLogs).values({
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name || auth.email,
      action: "PRODUCT_UPDATED",
      target: id,
      detail: `อัพเดตสถานะงาน Lab → ${status || "updated"}`,
    });

    return NextResponse.json({
      ...updated,
      targetDate: updated.targetDate instanceof Date
        ? updated.targetDate.toISOString().split("T")[0]
        : null,
      createdAt: updated.createdAt?.toISOString(),
    });
  } catch (err) {
    console.error("Job tickets PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
