// app/api/branches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await db
      .select()
      .from(branches)
      .where(eq(branches.tenantId, auth.tenantId))
      .orderBy(asc(branches.name));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Branches GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role === "SELLER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { name, code, address, phone, openTime, closeTime } = body as {
      name: string; code: string; address?: string; phone?: string;
      openTime?: string; closeTime?: string;
    };

    if (!name || !code) {
      return NextResponse.json({ error: "name and code are required" }, { status: 400 });
    }

    const [branch] = await db.insert(branches).values({
      tenantId: auth.tenantId,
      name,
      code,
      address: address || null,
      phone: phone || null,
      openTime: openTime || null,
      closeTime: closeTime || null,
      isActive: true,
    }).returning();

    return NextResponse.json(branch, { status: 201 });
  } catch (err: any) {
    if (err?.message?.includes("unique")) {
      return NextResponse.json({ error: "Branch code already exists" }, { status: 409 });
    }
    console.error("Branches POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
