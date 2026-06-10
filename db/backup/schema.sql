-- EyeFocus V2 — Database Schema DDL
-- Generated: 2026-06-10T03:57:19.662Z
-- ⚠️  Auto-generated — do not edit manually

-- Table: appointments
CREATE TABLE IF NOT EXISTS "appointments" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "appointment_number" CHARACTER VARYING(50) NOT NULL,
  "customer_id" UUID NOT NULL,
  "seller_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "scheduled_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "purpose" TEXT NOT NULL,
  "total_amount" REAL DEFAULT 0 NOT NULL,
  "deposit_amount" REAL DEFAULT 0 NOT NULL,
  "status" CHARACTER VARYING(30) DEFAULT 'SCHEDULED'::character varying NOT NULL,
  "line_sent" BOOLEAN DEFAULT false NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID,
  "user_name" CHARACTER VARYING(255) NOT NULL,
  "action" USER-DEFINED NOT NULL,
  "target" CHARACTER VARYING(255),
  "detail" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "ip_address" CHARACTER VARYING(45),
  "user_agent" TEXT,
  "metadata" JSONB,
  "severity" CHARACTER VARYING(10) DEFAULT 'LOW'::character varying NOT NULL,
  "user_role" CHARACTER VARYING(50),
  "status" CHARACTER VARYING(10) DEFAULT 'success'::character varying NOT NULL,
  "old_value" JSONB,
  "new_value" JSONB
);

-- Table: branches
CREATE TABLE IF NOT EXISTS "branches" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" CHARACTER VARYING(255) NOT NULL,
  "code" CHARACTER VARYING(20) NOT NULL,
  "address" TEXT,
  "phone" CHARACTER VARYING(20),
  "open_time" CHARACTER VARYING(10),
  "close_time" CHARACTER VARYING(10),
  "is_active" BOOLEAN DEFAULT true NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- Table: claims
CREATE TABLE IF NOT EXISTS "claims" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "customer_id" UUID,
  "reason" TEXT NOT NULL,
  "status" USER-DEFINED DEFAULT 'PENDING'::claim_status NOT NULL,
  "resolution" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- Table: commission_rules
CREATE TABLE IF NOT EXISTS "commission_rules" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "rate_percent" REAL NOT NULL,
  "target_monthly" REAL DEFAULT 0 NOT NULL,
  "notes" TEXT,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- Table: customers
CREATE TABLE IF NOT EXISTS "customers" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" CHARACTER VARYING(255) NOT NULL,
  "phone" CHARACTER VARYING(20) NOT NULL,
  "email" CHARACTER VARYING(255),
  "line_id" CHARACTER VARYING(100),
  "gender" CHARACTER VARYING(20),
  "birth_date" TIMESTAMP WITHOUT TIME ZONE,
  "notes" TEXT,
  "loyalty_points" INTEGER DEFAULT 0 NOT NULL,
  "loyalty_tier" USER-DEFINED DEFAULT 'BRONZE'::loyalty_tier NOT NULL,
  "branch_id" UUID,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "name_en" CHARACTER VARYING(255),
  "address" TEXT,
  "tax_id" CHARACTER VARYING(20),
  "photo_url" TEXT,
  "medical_history" TEXT,
  "pdpa_consent" BOOLEAN DEFAULT false NOT NULL,
  "consent_date" TIMESTAMP WITH TIME ZONE,
  "data_erasure_requested_at" TIMESTAMP WITH TIME ZONE
);

-- Table: eye_prescriptions
CREATE TABLE IF NOT EXISTS "eye_prescriptions" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "recorded_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "recorder_id" UUID,
  "sph_r" REAL,
  "cyl_r" REAL,
  "axis_r" INTEGER,
  "pd_r" REAL,
  "add_r" REAL,
  "sph_l" REAL,
  "cyl_l" REAL,
  "axis_l" INTEGER,
  "pd_l" REAL,
  "add_l" REAL,
  "notes" TEXT,
  "recorder_name" CHARACTER VARYING(255),
  "va_r" CHARACTER VARYING(10),
  "va_l" CHARACTER VARYING(10),
  "old_glasses_notes" TEXT,
  "medical_history" TEXT,
  "frame_type" CHARACTER VARYING(100)
);

-- Table: installments
CREATE TABLE IF NOT EXISTS "installments" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "order_id" UUID NOT NULL,
  "term_number" INTEGER NOT NULL,
  "amount" REAL NOT NULL,
  "due_date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "paid_date" TIMESTAMP WITHOUT TIME ZONE,
  "status" CHARACTER VARYING(20) DEFAULT 'PENDING'::character varying NOT NULL,
  "tenant_id" UUID NOT NULL
);

-- Table: job_tickets
CREATE TABLE IF NOT EXISTS "job_tickets" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "lab_id" UUID,
  "lab_name" CHARACTER VARYING(255),
  "status" USER-DEFINED DEFAULT 'PENDING'::job_status NOT NULL,
  "lens_type" CHARACTER VARYING(255),
  "lens_details" TEXT,
  "sph_r" REAL,
  "cyl_r" REAL,
  "axis_r" INTEGER,
  "add_r" REAL,
  "sph_l" REAL,
  "cyl_l" REAL,
  "axis_l" INTEGER,
  "add_l" REAL,
  "pd" REAL,
  "notes" TEXT,
  "target_date" TIMESTAMP WITHOUT TIME ZONE,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- Table: lab_vendors
