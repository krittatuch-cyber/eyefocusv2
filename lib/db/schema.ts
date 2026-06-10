// lib/db/schema.ts — EyeFocus V2 Drizzle Schema (Multi-tenant)
import {
  pgTable,
  text,
  varchar,
  boolean,
  integer,
  real,
  timestamp,
  uuid,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── ENUMS ──────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", [
  "SUPER_ADMIN", "OWNER", "MANAGER",
  "OD", "OPTICIAN", "SALES", "CASHIER",
  "SELLER", // legacy — kept for backward compat
]);
export const shiftStatusEnum = pgEnum("shift_status", ["OPEN", "CLOSED"]);
export const orderStatusEnum = pgEnum("order_status", ["PENDING", "PAID", "CANCELLED"]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH", "QR_PROMPTPAY", "CREDIT_CARD", "INSTALLMENT",
]);
export const jobStatusEnum = pgEnum("job_status", [
  "PENDING", "PREPARING", "SEND_TO_LAB", "LAB_PROCESSING", "RECEIVED_FROM_LAB",
  "READY_FOR_PICKUP", "DELIVERED",
]);
export const productCategoryEnum = pgEnum("product_category", [
  "FRAME", "LENS", "CONTACT_LENS", "SUNGLASSES", "ACCESSORY", "OTHER",
]);
export const stockTransferStatusEnum = pgEnum("stock_transfer_status", [
  "PENDING", "SHIPPED", "RECEIVED", "CANCELLED",
]);
export const claimStatusEnum = pgEnum("claim_status", [
  "PENDING", "IN_REVIEW", "RESOLVED", "REJECTED",
]);
export const loyaltyTierEnum = pgEnum("loyalty_tier", [
  "BRONZE", "SILVER", "GOLD", "PLATINUM",
]);
export const auditActionEnum = pgEnum("audit_action", [
  // ── Order ────────────────────────────────────────────────────────────────
  "ORDER_CREATED", "ORDER_UPDATED", "ORDER_CANCELLED",
  "ORDER_DISCOUNT_APPLIED", "ORDER_REFUNDED",
  // ── Shift ────────────────────────────────────────────────────────────────
  "SHIFT_OPEN", "SHIFT_CLOSE",
  "SHIFT_OPENED", "SHIFT_CLOSED",           // canonical aliases
  // ── Product / Stock ──────────────────────────────────────────────────────
  "PRODUCT_CREATED", "PRODUCT_UPDATED", "PRODUCT_DELETED",
  "STOCK_ADJUSTED", "STOCK_TRANSFER",
  "STOCK_TRANSFER_CREATED", "STOCK_TRANSFER_RECEIVED",
  // ── User ─────────────────────────────────────────────────────────────────
  "USER_CREATED", "USER_UPDATED", "USER_ROLE_CHANGED",
  "USER_DEACTIVATED", "USER_PASSWORD_RESET",
  // ── Branch ───────────────────────────────────────────────────────────────
  "BRANCH_CREATED", "BRANCH_UPDATED",
  // ── Customer ─────────────────────────────────────────────────────────────
  "CUSTOMER_CREATED", "CUSTOMER_UPDATED", "CUSTOMER_DELETED",
  "CUSTOMER_PII_VIEWED",
  // ── Loyalty ──────────────────────────────────────────────────────────────
  "LOYALTY_ADJUSTED",
  // ── Claims ───────────────────────────────────────────────────────────────
  "CLAIM_CREATED", "CLAIM_UPDATED",
  // ── Prescriptions ────────────────────────────────────────────────────────
  "PRESCRIPTION_CREATED", "PRESCRIPTION_UPDATED", "PRESCRIPTION_DELETED",
  // ── Auth ─────────────────────────────────────────────────────────────────
  "SYSTEM_LOGIN", "SYSTEM_LOGOUT",
  "AUTH_LOGIN_FAILED", "AUTH_PASSWORD_CHANGED", "AUTH_LOCKED",
  // ── Appointments ─────────────────────────────────────────────────────────
  "APPOINTMENT_CREATED",
  // ── Payments ─────────────────────────────────────────────────────────────
  "PAYMENT_RECEIVED",
  // ── Lab ──────────────────────────────────────────────────────────────────
  "LAB_JOB_CREATED", "LAB_STATUS_CHANGED", "LAB_JOB_DELIVERED",
  // ── Billing ──────────────────────────────────────────────────────────────
  "BILLING_SUBSCRIBE", "BILLING_FAILED",
  "BILLING_PAYMENT_SUCCESS", "BILLING_CHARGED",
  // ── Tenant / Plan ────────────────────────────────────────────────────────
  "TENANT_SUSPENDED", "TENANT_ACTIVATED",
  "PLAN_CHANGED", "TRIAL_EXTENDED",
  "TENANT_PLAN_CHANGED", "TENANT_DUNNING_RESET", "TENANT_TRIAL_EXTENDED",
  // ── GDPR ─────────────────────────────────────────────────────────────────
  "GDPR_EXPORT", "GDPR_ERASE_REQUEST", "GDPR_ERASE",
  // ── Audit ────────────────────────────────────────────────────────────────
  "AUDIT_LOG_VIEWED", "AUDIT_LOG_EXPORTED",
]);

