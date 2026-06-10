// lib/permissions.ts — EyeFocus V2 Role Permission System
// Supports MULTI-ROLE: one user can hold multiple roles simultaneously
// Based on: https://docs.google.com/spreadsheets/d/197WTWvLoDG_-2WCYO6meYC0JeRS29BBiAjFAFg8mudA

export type AppRole =
  | "SUPER_ADMIN"
  | "OWNER"
  | "MANAGER"
  | "OD"
  | "OPTICIAN"
  | "SALES"
  | "CASHIER"
  | "SELLER"; // legacy — kept for backward compat, treated same as SALES

// ─── Permission Actions ────────────────────────────────────────────────────────
// User has permission if ANY of their roles appears in the allowed list.

export const PERMISSIONS: Record<string, AppRole[]> = {
  // ── Dashboard ────────────────────────────────────────────────────────────────
  "dashboard.view":           ["OWNER","MANAGER","OD","OPTICIAN","SALES","CASHIER","SELLER"],

  // ── System Settings ───────────────────────────────────────────────────────────
  "settings.view":            ["OWNER","MANAGER"],
  "settings.edit":            ["OWNER","MANAGER"],
  "branches.manage":          ["OWNER"],
  "branches.viewAll":         ["OWNER","MANAGER"],
  "subscription.view":        ["OWNER","MANAGER"],
  "subscription.upgrade":     ["OWNER"],

  // ── User Management ───────────────────────────────────────────────────────────
  "users.view":               ["OWNER","MANAGER"],
  "users.create":             ["OWNER","MANAGER"],
  "users.edit":               ["OWNER","MANAGER"],
  "users.delete":             ["OWNER"],
  "users.assignRole":         ["OWNER"],
  "users.toggleActive":       ["OWNER","MANAGER"],
  "users.resetPassword":      ["OWNER","MANAGER"],

  // ── Customers ────────────────────────────────────────────────────────────────
  "customers.view":           ["OWNER","MANAGER","OD","OPTICIAN","SALES","CASHIER","SELLER"],
  "customers.create":         ["OWNER","MANAGER","OD","OPTICIAN","SALES","SELLER"],
  "customers.edit":           ["OWNER","MANAGER","OD","OPTICIAN","SALES","SELLER"],
  "customers.delete":         ["OWNER","MANAGER"],
  "customers.viewSensitive":  ["OWNER","MANAGER","OD"],  // taxId, medicalHistory
  "customers.export":         ["OWNER","MANAGER"],
  "customers.erase":          ["OWNER","MANAGER"],

  // ── Loyalty Points ────────────────────────────────────────────────────────────
  "loyalty.view":             ["OWNER","MANAGER","OD","OPTICIAN","SALES","CASHIER","SELLER"],
  "loyalty.manage":           ["OWNER","MANAGER","SALES","CASHIER","SELLER"],

  // ── Eye Prescriptions ─────────────────────────────────────────────────────────
  "prescriptions.view":       ["OWNER","MANAGER","OD","OPTICIAN","SALES","SELLER"],
  "prescriptions.create":     ["OWNER","MANAGER","OD"],
  "prescriptions.edit":       ["OWNER","MANAGER","OD"],

  // ── Products & Stock ─────────────────────────────────────────────────────────
  "products.view":            ["OWNER","MANAGER","OD","OPTICIAN","SALES","CASHIER","SELLER"],
  "products.viewCost":        ["OWNER","MANAGER"],
  "products.create":          ["OWNER","MANAGER"],
  "products.edit":            ["OWNER","MANAGER"],
  "products.delete":          ["OWNER"],
  "stocks.adjust":            ["OWNER","MANAGER","OPTICIAN"],
  "stocks.transfer":          ["OWNER","MANAGER","OPTICIAN"],

  // ── POS / Sales ──────────────────────────────────────────────────────────────
  "shifts.open":              ["OWNER","MANAGER","CASHIER","SELLER"],
  "shifts.close":             ["OWNER","MANAGER","CASHIER","SELLER"],
  "orders.create":            ["OWNER","MANAGER","SALES","CASHIER","SELLER"],
  "orders.discount":          ["OWNER","MANAGER","SALES","SELLER"],
  "orders.payment":           ["OWNER","MANAGER","CASHIER","SELLER"],
  "orders.cancel":            ["OWNER","MANAGER"],
  "orders.view":              ["OWNER","MANAGER","SALES","CASHIER","SELLER"],

  // ── Lab Jobs ──────────────────────────────────────────────────────────────────
  "jobs.view":                ["OWNER","MANAGER","OD","OPTICIAN","SALES","CASHIER","SELLER"],
  "jobs.create":              ["OWNER","MANAGER","OD","OPTICIAN","SALES","SELLER"],
  "jobs.updateStatus":        ["OWNER","MANAGER","OPTICIAN"],
  "jobs.deliver":             ["OWNER","MANAGER","OPTICIAN","SALES","CASHIER","SELLER"],

  // ── Reports ───────────────────────────────────────────────────────────────────
  "reports.salesOwn":         ["OWNER","MANAGER","SALES","CASHIER","SELLER"],
  "reports.salesAll":         ["OWNER","MANAGER"],
  "reports.profitLoss":       ["OWNER","MANAGER"],
  "reports.staffPerformance": ["OWNER","MANAGER","SALES","SELLER"],
  "reports.shiftSummary":     ["OWNER","MANAGER","CASHIER"],
  "reports.commission":       ["OWNER","MANAGER"],

  // ── PDPA ──────────────────────────────────────────────────────────────────────
  "pdpa.export":              ["OWNER","MANAGER"],
  "pdpa.erase":               ["OWNER","MANAGER"],
  "auditLogs.view":           ["OWNER","MANAGER"],
};

