// app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { appointments, customers, users, branches } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, count, like, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const branchId = searchParams.get("branchId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const conds: any[] = [eq(appointments.tenantId, auth.tenantId)];
    if (status) conds.push(eq(appointments.status, status as any));
    if (branchId) conds.push(eq(appointments.branchId, branchId));
    if (startDate) conds.push(gte(appointments.scheduledAt, new Date(startDate)));
    if (endDate) conds.push(lte(appointments.scheduledAt, new Date(endDate + "T23:59:59")));

    const data = await db
      .select({
        id: appointments.id,
        appointmentNumber: appointments.appointmentNumber,
        customerId: appointments.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        sellerId: appointments.sellerId,
        staffName: users.name,
        branchId: appointments.branchId,
        branchName: branches.name,
        scheduledAt: appointments.scheduledAt,
        purpose: appointments.purpose,
        totalAmount: appointments.totalAmount,
        depositAmount: appointments.depositAmount,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .leftJoin(customers, eq(appointments.customerId, customers.id))
      .leftJoin(users, eq(appointments.sellerId, users.id))
      .leftJoin(branches, eq(appointments.branchId, branches.id))
      .where(and(...conds))
      .orderBy(desc(appointments.scheduledAt))
      .limit(limit);

    const [total] = await db.select({ cnt: count() })
      .from(appointments)
      .where(and(...conds));

    return NextResponse.json({
      data: data.map(a => ({
        ...a,
        scheduledAt: a.scheduledAt?.toISOString(),
        createdAt: a.createdAt?.toISOString(),
      })),
      total: Number(total?.cnt ?? 0),
    });
  } catch (err) {
    console.error("Appointments GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { customerId, branchId, sellerId, scheduledAt, purpose, notes, totalAmount, depositAmount } = body;

    if (!scheduledAt || !branchId || !customerId) {
      return NextResponse.json({ error: "scheduledAt, branchId, customerId are required" }, { status: 400 });
    }

    // Generate appointment number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const apptNumber = `APT-${dateStr}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const [appt] = await db.insert(appointments).values({
      tenantId: auth.tenantId,
      appointmentNumber: apptNumber,
      customerId,
      branchId,
      sellerId: sellerId || auth.userId,
      scheduledAt: new Date(scheduledAt),
      purpose: purpose || "ตรวจวัดสายตา",
      totalAmount: totalAmount || 0,
      depositAmount: depositAmount || 0,
      status: "SCHEDULED",
      notes: notes || null,
    }).returning();

    return NextResponse.json({
      ...appt,
      scheduledAt: appt.scheduledAt?.toISOString(),
      createdAt: appt.createdAt?.toISOString(),
    }, { status: 201 });
  } catch (err) {
    console.error("Appointments POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, status, notes, scheduledAt, purpose } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
    if (purpose) updateData.purpose = purpose;

    const [updated] = await db.update(appointments)
      .set(updateData)
      .where(and(eq(appointments.id, id), eq(appointments.tenantId, auth.tenantId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...updated, scheduledAt: updated.scheduledAt?.toISOString() });
  } catch (err) {
    console.error("Appointments PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