// ─── TENANTS ─────────────────────────────────────────────────────────────────
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  taxId: varchar("tax_id", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true).notNull(),
  planType: varchar("plan_type", { length: 50 }).default("starter").notNull(),
  planExpiresAt: timestamp("plan_expires_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  maxBranches: integer("max_branches").default(1).notNull(),
  maxUsers: integer("max_users").default(5).notNull(),
  isSuspended: boolean("is_suspended").default(false).notNull(),
  // ─── Billing (Omise) ──────────────────────────────────────────────────────
  omiseCustomerId: varchar("omise_customer_id", { length: 50 }),    // stored card
  lastChargeId: varchar("last_charge_id", { length: 50 }),          // last Omise charge
  billingEmail: varchar("billing_email", { length: 255 }),
  paymentMethod: varchar("payment_method", { length: 20 }).default("promptpay"),
  dunningCount: integer("dunning_count").default(0).notNull(),
  dunningNextAttemptAt: timestamp("dunning_next_attempt_at"),
  // ─── Permission Overrides (OWNER-editable) ────────────────────────────────
  // JSON map: { "prescriptions.create": ["OWNER","MANAGER","OD"], ... }
  // Null = use code-defined defaults in permissions.ts
  permissionsConfig: jsonb("permissions_config").$type<Record<string, string[]>>(),
  // ─────────────────────────────────────────────────────────────────────────
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// ─── BRANCHES ────────────────────────────────────────────────────────────────
export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  openTime: varchar("open_time", { length: 10 }),
  closeTime: varchar("close_time", { length: 10 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("branches_tenant_code_idx").on(t.tenantId, t.code),
  index("branches_tenant_idx").on(t.tenantId),
]);

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").default("SALES").notNull(), // primary/display role
  roles: text("roles").array().default(["SALES"]).notNull(), // multi-role support
  phone: varchar("phone", { length: 20 }),
  jobTitle: varchar("job_title", { length: 255 }),
  photoUrl: text("photo_url"),
  branchId: uuid("branch_id").references(() => branches.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("users_tenant_email_idx").on(t.tenantId, t.email),
  index("users_tenant_idx").on(t.tenantId),
]);

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  lineId: varchar("line_id", { length: 100 }),
  gender: varchar("gender", { length: 20 }),
  birthDate: timestamp("birth_date"),
  address: text("address"),
  taxId: varchar("tax_id", { length: 20 }),
  photoUrl: text("photo_url"),
  medicalHistory: text("medical_history"),
  notes: text("notes"),
  loyaltyPoints: integer("loyalty_points").default(0).notNull(),
  loyaltyTier: loyaltyTierEnum("loyalty_tier").default("BRONZE").notNull(),
  branchId: uuid("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("customers_tenant_idx").on(t.tenantId),
  index("customers_tenant_phone_idx").on(t.tenantId, t.phone),
]);

