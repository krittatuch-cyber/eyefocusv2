// lib/audit.ts — EyeFocus V2 Audit Logging (v2 — spreadsheet-aligned)
// Standard fields per EyeFocus_V2_Audit_Events spec:
//   id, tenantId, userId, userName, userRole, action, target, detail,
//   severity, status, ipAddress, userAgent, oldValue, newValue, createdAt
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { NextRequest } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────
export type AuditSeverity = "LOW" | "MEDIUM" | "HIGH";
export type AuditStatus   = "success" | "failed";

export type AuditAction =
  // Orders
  | "ORDER_CREATED" | "ORDER_UPDATED" | "ORDER_CANCELLED"
  | "ORDER_DISCOUNT_APPLIED" | "ORDER_REFUNDED" | "PAYMENT_RECEIVED"
  // Shifts
  | "SHIFT_OPEN" | "SHIFT_CLOSE" | "SHIFT_OPENED" | "SHIFT_CLOSED"
  // Products & Stock
  | "PRODUCT_CREATED" | "PRODUCT_UPDATED" | "PRODUCT_DELETED"
  | "STOCK_ADJUSTED" | "STOCK_TRANSFER"
  | "STOCK_TRANSFER_CREATED" | "STOCK_TRANSFER_RECEIVED"
  // Users
  | "USER_CREATED" | "USER_UPDATED" | "USER_ROLE_CHANGED"
  | "USER_DEACTIVATED" | "USER_PASSWORD_RESET"
  // Branches
  | "BRANCH_CREATED" | "BRANCH_UPDATED"
  // Customers
  | "CUSTOMER_CREATED" | "CUSTOMER_UPDATED" | "CUSTOMER_DELETED"
  | "CUSTOMER_PII_VIEWED" | "LOYALTY_ADJUSTED"
  // Claims
  | "CLAIM_CREATED" | "CLAIM_UPDATED"
  // Prescriptions
  | "PRESCRIPTION_CREATED" | "PRESCRIPTION_UPDATED" | "PRESCRIPTION_DELETED"
  // Auth
  | "SYSTEM_LOGIN" | "SYSTEM_LOGOUT"
  | "AUTH_LOGIN_FAILED" | "AUTH_PASSWORD_CHANGED" | "AUTH_LOCKED"
  // Appointments
  | "APPOINTMENT_CREATED"
  // Lab
  | "LAB_JOB_CREATED" | "LAB_STATUS_CHANGED" | "LAB_JOB_DELIVERED"
  // Billing
  | "BILLING_SUBSCRIBE" | "BILLING_FAILED"
  | "BILLING_PAYMENT_SUCCESS" | "BILLING_CHARGED"
  // Payments
  | "PAYMENT_RECEIVED"
  // PDPA
  | "GDPR_EXPORT" | "GDPR_ERASE_REQUEST" | "GDPR_ERASE"
  | "AUDIT_LOG_VIEWED" | "AUDIT_LOG_EXPORTED"
  // Admin
  | "TENANT_SUSPENDED" | "TENANT_ACTIVATED"
  | "PLAN_CHANGED" | "TRIAL_EXTENDED"
  | "TENANT_PLAN_CHANGED" | "TENANT_TRIAL_EXTENDED" | "TENANT_DUNNING_RESET";

// ─── Severity Map (from spreadsheet) ─────────────────────────────────────────
// Maps each action to its default severity level.
const SEVERITY_MAP: Record<AuditAction, AuditSeverity> = {
  // LOW — routine daily activity
  SYSTEM_LOGIN:             "LOW",
  SYSTEM_LOGOUT:            "LOW",
  ORDER_CREATED:            "LOW",
  LAB_JOB_CREATED:          "LOW",
  LAB_STATUS_CHANGED:       "LOW",
  PRODUCT_CREATED:          "LOW",
  CUSTOMER_CREATED:         "LOW",
  TRIAL_EXTENDED:           "LOW",
  TENANT_TRIAL_EXTENDED:    "LOW",
  AUDIT_LOG_VIEWED:         "LOW",
  // MEDIUM — general changes
  AUTH_PASSWORD_CHANGED:    "MEDIUM",
  USER_CREATED:             "MEDIUM",
  USER_UPDATED:             "MEDIUM",
  CUSTOMER_UPDATED:         "MEDIUM",
  LOYALTY_ADJUSTED:         "MEDIUM",
  PRODUCT_UPDATED:          "MEDIUM",
  STOCK_TRANSFER:           "MEDIUM",
  STOCK_TRANSFER_CREATED:   "MEDIUM",
  STOCK_TRANSFER_RECEIVED:  "MEDIUM",
  SHIFT_OPEN:               "MEDIUM",
  SHIFT_OPENED:             "MEDIUM",
  PAYMENT_RECEIVED:         "MEDIUM",
  LAB_JOB_DELIVERED:        "MEDIUM",
  BILLING_SUBSCRIBE:        "MEDIUM",
  BILLING_PAYMENT_SUCCESS:  "MEDIUM",
  BILLING_CHARGED:          "MEDIUM",
  AUDIT_LOG_EXPORTED:       "MEDIUM",
  TENANT_PLAN_CHANGED:      "MEDIUM",
  TENANT_DUNNING_RESET:     "MEDIUM",
  TENANT_ACTIVATED:         "MEDIUM",
  PLAN_CHANGED:             "MEDIUM",
  CLAIM_CREATED:            "MEDIUM",
  CLAIM_UPDATED:            "MEDIUM",
  BRANCH_CREATED:           "MEDIUM",
  BRANCH_UPDATED:           "MEDIUM",
  APPOINTMENT_CREATED:      "MEDIUM",
  PRESCRIPTION_CREATED:     "MEDIUM",
  // HIGH — fraud / legal / security risk
  AUTH_LOGIN_FAILED:        "HIGH",
  AUTH_LOCKED:              "HIGH",
  USER_ROLE_CHANGED:        "HIGH",
  USER_DEACTIVATED:         "HIGH",
  USER_PASSWORD_RESET:      "HIGH",
  CUSTOMER_PII_VIEWED:      "HIGH",
  CUSTOMER_DELETED:         "HIGH",
  PRESCRIPTION_UPDATED:     "HIGH",
  PRESCRIPTION_DELETED:     "HIGH",
  STOCK_ADJUSTED:           "HIGH",
  SHIFT_CLOSE:              "HIGH",
  SHIFT_CLOSED:             "HIGH",
  ORDER_CANCELLED:          "HIGH",
  ORDER_DISCOUNT_APPLIED:   "HIGH",
  ORDER_REFUNDED:           "HIGH",
  BILLING_FAILED:           "HIGH",
  GDPR_EXPORT:              "HIGH",
  GDPR_ERASE_REQUEST:       "HIGH",
  GDPR_ERASE:               "HIGH",
  TENANT_SUSPENDED:         "HIGH",
  ORDER_UPDATED:            "MEDIUM",
  PRODUCT_DELETED:          "HIGH",
};

