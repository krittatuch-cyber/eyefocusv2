// app/api/audit-logs/route.ts — with severity filter + full action catalog
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { eq, and, desc, like, or, count, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, parseInt(searchParams.get("page")  || "1"));
  const limit    = Math.min(50, parseInt(searchParams.get("limit") || "20"));
  const offset   = (page - 1) * limit;
  const search   = searchParams.get("search")   || "";
  const category = searchParams.get("category") || "ALL";
  const severity = searchParams.get("severity") || "ALL"; // NEW

  // Category → action filter mapping (updated with all new actions)
  const categoryMap: Record<string, string[]> = {
    ORDERS: [
      "ORDER_CREATED", "ORDER_UPDATED", "ORDER_CANCELLED",
      "ORDER_DISCOUNT_APPLIED", "ORDER_REFUNDED", "PAYMENT_RECEIVED",
    ],
    SHIFTS: [
      "SHIFT_OPEN", "SHIFT_CLOSE", "SHIFT_OPENED", "SHIFT_CLOSED",
    ],
    PRODUCTS: [
      "PRODUCT_CREATED", "PRODUCT_UPDATED", "PRODUCT_DELETED",
      "STOCK_ADJUSTED", "STOCK_TRANSFER",
      "STOCK_TRANSFER_CREATED", "STOCK_TRANSFER_RECEIVED",
    ],
    USERS: [
      "USER_CREATED", "USER_UPDATED", "USER_ROLE_CHANGED",
      "USER_DEACTIVATED", "USER_PASSWORD_RESET",
    ],
    BRANCHES: ["BRANCH_CREATED", "BRANCH_UPDATED"],
    CUSTOMERS: [
      "CUSTOMER_CREATED", "CUSTOMER_UPDATED", "CUSTOMER_DELETED",
      "CUSTOMER_PII_VIEWED", "LOYALTY_ADJUSTED",
    ],
    PRESCRIPTIONS: [
      "PRESCRIPTION_CREATED", "PRESCRIPTION_UPDATED", "PRESCRIPTION_DELETED",
    ],
    LAB: [
      "LAB_JOB_CREATED", "LAB_STATUS_CHANGED", "LAB_JOB_DELIVERED",
    ],
    CLAIMS: ["CLAIM_CREATED", "CLAIM_UPDATED"],
    PAYMENTS: [
      "BILLING_SUBSCRIBE", "BILLING_FAILED", "BILLING_PAYMENT_SUCCESS",
      "BILLING_PAYMENT_FAILED", "BILLING_CHARGED",
    ],
    AUTH: [
      "SYSTEM_LOGIN", "SYSTEM_LOGOUT",
      "AUTH_LOGIN_FAILED", "AUTH_PASSWORD_CHANGED", "AUTH_LOCKED",
      "GDPR_EXPORT", "GDPR_ERASE_REQUEST", "GDPR_ERASE",
      "AUDIT_LOG_VIEWED", "AUDIT_LOG_EXPORTED",
    ],
    ADMIN: [
      "TENANT_SUSPENDED", "TENANT_ACTIVATED", "TENANT_PLAN_CHANGED",
      "TRIAL_EXTENDED", "TENANT_TRIAL_EXTENDED", "TENANT_DUNNING_RESET",
      "PLAN_CHANGED",
    ],
  };

  try {
    const conditions: ReturnType<typeof eq>[] = [
      eq(auditLogs.tenantId, auth.tenantId) as any,
    ];

    if (search) {
      conditions.push(
        or(
          like(auditLogs.userName, `%${search}%`),
          like(auditLogs.detail,   `%${search}%`),
          like(auditLogs.target,   `%${search}%`),
        ) as any
      );
    }

    if (category !== "ALL" && categoryMap[category]) {
      conditions.push(inArray(auditLogs.action, categoryMap[category] as any[]) as any);
    }

    // Severity filter
    if (severity !== "ALL" && ["LOW", "MEDIUM", "HIGH"].includes(severity)) {
      conditions.push(eq(auditLogs.severity as any, severity) as any);
    }

    const whereClause = and(...conditions);

    const [data, totalResult] = await Promise.all([
      db.select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ cnt: count() })
        .from(auditLogs)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.cnt ?? 0);

    // Stats for HIGH severity events
    const highSeverityCount = await db.select({ cnt: count() })
      .from(auditLogs)
      .where(and(
        eq(auditLogs.tenantId, auth.tenantId),
        eq(auditLogs.severity as any, "HIGH"),
      ));

    return NextResponse.json({
      data: data.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      meta: {
        highSeverityCount: Number(highSeverityCount[0]?.cnt ?? 0),
      },
    });
  } catch (err) {
    console.error("Audit logs GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
