// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  return NextResponse.json({
    id: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    roles: payload.roles && payload.roles.length > 0 ? payload.roles : [payload.role],
    branchId: payload.branchId,
    tenantId: payload.tenantId,
  });
}