// ─── Params Interface ─────────────────────────────────────────────────────────
export interface AuditParams {
  tenantId:    string;
  userId?:     string;
  userName:    string;
  userRole?:   string;          // role snapshot at the time of the event
  action:      AuditAction;
  target?:     string;          // e.g. "order:EF-20240601-0001" or "user:john@shop.com"
  detail?:     string;          // human-readable Thai/English description
  severity?:   AuditSeverity;  // auto-looked up from SEVERITY_MAP if omitted
  status?:     AuditStatus;     // default "success"
  ipAddress?:  string;
  userAgent?:  string;
  oldValue?:   Record<string, unknown> | null;  // snapshot before change
  newValue?:   Record<string, unknown> | null;  // snapshot after change
}

// ─── Core Write ───────────────────────────────────────────────────────────────
/**
 * Write an audit log entry. Fire-and-forget — never throws.
 */
export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    const severity = params.severity ?? SEVERITY_MAP[params.action] ?? "LOW";
    await db.insert(auditLogs).values({
      tenantId:  params.tenantId,
      userId:    params.userId,
      userName:  params.userName,
      userRole:  params.userRole,
      action:    params.action as typeof auditLogs.$inferInsert["action"],
      target:    params.target,
      detail:    params.detail,
      severity,
      status:    params.status ?? "success",
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      oldValue:  params.oldValue as unknown as Record<string, unknown>,
      newValue:  params.newValue as unknown as Record<string, unknown>,
    });
  } catch (error) {
    // Audit log failure must NEVER crash the main request
    console.error("[audit] Failed to write log:", error);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Extract IP address from Next.js request headers (Cloudflare-aware) */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Extract User-Agent from request */
export function getUserAgent(req: NextRequest): string {
  return req.headers.get("user-agent") || "unknown";
}

/**
 * Convenience: write audit log from a Next.js API route request.
 * Extracts IP and user-agent automatically from request headers.
 *
 * Usage (fire-and-forget pattern):
 *   auditFromRequest(req, {
 *     tenantId, userId, userName, action: "ORDER_CREATED",
 *     target: "order:EF-001", detail: "สร้างออเดอร์ ฿12,500",
 *     oldValue: null,
 *     newValue: { orderId, amount },
 *   }).catch(() => {});
 */
export async function auditFromRequest(
  req: NextRequest,
  params: Omit<AuditParams, "ipAddress" | "userAgent">
): Promise<void> {
  await writeAuditLog({
    ...params,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });
}

/**
 * Helper: build a safe oldValue/newValue diff from two objects.
 * Removes password/token fields. Useful for USER_UPDATED, PRODUCT_UPDATED, etc.
 * 
 * Usage:
 *   const { oldValue, newValue } = buildDiff(oldUser, newUser, ["passwordHash", "token"]);
 */
export function buildDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  redactKeys: string[] = ["passwordHash", "password", "token", "secret", "taxId", "medicalHistory"]
): { oldValue: Record<string, unknown>; newValue: Record<string, unknown> } {
  const oldValue: Record<string, unknown> = {};
  const newValue: Record<string, unknown> = {};

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    if (before[key] !== after[key]) {
      oldValue[key] = redactKeys.includes(key) ? "[REDACTED]" : before[key];
      newValue[key] = redactKeys.includes(key) ? "[REDACTED]" : after[key];
    }
  }

  return { oldValue, newValue };
}
