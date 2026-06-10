// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { users, branches } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auditFromRequest } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "users.view");

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        roles: users.roles,
        phone: users.phone,
        jobTitle: users.jobTitle,
        // photoUrl excluded from list — fetched via GET /api/users/[id] in edit modal
        branchId: users.branchId,
        branchName: branches.name,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(branches, eq(users.branchId, branches.id))
      .where(eq(users.tenantId, auth.tenantId))
      .orderBy(asc(users.name));

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("Users GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "users.create");

    const body = await req.json();
    const { name, email, password, role, roles, branchId, phone, jobTitle, photoUrl } = body as {
      name: string;
      email: string;
      password: string;
      role?: string;
      roles?: string[];
      branchId?: string;
      phone?: string;
      jobTitle?: string;
      photoUrl?: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email, password are required" }, { status: 400 });
    }

    // Resolve role and roles from body — support both single role and roles[]
    const resolvedRoles: string[] = roles && roles.length > 0
      ? roles
      : [role || "SALES"];
    const resolvedRole = resolvedRoles[0] as
      "SUPER_ADMIN" | "OWNER" | "MANAGER" | "OD" | "OPTICIAN" | "SALES" | "CASHIER" | "SELLER";

    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db.insert(users).values({
      tenantId: auth.tenantId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: resolvedRole,
      roles: resolvedRoles,
      branchId: branchId || null,
      phone: phone || null,
      jobTitle: jobTitle || null,
      photoUrl: photoUrl || null,
      isActive: true,
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      roles: users.roles,
      branchId: users.branchId,
      isActive: users.isActive,
    });

    auditFromRequest(req, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.name,
      action: "USER_CREATED",
      target: `user:${user.email}`,
      detail: `สร้างพนักงาน ${user.name} roles=[${resolvedRoles.join(',')}]`,
    }).catch(() => {}); // fire-and-forget

    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    if (e?.message?.includes("unique")) {
      return NextResponse.json({ error: "Email already in use for this tenant" }, { status: 409 });
    }
    console.error("Users POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
