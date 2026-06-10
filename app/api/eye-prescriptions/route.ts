// app/api/eye-prescriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { eyePrescriptions, auditLogs, customers } from "@/lib/db/schema";
import { eq, and, desc, ilike } from "drizzle-orm";
import { auditFromRequest } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "prescriptions.view");

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    // ── All prescriptions (for /seller/eyesight listing page) ──────────────
    if (!customerId) {
      const search = searchParams.get("search") || "";
      const limit = parseInt(searchParams.get("limit") || "50");

      let data;
      if (search) {
        data = await db
          .select({
            id: eyePrescriptions.id,
            customerId: eyePrescriptions.customerId,
            customerName: customers.name,
            customerPhone: customers.phone,
            customerBirthDate: customers.birthDate,
            recordedAt: eyePrescriptions.recordedAt,
            recorderName: eyePrescriptions.recorderName,
            sphR: eyePrescriptions.sphR, cylR: eyePrescriptions.cylR, axisR: eyePrescriptions.axisR,
            sphL: eyePrescriptions.sphL, cylL: eyePrescriptions.cylL, axisL: eyePrescriptions.axisL,
            vaR: eyePrescriptions.vaR, vaL: eyePrescriptions.vaL,
            pdR: eyePrescriptions.pdR, pdL: eyePrescriptions.pdL,
            addR: eyePrescriptions.addR, addL: eyePrescriptions.addL,
            frameType: eyePrescriptions.frameType,
            notes: eyePrescriptions.notes,
          })
          .from(eyePrescriptions)
          .leftJoin(customers, eq(eyePrescriptions.customerId, customers.id))
          .where(and(
            eq(eyePrescriptions.tenantId, auth.tenantId),
            ilike(customers.name, `%${search}%`)
          ))
          .orderBy(desc(eyePrescriptions.recordedAt))
          .limit(limit);
      } else {
        data = await db
          .select({
            id: eyePrescriptions.id,
            customerId: eyePrescriptions.customerId,
            customerName: customers.name,
            customerPhone: customers.phone,
            customerBirthDate: customers.birthDate,
            recordedAt: eyePrescriptions.recordedAt,
            recorderName: eyePrescriptions.recorderName,
            sphR: eyePrescriptions.sphR, cylR: eyePrescriptions.cylR, axisR: eyePrescriptions.axisR,
            sphL: eyePrescriptions.sphL, cylL: eyePrescriptions.cylL, axisL: eyePrescriptions.axisL,
            vaR: eyePrescriptions.vaR, vaL: eyePrescriptions.vaL,
            pdR: eyePrescriptions.pdR, pdL: eyePrescriptions.pdL,
            addR: eyePrescriptions.addR, addL: eyePrescriptions.addL,
            frameType: eyePrescriptions.frameType,
            notes: eyePrescriptions.notes,
          })
          .from(eyePrescriptions)
          .leftJoin(customers, eq(eyePrescriptions.customerId, customers.id))
          .where(eq(eyePrescriptions.tenantId, auth.tenantId))
          .orderBy(desc(eyePrescriptions.recordedAt))
          .limit(limit);
      }

      return NextResponse.json({
        data: data.map(p => ({
          ...p,
          recordedAt: p.recordedAt?.toISOString() ?? null,
          customerBirthDate: (p.customerBirthDate as Date | null)?.toISOString() ?? null,
        })),
      });
    }

    // ── Single customer prescriptions ───────────────────────────────────────
    const data = await db.select()
      .from(eyePrescriptions)
      .where(and(
        eq(eyePrescriptions.customerId, customerId),
        eq(eyePrescriptions.tenantId, auth.tenantId)
      ))
      .orderBy(desc(eyePrescriptions.recordedAt));

    return NextResponse.json({
      data: data.map(p => ({
        ...p,
        recordedAt: p.recordedAt?.toISOString(),
      })),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("Prescriptions GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "prescriptions.create");

    const body = await req.json();
    const {
      customerId, recordedAt,
      // OD (Right Eye)
      sphR, cylR, axisR, pdR, addR, vaR,
      // OS (Left Eye)
      sphL, cylL, axisL, pdL, addL, vaL,
      // Additional
      oldGlassesNotes, medicalHistory, frameType, notes,
    } = body;

    if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });

    const [rx] = await db.insert(eyePrescriptions).values({
      tenantId: auth.tenantId,
      customerId,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      recorderId: auth.userId,
      recorderName: (body.recorderName && body.recorderName.trim()) ? body.recorderName.trim() : auth.name,
      // OD
      sphR: sphR !== undefined ? Number(sphR) : null,
      cylR: cylR !== undefined ? Number(cylR) : null,
      axisR: axisR !== undefined ? Number(axisR) : null,
      pdR: pdR !== undefined ? Number(pdR) : null,
      addR: addR !== undefined ? Number(addR) : null,
      vaR: vaR || null,
      // OS
      sphL: sphL !== undefined ? Number(sphL) : null,
      cylL: cylL !== undefined ? Number(cylL) : null,
      axisL: axisL !== undefined ? Number(axisL) : null,
      pdL: pdL !== undefined ? Number(pdL) : null,
      addL: addL !== undefined ? Number(addL) : null,
      vaL: vaL || null,
      // Extra
      oldGlassesNotes: oldGlassesNotes || null,
      medicalHistory: medicalHistory || null,
      frameType: frameType || null,
      notes: notes || null,
    }).returning();

    await db.insert(auditLogs).values({
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "CUSTOMER_UPDATED",
      target: customerId,
      detail: `บันทึกค่าสายตา OD: ${sphR ?? "-"}/${cylR ?? "-"}/${axisR ?? "-"} OS: ${sphL ?? "-"}/${cylL ?? "-"}/${axisL ?? "-"}`,
    });

    auditFromRequest(req, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "PRESCRIPTION_CREATED",
      target: `prescription:${rx.id}`,
      detail: `บันทึกค่าสายตาลูกค้า`,
    }).catch(() => {}); // fire-and-forget

    return NextResponse.json({
      ...rx,
      recordedAt: rx.recordedAt?.toISOString(),
    }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("Prescriptions POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "prescriptions.edit");

    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updateFields: Record<string, unknown> = {};
    const numericFields = ["sphR","cylR","axisR","pdR","addR","sphL","cylL","axisL","pdL","addL"] as const;
    for (const f of numericFields) {
      if (fields[f] !== undefined) updateFields[f] = fields[f] !== null ? Number(fields[f]) : null;
    }
    const textFields = ["vaR","vaL","oldGlassesNotes","medicalHistory","frameType","notes","customerId","frameType"] as const;
    for (const f of textFields) {
      if (fields[f] !== undefined) updateFields[f] = fields[f] || null;
    }
    if (fields.recordedAt !== undefined) updateFields.recordedAt = new Date(fields.recordedAt);

    const [updated] = await db.update(eyePrescriptions)
      .set(updateFields)
      .where(and(eq(eyePrescriptions.id, id), eq(eyePrescriptions.tenantId, auth.tenantId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    auditFromRequest(req, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "PRESCRIPTION_UPDATED",
      target: `prescription:${id}`,
      detail: `อัปเดตค่าสายตา`,
    }).catch(() => {}); // fire-and-forget

    return NextResponse.json({
      ...updated,
      recordedAt: updated.recordedAt?.toISOString(),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("Prescriptions PATCH error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
