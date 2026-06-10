// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, tenants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword } from "@/lib/password";
import { signJwt, type JwtPayload } from "@/lib/auth";
import { auditFromRequest } from "@/lib/audit";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, tenantSlug } = body as {
      email: string;
      password: string;
      tenantSlug?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอก email และ password" },
        { status: 400 }
      );
    }

    // Single JOIN query: fetch tenant + user in ONE round-trip to Neon
    // (replaces 2 sequential queries — saves ~200-400ms latency)
    const tenantCond = tenantSlug
      ? eq(tenants.slug, tenantSlug)
      : eq(tenants.isActive, true);

    const result = await db
      .select({
        userId: users.id,
        userEmail: users.email,
        userName: users.name,
        userRole: users.role,
        userRoles: users.roles,
        userBranchId: users.branchId,
        userIsActive: users.isActive,
        passwordHash: users.passwordHash,
        tenantId: tenants.id,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        tenantIsActive: tenants.isActive,
      })
      .from(users)
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(
        and(
          eq(users.email, email.toLowerCase()),
          eq(users.isActive, true),
          tenantCond
        )
      )
      .limit(1);

    const row = result[0];

    if (!row || !row.tenantIsActive) {
      // Audit: login failed — user not found or tenant inactive
      auditFromRequest(req, {
        tenantId: row?.tenantId ?? "unknown",
        userId:   undefined,
        userName: email,
        action:   "AUTH_LOGIN_FAILED",
        target:   "auth",
        detail:   `Login failed for ${email}: user not found or tenant inactive`,
        status:   "failed",
        severity: "HIGH",
      }).catch(() => {});
      return NextResponse.json(
        { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Verify password (WebCrypto PBKDF2 — native op, no JS CPU overhead)
    const isValid = await verifyPassword(password, row.passwordHash);
    if (!isValid) {
      // Audit: login failed — wrong password
      auditFromRequest(req, {
        tenantId: row.tenantId,
        userId:   row.userId,
        userName: row.userName,
        action:   "AUTH_LOGIN_FAILED",
        target:   "auth",
        detail:   `Login failed for ${email}: wrong password`,
        status:   "failed",
        severity: "HIGH",
        userRole: row.userRole as string,
      }).catch(() => {});
      return NextResponse.json(
        { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Sign JWT — include roles[] for multi-role support
    const userRoles: string[] = (row.userRoles && row.userRoles.length > 0)
      ? row.userRoles
      : [row.userRole as string];

    const payload: JwtPayload = {
      userId: row.userId,
      tenantId: row.tenantId,
      email: row.userEmail,
      name: row.userName,
      role: row.userRole,      // primary role (backward compat)
      roles: userRoles,        // multi-role array
      branchId: row.userBranchId,
    };
    const token = await signJwt(payload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: row.userId,
        name: row.userName,
        email: row.userEmail,
        role: row.userRole,
        roles: userRoles,
        branchId: row.userBranchId,
        tenantId: row.tenantId,
        tenantName: row.tenantName,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // G1: Write audit log (fire-and-forget, never blocks response)
    auditFromRequest(req, {
      tenantId: row.tenantId,
      userId: row.userId,
      userName: row.userName,
      action: "SYSTEM_LOGIN",
      target: `user:${row.userEmail}`,
      detail: `Login from ${row.tenantSlug} — role: ${row.userRole}`,
    }).catch(() => {});

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 }
    );
  }
}
