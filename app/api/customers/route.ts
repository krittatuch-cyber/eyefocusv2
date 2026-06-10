// app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { customers, branches } from "@/lib/db/schema";
import { eq, and, or, ilike, desc, count, gte } from "drizzle-orm";
import { auditFromRequest } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const tier = searchParams.get("tier");
  const limit = parseInt(searchParams.get("limit") || "50");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const offset = (page - 1) * limit;
  const exportCsv = searchParams.get("export") === "csv";

  try {
    const conds: any[] = [eq(customers.tenantId, auth.tenantId)];
    if (tier && tier !== "ALL") conds.push(eq(customers.loyaltyTier, tier as any));
    if (search) {
      conds.push(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.phone, `%${search}%`),
          ilike(customers.email, `%${search}%`),
          ilike(customers.nameEn, `%${search}%`)
        )
      );
    }

    if (exportCsv) {
      const allRows = await db
        .select({
          id: customers.id,
          name: customers.name,
          nameEn: customers.nameEn,
          phone: customers.phone,
          email: customers.email,
          lineId: customers.lineId,
          gender: customers.gender,
          birthDate: customers.birthDate,
          address: customers.address,
          taxId: customers.taxId,
          medicalHistory: customers.medicalHistory,
          loyaltyPoints: customers.loyaltyPoints,
          loyaltyTier: customers.loyaltyTier,
          notes: customers.notes,
          createdAt: customers.createdAt,
        })
        .from(customers)
        .where(and(...conds))
        .orderBy(desc(customers.createdAt));

      const headers = ["ID", "ชื่อ (TH)", "ชื่อ (EN)", "เบอร์โทร", "อีเมล", "LINE ID", "เพศ", "วันเกิด", "ที่อยู่", "เลขภาษี", "ประวัติสุขภาพ", "แต้มสะสม", "ระดับ", "หมายเหตุ", "วันที่สมัคร"];
      const rows = allRows.map(r => [
        r.id, r.name, r.nameEn || "", r.phone, r.email || "", r.lineId || "",
        r.gender || "", r.birthDate ? new Date(r.birthDate).toLocaleDateString("th-TH") : "",
        (r.address || "").replace(/,/g, " "), r.taxId || "", (r.medicalHistory || "").replace(/,/g, " "),
        r.loyaltyPoints, r.loyaltyTier, (r.notes || "").replace(/,/g, " "),
        new Date(r.createdAt).toLocaleDateString("th-TH"),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

      const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const [data, totalResult] = await Promise.all([
      db.select({
        id: customers.id,
        name: customers.name,
        nameEn: customers.nameEn,
        phone: customers.phone,
        email: customers.email,
        lineId: customers.lineId,
        gender: customers.gender,
        birthDate: customers.birthDate,
        address: customers.address,
        taxId: customers.taxId,
        // photoUrl excluded from list — fetched via GET /api/customers/[id] in detail page
        notes: customers.notes,
        loyaltyPoints: customers.loyaltyPoints,
        loyaltyTier: customers.loyaltyTier,
        branchId: customers.branchId,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
        .from(customers)
        .where(and(...conds))
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ cnt: count() }).from(customers).where(and(...conds)),
    ]);

    // Summary counts
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const [tierCounts, newThisMonth] = await Promise.all([
      db.select({ tier: customers.loyaltyTier, cnt: count() })
        .from(customers)
        .where(eq(customers.tenantId, auth.tenantId))
        .groupBy(customers.loyaltyTier),
      db.select({ cnt: count() })
        .from(customers)
        .where(and(eq(customers.tenantId, auth.tenantId), gte(customers.createdAt, startOfMonth))),
    ]);

    const tierMap = Object.fromEntries(tierCounts.map(t => [t.tier, Number(t.cnt)]));

    return NextResponse.json({
      data: data.map(c => ({
        ...c,
        birthDate: c.birthDate?.toISOString() ?? null,
        createdAt: c.createdAt?.toISOString(),
        updatedAt: c.updatedAt?.toISOString(),
      })),
      pagination: {
        page, limit,
        total: Number(totalResult[0]?.cnt ?? 0),
        totalPages: Math.ceil(Number(totalResult[0]?.cnt ?? 0) / limit),
      },
      summary: {
        total: Number(totalResult[0]?.cnt ?? 0),
        platinum: tierMap.PLATINUM ?? 0,
        gold: tierMap.GOLD ?? 0,
        silver: tierMap.SILVER ?? 0,
        bronze: tierMap.BRONZE ?? 0,
        newThisMonth: Number(newThisMonth[0]?.cnt ?? 0),
      },
    });
  } catch (err) {
    console.error("Customers GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, nameEn, phone, email, lineId, gender, birthDate, address, taxId, photoUrl, medicalHistory, notes, branchId } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "ชื่อและเบอร์โทรจำเป็นต้องกรอก" }, { status: 400 });
    }

    const [customer] = await db.insert(customers).values({
      tenantId: auth.tenantId,
      name,
      nameEn: nameEn || null,
      phone,
      email: email || null,
      lineId: lineId || null,
      gender: gender || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      address: address || null,
      taxId: taxId || null,
      photoUrl: photoUrl || null,
      medicalHistory: medicalHistory || null,
      notes: notes || null,
      branchId: branchId || auth.branchId || null,
    }).returning();

    auditFromRequest(req, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "CUSTOMER_CREATED",
      target: `customer:${customer.id}`,
      detail: `เพิ่มลูกค้า ${body.nameEn || body.name}`,
    }).catch(() => {}); // fire-and-forget

    return NextResponse.json({
      ...customer,
      birthDate: customer.birthDate?.toISOString() ?? null,
      createdAt: customer.createdAt?.toISOString(),
    }, { status: 201 });
  } catch (err) {
    console.error("Customers POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
