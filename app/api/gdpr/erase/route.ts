// app/api/gdpr/erase/route.ts — PDPA: Right to erasure (Article 17)
// POST /api/gdpr/erase — anonymize/erase customer PII data
import { NextRequest, NextResponse } from "next/server";
import { requireManager } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auditFromRequest } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireManager(req);
    const body = await req.json();
    const { customerId } = body as { customerId: string };

    if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });

    // Verify customer belongs to tenant
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.tenantId, auth.tenantId)));

    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // PDPA-compliant anonymization:
    // - Replace PII with anonymized placeholders
    // - Preserve non-PII data for business records (orders, etc.)
    await db.update(customers).set({
      name: "[ลบข้อมูลแล้ว]",
      nameEn: "ERASED",
      phone: "0000000000",
      email: null,
      lineId: null,
      address: null,
      taxId: null,
      medicalHistory: null,
      notes: "[ข้อมูลถูกลบตามสิทธิ์ PDPA]",
      photoUrl: null,
      birthDate: null,
      // Mark as erased
      dataErasureRequestedAt: new Date(),
    } as Record<string, unknown>).where(eq(customers.id, customerId));

    // Audit log
    await auditFromRequest(req, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "GDPR_ERASE_REQUEST",
      target: `customer:${customerId}`,
      detail: `Customer PII anonymized per PDPA right to erasure request`,
    });

    return NextResponse.json({
      success: true,
      customerId,
      message: "ข้อมูลส่วนตัวถูกลบแล้ว ข้อมูลธุรกรรมยังคงอยู่เพื่อความถูกต้องทางบัญชี",
      erasedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[POST /api/gdpr/erase]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