CREATE TABLE IF NOT EXISTS "lab_vendors" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" CHARACTER VARYING(255) NOT NULL,
  "contact" CHARACTER VARYING(255),
  "phone" CHARACTER VARYING(20),
  "email" CHARACTER VARYING(255),
  "address" TEXT,
  "turnaround_days" INTEGER DEFAULT 3 NOT NULL,
  "specialties" ARRAY,
  "is_active" BOOLEAN DEFAULT true NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- Table: order_items
CREATE TABLE IF NOT EXISTS "order_items" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "order_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price" REAL NOT NULL,
  "discount" REAL DEFAULT 0 NOT NULL,
  "tenant_id" UUID NOT NULL
);

-- Table: orders
CREATE TABLE IF NOT EXISTS "orders" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "order_number" CHARACTER VARYING(50) NOT NULL,
  "customer_id" UUID,
  "seller_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "shift_id" UUID,
  "total_amount" REAL NOT NULL,
  "discount_amount" REAL DEFAULT 0 NOT NULL,
  "net_amount" REAL NOT NULL,
  "paid_amount" REAL NOT NULL,
  "payment_method" USER-DEFINED NOT NULL,
  "status" USER-DEFINED DEFAULT 'PENDING'::order_status NOT NULL,
  "is_etax_requested" BOOLEAN DEFAULT false NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- Table: products
CREATE TABLE IF NOT EXISTS "products" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "code" CHARACTER VARYING(100) NOT NULL,
  "name" CHARACTER VARYING(255) NOT NULL,
  "category" USER-DEFINED NOT NULL,
  "brand" CHARACTER VARYING(100),
  "model" CHARACTER VARYING(100),
  "price" REAL NOT NULL,
  "cost" REAL NOT NULL,
  "is_active" BOOLEAN DEFAULT true NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "image_url" TEXT
);

-- Table: shifts
CREATE TABLE IF NOT EXISTS "shifts" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "opened_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "closed_at" TIMESTAMP WITHOUT TIME ZONE,
  "starting_cash" REAL NOT NULL,
  "expected_cash" REAL,
  "actual_cash" REAL,
  "difference" REAL,
  "status" USER-DEFINED DEFAULT 'OPEN'::shift_status NOT NULL,
  "notes" TEXT
);

-- Table: stock_transfers
CREATE TABLE IF NOT EXISTS "stock_transfers" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "from_branch_id" UUID NOT NULL,
  "to_branch_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL,
  "sender_id" UUID NOT NULL,
  "receiver_id" UUID,
  "status" USER-DEFINED DEFAULT 'PENDING'::stock_transfer_status NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- Table: stocks
CREATE TABLE IF NOT EXISTS "stocks" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "quantity" INTEGER DEFAULT 0 NOT NULL,
  "min_alert" INTEGER DEFAULT 5 NOT NULL
);

-- Table: suppliers
CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" CHARACTER VARYING(255) NOT NULL,
  "contact" CHARACTER VARYING(255),
  "phone" CHARACTER VARYING(20),
  "email" CHARACTER VARYING(255),
  "address" TEXT,
  "categories" ARRAY,
  "payment_terms" CHARACTER VARYING(100),
  "is_active" BOOLEAN DEFAULT true NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- Table: tenants
CREATE TABLE IF NOT EXISTS "tenants" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "name" CHARACTER VARYING(255) NOT NULL,
  "slug" CHARACTER VARYING(100) NOT NULL,
  "tax_id" CHARACTER VARYING(20),
  "phone" CHARACTER VARYING(20),
  "address" TEXT,
  "logo_url" TEXT,
  "is_active" BOOLEAN DEFAULT true NOT NULL,
  "plan_type" CHARACTER VARYING(50) DEFAULT 'starter'::character varying NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "plan_expires_at" TIMESTAMP WITH TIME ZONE,
  "trial_ends_at" TIMESTAMP WITH TIME ZONE,
  "max_branches" INTEGER DEFAULT 1 NOT NULL,
  "max_users" INTEGER DEFAULT 5 NOT NULL,
  "is_suspended" BOOLEAN DEFAULT false NOT NULL,
  "omise_customer_id" CHARACTER VARYING(50),
  "last_charge_id" CHARACTER VARYING(50),
  "billing_email" CHARACTER VARYING(255),
  "payment_method" CHARACTER VARYING(20) DEFAULT 'promptpay'::character varying,
  "dunning_count" INTEGER DEFAULT 0 NOT NULL,
  "dunning_next_attempt_at" TIMESTAMP WITH TIME ZONE,
  "require_2fa" BOOLEAN DEFAULT false NOT NULL,
  "ip_allowlist" TEXT,
  "permissions_config" JSONB
);

-- Table: users
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" UUID NOT NULL,
  "email" CHARACTER VARYING(255) NOT NULL,
  "name" CHARACTER VARYING(255) NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" USER-DEFINED DEFAULT 'SELLER'::role NOT NULL,
  "phone" CHARACTER VARYING(20),
  "branch_id" UUID,
  "is_active" BOOLEAN DEFAULT true NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  "roles" ARRAY DEFAULT ARRAY['SALES'::text],
  "photo_url" TEXT,
  "job_title" CHARACTER VARYING(255)
);

