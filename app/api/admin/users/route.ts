// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { users, tenants, branches } from "@/lib/db/schema";
import { eq, ilike, or, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth || auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const limit = parseInt(searchParams.get("limit") || "100");

  try {
    const conds: any[] = [];
    if (search) {
      conds.push(or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`)
      ));
    }
    if (role) {
      conds.push(eq(users.role, role as any));
    }

    const data = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        tenantId: users.tenantId,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        branchId: users.branchId,
        branchName: branches.name,
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .leftJoin(branches, eq(users.branchId, branches.id))
      .where(conds.length > 0 ? and(...conds) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    // Summary counts by role
    const roleCounts = data.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      users: data.map(u => ({
        ...u,
        createdAt: u.createdAt?.toISOString(),
      })),
      total: data.length,
      roleCounts,
    });
  } catch (err) {
    console.error("Admin users GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth || auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userId, action } = await req.json();
    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action required" }, { status: 400 });
    }

    if (action === "deactivate") {
      await db.update(users).set({ isActive: false }).where(eq(users.id, userId));
    } else if (action === "activate") {
      await db.update(users).set({ isActive: true }).where(eq(users.id, userId));
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin users PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