// ─── Core Multi-Role Permission Helpers ───────────────────────────────────────

/**
 * Check if user (with possibly multiple roles) has permission for an action.
 * Returns true if ANY of the user's roles is in the allowed list.
 */
export function hasPermission(
  roles: AppRole | AppRole[] | string | string[],
  action: string
): boolean {
  const roleArray: string[] = Array.isArray(roles) ? roles : [roles as string];

  // SUPER_ADMIN bypasses everything
  if (roleArray.includes("SUPER_ADMIN")) return true;

  const allowed = PERMISSIONS[action];
  if (!allowed) return false;

  // User has permission if ANY of their roles is allowed
  return roleArray.some(r => allowed.includes(r as AppRole));
}

/**
 * Check if user has ANY of the given actions.
 */
export function hasAnyPermission(
  roles: AppRole | AppRole[] | string | string[],
  actions: string[]
): boolean {
  return actions.some(a => hasPermission(roles, a));
}

/**
 * Check if user has ALL of the given actions.
 */
export function hasAllPermissions(
  roles: AppRole | AppRole[] | string | string[],
  actions: string[]
): boolean {
  return actions.every(a => hasPermission(roles, a));
}

/**
 * For Next.js API routes — returns a 403 Response if permission denied, null if allowed.
 *
 * Usage:
 *   const denied = checkPermission(auth.roles, 'prescriptions.create');
 *   if (denied) return denied;
 */