// ─── EYE PRESCRIPTIONS ───────────────────────────────────────────────────────
export const eyePrescriptions = pgTable("eye_prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  recorderId: uuid("recorder_id").references(() => users.id),
  recorderName: varchar("recorder_name", { length: 255 }),
  // Right Eye (OD)
  sphR: real("sph_r"),
  cylR: real("cyl_r"),
  axisR: integer("axis_r"),
  pdR: real("pd_r"),
  addR: real("add_r"),
  vaR: varchar("va_r", { length: 10 }),
  // Left Eye (OS)
  sphL: real("sph_l"),
  cylL: real("cyl_l"),
  axisL: integer("axis_l"),
  pdL: real("pd_l"),
  addL: real("add_l"),
  vaL: varchar("va_l", { length: 10 }),
  // Additional info
  oldGlassesNotes: text("old_glasses_notes"),
  medicalHistory: text("medical_history"),
  frameType: varchar("frame_type", { length: 100 }),
  notes: text("notes"),
}, (t) => [
  index("rx_tenant_customer_idx").on(t.tenantId, t.customerId),
]);

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: productCategoryEnum("category").notNull(),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  price: real("price").notNull(),
  cost: real("cost").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("products_tenant_code_idx").on(t.tenantId, t.code),
  index("products_tenant_idx").on(t.tenantId),
]);

// ─── STOCKS ──────────────────────────────────────────────────────────────────
export const stocks = pgTable("stocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(0).notNull(),
  minAlert: integer("min_alert").default(5).notNull(),
}, (t) => [
  uniqueIndex("stocks_product_branch_idx").on(t.productId, t.branchId),
  index("stocks_tenant_idx").on(t.tenantId),
]);

// ─── SHIFTS ──────────────────────────────────────────────────────────────────
export const shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  startingCash: real("starting_cash").notNull(),
  expectedCash: real("expected_cash"),
  actualCash: real("actual_cash"),
  difference: real("difference"),
  status: shiftStatusEnum("status").default("OPEN").notNull(),
  notes: text("notes"),
}, (t) => [
  index("shifts_tenant_idx").on(t.tenantId),
]);

// ─── ORDERS ──────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  sellerId: uuid("seller_id").notNull().references(() => users.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  shiftId: uuid("shift_id").references(() => shifts.id),
  totalAmount: real("total_amount").notNull(),
  discountAmount: real("discount_amount").default(0).notNull(),
  netAmount: real("net_amount").notNull(),
  paidAmount: real("paid_amount").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  isETaxRequested: boolean("is_etax_requested").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("orders_tenant_number_idx").on(t.tenantId, t.orderNumber),
  index("orders_tenant_idx").on(t.tenantId),
  index("orders_tenant_branch_idx").on(t.tenantId, t.branchId),
]);

// ─── ORDER ITEMS ─────────────────────────────────────────────────────────────
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  discount: real("discount").default(0).notNull(),
}, (t) => [index("order_items_tenant_idx").on(t.tenantId)]);

