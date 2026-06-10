// app/api/shifts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { shifts, auditLogs } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auditFromRequest } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "reports.shiftSummary");

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || auth.userId;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "10");

    const conditions: any[] = [eq(shifts.tenantId, auth.tenantId)];
    if (userId) conditions.push(eq(shifts.userId, userId));
    if (status) conditions.push(eq(shifts.status, status as "OPEN" | "CLOSED"));

    const data = await db.select()
      .from(shifts)
      .where(and(...conditions))
      .orderBy(desc(shifts.openedAt))
      .limit(limit);

    return NextResponse.json(data.map(s => ({
      ...s,
      openedAt: s.openedAt?.toISOString(),
      closedAt: s.closedAt?.toISOString(),
    })));
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("Shifts GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "shifts.open");

    const body = await req.json();
    const { action, branchId, startingCash, endingCash } = body;

    if (action === "open") {
      // Check no active shift exists for this user
      const existing = await db.select({ id: shifts.id })
        .from(shifts)
        .where(and(
          eq(shifts.tenantId, auth.tenantId),
          eq(shifts.userId, auth.userId),
          eq(shifts.status, "OPEN")
        ))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({ error: "มีกะที่เปิดอยู่แล้ว", shiftId: existing[0].id }, { status: 409 });
      }

      const [shift] = await db.insert(shifts).values({
        tenantId: auth.tenantId,
        userId: auth.userId,
        branchId: branchId || auth.branchId || "00000000-0000-0000-0000-000000000000",
        status: "OPEN",
        startingCash: startingCash || 0,
        openedAt: new Date(),
      }).returning();

      await db.insert(auditLogs).values({
        tenantId: auth.tenantId,
        userId: auth.userId,
        userName: auth.name || auth.email,
        action: "SHIFT_OPEN",
        target: shift.id,
        detail: `เปิดกะ เงินเริ่มต้น ฿${(startingCash || 0).toLocaleString()}`,
      });

      auditFromRequest(req, {
        tenantId: auth.tenantId,
        userId: auth.userId,
        userName: auth.name,
        action: "SHIFT_OPEN",
        target: `shift:${shift.id}`,
        detail: `เปิดกะ สาขา ${body.branchId}`,
      }).catch(() => {}); // fire-and-forget

      return NextResponse.json({ ...shift, openedAt: shift.openedAt?.toISOString() }, { status: 201 });
    }

    if (action === "close") {
      const { shiftId } = body;
      if (!shiftId) return NextResponse.json({ error: "shiftId required" }, { status: 400 });

      const [closed] = await db.update(shifts)
        .set({
          status: "CLOSED",
          actualCash: endingCash || 0,
          closedAt: new Date(),
        })
        .where(and(eq(shifts.id, shiftId), eq(shifts.tenantId, auth.tenantId)))
        .returning();

      if (!closed) return NextResponse.json({ error: "Shift not found" }, { status: 404 });

      await db.insert(auditLogs).values({
        tenantId: auth.tenantId,
        userId: auth.userId,
        userName: auth.name || auth.email,
        action: "SHIFT_CLOSE",
        target: shiftId,
        detail: `ปิดกะ เงินสิ้นสุด ฿${(endingCash || 0).toLocaleString()}`,
      });

      auditFromRequest(req, {
        tenantId: auth.tenantId,
        userId: auth.userId,
        userName: auth.name,
        action: "SHIFT_CLOSE",
        target: `shift:${shiftId}`,
        detail: `ปิดกะ`,
      }).catch(() => {}); // fire-and-forget

      return NextResponse.json({ ...closed, openedAt: closed.openedAt?.toISOString(), closedAt: closed.closedAt?.toISOString() });
    }

    return NextResponse.json({ error: "Invalid action. Use 'open' or 'close'" }, { status: 400 });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("Shifts POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
