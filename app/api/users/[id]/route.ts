// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auditFromRequest, buildDiff } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission(req, "users.view").catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.tenantId, auth.tenantId)));
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { passwordHash: _, ...safe } = user;
  return NextResponse.json(safe);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requirePermission(req, "users.edit");
    const body = await req.json();
    const { name, email, password, role, roles, branchId, isActive, phone, jobTitle, photoUrl } = body;

    // Fetch current user for diff/audit
    const [current] = await db.select().from(users)
      .where(and(eq(users.id, id), eq(users.tenantId, auth.tenantId)));
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (name        !== undefined) updates.name       = name;
    if (email       !== undefined) updates.email      = email.toLowerCase();
    if (branchId    !== undefined) updates.branchId   = branchId || null;
    if (isActive    !== undefined) updates.isActive   = isActive;
    if (phone       !== undefined) updates.phone      = phone || null;
    if (jobTitle    !== undefined) updates.jobTitle   = jobTitle || null;
    if (photoUrl    !== undefined) updates.photoUrl   = photoUrl || null;
    if (roles       !== undefined && roles.length > 0) {
      updates.roles = roles;
      updates.role  = roles[0];
    } else if (role !== undefined) {
      updates.role  = role;
      updates.roles = [role];
    }
    if (password && password.length >= 8) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }
    updates.updatedAt = new Date();

    await db.update(users).set(updates as any).where(and(eq(users.id, id), eq(users.tenantId, auth.tenantId)));
    const [updated] = await db.select().from(users).where(eq(users.id, id));
    const { passwordHash: _ph, ...safe } = updated;

    // Audit log
    const action = isActive === false ? "USER_DEACTIVATED"
      : (password && password.length >= 8 && auth.userId !== id) ? "USER_PASSWORD_RESET"
      : (roles && JSON.stringify(roles.sort()) !== JSON.stringify([...(current.roles || [])].sort())) ? "USER_ROLE_CHANGED"
      : "USER_UPDATED";

    const { oldValue, newValue } = buildDiff(
      { name: current.name, email: current.email, role: current.role, roles: current.roles, phone: current.phone, jobTitle: current.jobTitle, isActive: current.isActive },
      { name: updated.name, email: updated.email, role: updated.role, roles: updated.roles, phone: updated.phone, jobTitle: updated.jobTitle, isActive: updated.isActive },
    );

    auditFromRequest(req, {
      tenantId: auth.tenantId,
      userId:   auth.userId,
      userName: auth.name || "Unknown",
      userRole: auth.role,
      action,
      target:   `user:${updated.email}`,
      detail:   `แก้ไขข้อมูลพนักงาน ${updated.name}`,
      oldValue,
      newValue,
    }).catch(() => {});

    return NextResponse.json(safe);
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error("Users PATCH error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
