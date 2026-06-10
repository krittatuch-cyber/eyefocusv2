// app/api/gdpr/export/route.ts — PDPA: Export all customer data for a tenant
// GET /api/gdpr/export?customerId=xxx — export single customer
// GET /api/gdpr/export — export all tenant customers (OWNER only)
import { NextRequest, NextResponse } from "next/server";
import { requireManager } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { customers, orders, eyePrescriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auditFromRequest } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManager(req);
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    let customerList;
    if (customerId) {
      customerList = await db.select().from(customers)
        .where(and(eq(customers.id, customerId), eq(customers.tenantId, auth.tenantId)));
    } else {
      customerList = await db.select().from(customers)
        .where(eq(customers.tenantId, auth.tenantId));
    }

    if (!customerList.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Build export payload (PDPA Article 23 — data portability)
    const exportData = await Promise.all(customerList.map(async (c) => {
      const custOrders = await db.select().from(orders)
        .where(and(eq(orders.customerId, c.id), eq(orders.tenantId, auth.tenantId)));
      const custPrescriptions = await db.select().from(eyePrescriptions)
        .where(and(eq(eyePrescriptions.customerId, c.id), eq(eyePrescriptions.tenantId, auth.tenantId)));

      return {
        customer: {
          id: c.id,
          name: c.name,
          nameEn: c.nameEn,
          phone: c.phone,
          email: c.email,
          lineId: c.lineId,
          gender: c.gender,
          birthDate: c.birthDate,
          address: c.address,
          taxId: c.taxId ? "[ENCRYPTED — contact store for access]" : null,
          medicalHistory: c.medicalHistory ? "[ENCRYPTED — contact store for access]" : null,
          notes: c.notes,
          loyaltyPoints: c.loyaltyPoints,
          loyaltyTier: c.loyaltyTier,
          pdpaConsent: (c as Record<string, unknown>).pdpaConsent,
          consentDate: (c as Record<string, unknown>).consentDate,
          createdAt: c.createdAt,
        },
        orders: custOrders.map(o => ({
          id: o.id, totalAmount: o.totalAmount, status: o.status,
          paymentMethod: o.paymentMethod, createdAt: o.createdAt,
        })),
        prescriptions: custPrescriptions.map(p => ({
          id: p.id, recordedAt: p.recordedAt,
          sphR: p.sphR, cylR: p.cylR, sphL: p.sphL, cylL: p.cylL,
        })),
      };
    }));

    // Audit log
    await auditFromRequest(req, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "GDPR_EXPORT",
      target: customerId ? `customer:${customerId}` : "all_customers",
      detail: `Exported ${exportData.length} customer(s) data`,
    });

    const response = {
      exportedAt: new Date().toISOString(),
      exportedBy: auth.email,
      tenantId: auth.tenantId,
      totalCustomers: exportData.length,
      data: exportData,
      notice: "ข้อมูลนี้ถูก export ตามสิทธิ์การเข้าถึงข้อมูล (PDPA มาตรา 23) โปรดเก็บรักษาอย่างปลอดภัย",
    };

    return new NextResponse(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="eyefocus-data-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[GET /api/gdpr/export]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
