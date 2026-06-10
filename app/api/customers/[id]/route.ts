// app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { customers, eyePrescriptions, orders, orderItems, products, claims, users, branches } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auditFromRequest } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    // Main customer profile
    const [customer] = await db
      .select({
        id: customers.id,
        tenantId: customers.tenantId,
        name: customers.name,
        nameEn: customers.nameEn,
        phone: customers.phone,
        email: customers.email,
        lineId: customers.lineId,
        gender: customers.gender,
        birthDate: customers.birthDate,
        address: customers.address,
        taxId: customers.taxId,
        photoUrl: customers.photoUrl,
        medicalHistory: customers.medicalHistory,
        notes: customers.notes,
        loyaltyPoints: customers.loyaltyPoints,
        loyaltyTier: customers.loyaltyTier,
        branchId: customers.branchId,
        branchName: branches.name,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .leftJoin(branches, eq(customers.branchId, branches.id))
      .where(and(eq(customers.id, id), eq(customers.tenantId, auth.tenantId)));

    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // Fetch all related data in parallel
    const [prescriptions, customerOrders, customerClaims] = await Promise.all([
      // Eye prescription history
      db.select({
        id: eyePrescriptions.id,
        recordedAt: eyePrescriptions.recordedAt,
        recorderName: eyePrescriptions.recorderName,
        // OD (Right)
        sphR: eyePrescriptions.sphR,
        cylR: eyePrescriptions.cylR,
        axisR: eyePrescriptions.axisR,
        pdR: eyePrescriptions.pdR,
        addR: eyePrescriptions.addR,
        vaR: eyePrescriptions.vaR,
        // OS (Left)
        sphL: eyePrescriptions.sphL,
        cylL: eyePrescriptions.cylL,
        axisL: eyePrescriptions.axisL,
        pdL: eyePrescriptions.pdL,
        addL: eyePrescriptions.addL,
        vaL: eyePrescriptions.vaL,
        // Extra
        oldGlassesNotes: eyePrescriptions.oldGlassesNotes,
        medicalHistory: eyePrescriptions.medicalHistory,
        frameType: eyePrescriptions.frameType,
        notes: eyePrescriptions.notes,
      })
        .from(eyePrescriptions)
        .where(and(eq(eyePrescriptions.customerId, id), eq(eyePrescriptions.tenantId, auth.tenantId)))
        .orderBy(desc(eyePrescriptions.recordedAt))
        .limit(10),

      // Purchase history
      db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        totalAmount: orders.totalAmount,
        netAmount: orders.netAmount,
        discountAmount: orders.discountAmount,
        paymentMethod: orders.paymentMethod,
        status: orders.status,
        isETaxRequested: orders.isETaxRequested,
        notes: orders.notes,
        createdAt: orders.createdAt,
        sellerName: users.name,
        branchName: branches.name,
      })
        .from(orders)
        .leftJoin(users, eq(orders.sellerId, users.id))
        .leftJoin(branches, eq(orders.branchId, branches.id))
        .where(and(eq(orders.customerId, id), eq(orders.tenantId, auth.tenantId)))
        .orderBy(desc(orders.createdAt))
        .limit(20),

      // Claims history
      db.select({
        id: claims.id,
        reason: claims.reason,
        status: claims.status,
        resolution: claims.resolution,
        createdAt: claims.createdAt,
      })
        .from(claims)
        .where(and(eq(claims.customerId, id), eq(claims.tenantId, auth.tenantId)))
        .orderBy(desc(claims.createdAt))
        .limit(10),
    ]);

    // For each order, get order items
    const ordersWithItems = await Promise.all(
      customerOrders.slice(0, 5).map(async (order) => {
        const items = await db.select({
          id: orderItems.id,
          productId: orderItems.productId,
          productName: products.name,
          productCode: products.code,
          category: products.category,
          quantity: orderItems.quantity,
          price: orderItems.price,
          discount: orderItems.discount,
        })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return { ...order, items };
      })
    );

    return NextResponse.json({
      customer: {
        ...customer,
        birthDate: customer.birthDate?.toISOString() ?? null,
        createdAt: customer.createdAt?.toISOString(),
        updatedAt: customer.updatedAt?.toISOString(),
      },
      prescriptions: prescriptions.map(p => ({
        ...p,
        recordedAt: p.recordedAt?.toISOString(),
      })),
      orders: [
        ...ordersWithItems.map(o => ({ ...o, createdAt: o.createdAt?.toISOString() })),
        ...customerOrders.slice(5).map(o => ({ ...o, items: [], createdAt: o.createdAt?.toISOString() })),
      ],
      claims: customerClaims.map(c => ({ ...c, createdAt: c.createdAt?.toISOString() })),
    });
  } catch (err) {
    console.error("Customer detail GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, nameEn, phone, email, lineId, gender, birthDate, address, taxId, photoUrl, medicalHistory, notes } = body;

    const [updated] = await db.update(customers)
      .set({
        ...(name && { name }),
        ...(nameEn !== undefined && { nameEn: nameEn || null }),
        ...(phone && { phone }),
        ...(email !== undefined && { email: email || null }),
        ...(lineId !== undefined && { lineId: lineId || null }),
        ...(gender !== undefined && { gender: gender || null }),
        ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
        ...(address !== undefined && { address: address || null }),
        ...(taxId !== undefined && { taxId: taxId || null }),
        ...(photoUrl !== undefined && { photoUrl: photoUrl || null }),
        ...(medicalHistory !== undefined && { medicalHistory: medicalHistory || null }),
        ...(notes !== undefined && { notes: notes || null }),
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, id), eq(customers.tenantId, auth.tenantId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    auditFromRequest(req, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "CUSTOMER_UPDATED",
      target: `customer:${id}`,
      detail: `อัปเดตข้อมูลลูกค้า`,
    }).catch(() => {}); // fire-and-forget

    return NextResponse.json({
      ...updated,
      birthDate: updated.birthDate?.toISOString() ?? null,
      createdAt: updated.createdAt?.toISOString(),
    });
  } catch (err) {
    console.error("Customer PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