export function checkPermission(
  roles: AppRole | AppRole[] | string | string[],
  action: string
): Response | null {
  if (!hasPermission(roles, action)) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return new Response(
      JSON.stringify({
        error: "Forbidden",
        required: action,
        yourRoles: roleArray,
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}

// ─── Sidebar / Nav Visibility ─────────────────────────────────────────────────

/**
 * Returns which nav sections the user can see, for dynamic sidebar rendering.
 */
export function getNavPermissions(roles: string[]) {
  const r = roles; // shorthand
  return {
    dashboard:    hasPermission(r, "dashboard.view"),
    customers:    hasPermission(r, "customers.view"),

    // ค่าสายตา: OWNER, MANAGER, OD, OPTICIAN เท่านั้น (ไม่ใช่ SALES, CASHIER)
    prescriptions: r.some(x => ["OWNER","MANAGER","OD","OPTICIAN"].includes(x)),
    eyesight:      r.some(x => ["OWNER","MANAGER","OD","OPTICIAN"].includes(x)),

    pos:          hasAnyPermission(r, ["orders.create","shifts.open"]),
    products:     hasPermission(r, "products.view"),
    stocks:       hasPermission(r, "products.view"),

    // งาน/Lab Job: OWNER, MANAGER, OD, OPTICIAN เท่านั้น (nav visibility)
    jobs:         r.some(x => ["OWNER","MANAGER","OD","OPTICIAN"].includes(x)),

    reports:      hasAnyPermission(r, ["reports.salesOwn","reports.salesAll","reports.shiftSummary"]),
    users:        hasPermission(r, "users.view"),
    settings:     hasPermission(r, "settings.view"),
    commission:   hasPermission(r, "reports.commission"),
    subscription: hasPermission(r, "subscription.view"),
    auditLogs:    hasPermission(r, "auditLogs.view"),
    loyalty:      hasPermission(r, "loyalty.view"),
    labVendors:   r.some(x => ["OWNER","MANAGER","OD","OPTICIAN"].includes(x)),
    taxInvoices:  hasAnyPermission(r, ["orders.view","orders.payment"]),
    recall:       hasPermission(r, "customers.view"),

    // นัดหมาย: ทุก role ยกเว้น CASHIER
    appointments: r.some(x => ["OWNER","MANAGER","OD","OPTICIAN","SALES","SELLER"].includes(x)),

    claims:       hasPermission(r, "customers.view"),
    branchSelect: true,

    // เปิด-ปิดกะ: OWNER, MANAGER, SALES, CASHIER (ตาม table)
    shift:        r.some(x => ["OWNER","MANAGER","SALES","CASHIER","SELLER"].includes(x)),

    // รับสินค้า / โอนสต็อก: OWNER, MANAGER, SALES เท่านั้น (ตาม table)
    stockReceive:  r.some(x => ["OWNER","MANAGER","SALES","SELLER"].includes(x)),
    stockTransfer: r.some(x => ["OWNER","MANAGER","SALES","SELLER"].includes(x)),

    // การชำระเงิน: OWNER, MANAGER, SALES, CASHIER
    payments:     r.some(x => ["OWNER","MANAGER","SALES","CASHIER","SELLER"].includes(x)),
  };
}


// ─── Role Metadata (for UI) ───────────────────────────────────────────────────
export const ROLE_INFO: Record<string, {
  label: string; labelEn: string; description: string;
  color: string; bgColor: string; border: string;
}> = {
  SUPER_ADMIN: {
    label: "Super Admin", labelEn: "Super Admin",
    description: "สิทธิ์สูงสุดของแพลตฟอร์ม",
    color: "text-red-400", bgColor: "bg-red-500/20", border: "border-red-500/30",
  },
  OWNER: {
    label: "เจ้าของร้าน", labelEn: "Owner",
    description: "สิทธิ์สูงสุดในร้าน เข้าถึงทุกฟังก์ชัน รวมต้นทุน กำไร Billing",
    color: "text-amber-400", bgColor: "bg-amber-500/20", border: "border-amber-500/30",
  },
  MANAGER: {
    label: "ผู้จัดการ", labelEn: "Manager",
    description: "บริหารงานประจำวัน ยกเว้นตั้งค่าร้าน กำหนด Role และ Billing",
    color: "text-blue-400", bgColor: "bg-blue-500/20", border: "border-blue-500/30",
  },
  OD: {
    label: "นักทัศนมาตร", labelEn: "OD / Optometrist",
    description: "เดียวที่วัดสายตาและบันทึก/แก้ไขค่าสายตาได้ ไม่ยุ่งกับการเงิน",
    color: "text-violet-400", bgColor: "bg-violet-500/20", border: "border-violet-500/30",
  },
  OPTICIAN: {
    label: "ช่างแว่น", labelEn: "Optician",
    description: "ประกอบแว่น จัดการงาน Lab ปรับสต็อก ไม่รับเงิน",
    color: "text-cyan-400", bgColor: "bg-cyan-500/20", border: "border-cyan-500/30",
  },
  SALES: {
    label: "พนักงานขาย", labelEn: "Sales",
    description: "ปิดการขาย ดูแลลูกค้า ให้ส่วนลดได้ ไม่จับเงินสด ไม่เห็นต้นทุน",
    color: "text-emerald-400", bgColor: "bg-emerald-500/20", border: "border-emerald-500/30",
  },
  CASHIER: {
    label: "พนักงานเก็บเงิน", labelEn: "Cashier",
    description: "เปิด/ปิดกะ รับเงิน ออกใบเสร็จ ให้ส่วนลดไม่ได้ ยกเลิกไม่ได้",
    color: "text-green-400", bgColor: "bg-green-500/20", border: "border-green-500/30",
  },
  SELLER: {
    label: "พนักงาน (เดิม)", labelEn: "Seller (Legacy)",
    description: "บทบาทเดิม — ควรใช้ SALES หรือ CASHIER แทน",
    color: "text-slate-400", bgColor: "bg-slate-500/20", border: "border-slate-500/30",
  },
};

export const TENANT_ROLES: AppRole[] = ["OWNER","MANAGER","OD","OPTICIAN","SALES","CASHIER"];