// ─── JOB TICKETS ─────────────────────────────────────────────────────────────
export const jobTickets = pgTable("job_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  labId: uuid("lab_id"),
  labName: varchar("lab_name", { length: 255 }),
  status: jobStatusEnum("status").default("PENDING").notNull(),
  lensType: varchar("lens_type", { length: 255 }),
  lensDetails: text("lens_details"),
  sphR: real("sph_r"),
  cylR: real("cyl_r"),
  axisR: integer("axis_r"),
  addR: real("add_r"),
  sphL: real("sph_l"),
  cylL: real("cyl_l"),
  axisL: integer("axis_l"),
  addL: real("add_l"),
  pd: real("pd"),
  notes: text("notes"),
  targetDate: timestamp("target_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("job_tickets_tenant_idx").on(t.tenantId)]);

// ─── INSTALLMENTS ────────────────────────────────────────────────────────────
export const installments = pgTable("installments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  termNumber: integer("term_number").notNull(),
  amount: real("amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
}, (t) => [index("installments_tenant_idx").on(t.tenantId)]);

// ─── APPOINTMENTS ────────────────────────────────────────────────────────────
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  appointmentNumber: varchar("appointment_number", { length: 50 }).notNull(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  sellerId: uuid("seller_id").notNull().references(() => users.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  purpose: text("purpose").notNull(),
  totalAmount: real("total_amount").default(0).notNull(),
  depositAmount: real("deposit_amount").default(0).notNull(),
  status: varchar("status", { length: 30 }).default("SCHEDULED").notNull(),
  lineSent: boolean("line_sent").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("appointments_tenant_idx").on(t.tenantId)]);

// ─── CLAIMS ──────────────────────────────────────────────────────────────────
export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  customerId: uuid("customer_id").references(() => customers.id),
  reason: text("reason").notNull(),
  status: claimStatusEnum("status").default("PENDING").notNull(),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("claims_tenant_idx").on(t.tenantId)]);

// ─── STOCK TRANSFERS ─────────────────────────────────────────────────────────
export const stockTransfers = pgTable("stock_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  fromBranchId: uuid("from_branch_id").notNull().references(() => branches.id),
  toBranchId: uuid("to_branch_id").notNull().references(() => branches.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  senderId: uuid("sender_id").notNull().references(() => users.id),
  receiverId: uuid("receiver_id").references(() => users.id),
  status: stockTransferStatusEnum("status").default("PENDING").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("stock_transfers_tenant_idx").on(t.tenantId)]);

// ─── SUPPLIERS ───────────────────────────────────────────────────────────────
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  contact: varchar("contact", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  categories: text("categories").array(),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("suppliers_tenant_idx").on(t.tenantId)]);

// ─── LAB VENDORS ─────────────────────────────────────────────────────────────
export const labVendors = pgTable("lab_vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  contact: varchar("contact", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  turnaroundDays: integer("turnaround_days").default(3).notNull(),
  specialties: text("specialties").array(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("lab_vendors_tenant_idx").on(t.tenantId)]);

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  userName: varchar("user_name", { length: 255 }).notNull(),
  action: auditActionEnum("action").notNull(),
  target: varchar("target", { length: 255 }),
  detail: text("detail"),
  severity: varchar("severity", { length: 10 }).notNull().default("LOW"),
  userRole: varchar("user_role", { length: 50 }),
  status: varchar("status", { length: 10 }).notNull().default("success"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("audit_logs_tenant_idx").on(t.tenantId),
  index("audit_logs_tenant_created_idx").on(t.tenantId, t.createdAt),
]);

// ─── COMMISSION RULES ────────────────────────────────────────────────────────
export const commissionRules = pgTable("commission_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  ratePercent: real("rate_percent").notNull(),
  targetMonthly: real("target_monthly").default(0).notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("commission_rules_user_idx").on(t.tenantId, t.userId),
]);

// ─── RELATIONS ───────────────────────────────────────────────────────────────
export const tenantsRelations = relations(tenants, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  customers: many(customers),
  products: many(products),
  orders: many(orders),
  auditLogs: many(auditLogs),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
  users: many(users),
  stocks: many(stocks),
  orders: many(orders),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [users.branchId], references: [branches.id] }),
  orders: many(orders),
  shifts: many(shifts),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  seller: one(users, { fields: [orders.sellerId], references: [users.id] }),
  branch: one(branches, { fields: [orders.branchId], references: [branches.id] }),
  items: many(orderItems),
  jobTicket: one(jobTickets, { fields: [orders.id], references: [jobTickets.orderId] }),
  installments: many(installments),
  claims: many(claims),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [customers.tenantId], references: [tenants.id] }),
  eyePrescriptions: many(eyePrescriptions),
  orders: many(orders),
  appointments: many(appointments),
}));

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Branch = typeof branches.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Stock = typeof stocks.$inferSelect;
export type JobTicket = typeof jobTickets.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
