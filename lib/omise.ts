// lib/omise.ts — Omise payment gateway client for EyeFocus SaaS
// Handles charges, customers, and recurring billing for Thai market

// Omise SDK uses CommonJS — import carefully for Edge compatibility
// We use it only in Node.js API routes (not Edge middleware)
import Omise from "omise";

const omise = Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY ?? "",
  secretKey: process.env.OMISE_SECRET_KEY ?? "",
});

export default omise;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OmiseCustomer {
  id: string;
  email: string;
  description?: string;
  defaultCard?: string;
}

export interface OmiseCharge {
  id: string;
  amount: number;   // satang (THB * 100)
  currency: string;
  status: "failed" | "expired" | "pending" | "reversed" | "successful";
  paid: boolean;
  metadata?: Record<string, string>;
  sourceType?: string;
  authorizeUri?: string;   // for PromptPay redirect
}

// ─── Plan pricing (satang = THB × 100) ──────────────────────────────────────
export const PLAN_PRICES_SATANG: Record<string, number> = {
  starter:    59000,   // ฿590
  pro:       149000,   // ฿1,490
  enterprise: 399000,  // ฿3,990
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Create an Omise Customer (to store card for recurring billing)
 */
export async function createOmiseCustomer(params: {
  email: string;
  description: string;
  cardToken: string;        // Omise.js token from frontend
}): Promise<string> {       // returns customer id
  const customer = await omise.customers.create({
    email: params.email,
    description: params.description,
    card: params.cardToken,
  });
  return customer.id;
}

/**
 * Charge a stored Omise Customer (monthly recurring)
 */
export async function chargeCustomer(params: {
  customerId: string;
  amount: number;           // satang
  description: string;
  metadata?: Record<string, string>;
}): Promise<OmiseCharge> {
  const charge = await omise.charges.create({
    amount: params.amount,
    currency: "thb",
    customer: params.customerId,
    description: params.description,
    metadata: params.metadata,
    capture: true,
  });
  return {
    id: charge.id,
    amount: charge.amount,
    currency: charge.currency,
    status: charge.status as OmiseCharge["status"],
    paid: charge.paid,
    metadata: charge.metadata as Record<string, string>,
  };
}

/**
 * Create a PromptPay QR charge (one-time, for manual plan payment)
 */
export async function createPromptPayCharge(params: {
  amount: number;    // satang
  description: string;
  metadata?: Record<string, string>;
}): Promise<OmiseCharge> {
  // Step 1: Create a PromptPay source
  const source = await omise.sources.create({
    amount: params.amount,
    currency: "thb",
    type: "promptpay",
  });

  // Step 2: Create charge using source ID
  const charge = await omise.charges.create({
    amount: params.amount,
    currency: "thb",
    source: source.id,   // pass source ID string
    description: params.description,
    metadata: params.metadata,
    return_uri: `${process.env.NEXT_PUBLIC_APP_URL}/seller/subscription?payment=success`,
  });
  return {
    id: charge.id,
    amount: charge.amount,
    currency: charge.currency,
    status: charge.status as OmiseCharge["status"],
    paid: charge.paid,
    metadata: charge.metadata as Record<string, string>,
    sourceType: "promptpay",
    authorizeUri: (charge as unknown as { authorize_uri?: string }).authorize_uri,
  };
}

/**
 * Verify Omise webhook signature
 * Omise signs webhooks with X-Omise-Signature header
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");
    return expected === signature;
  } catch {
    return false;
  }
}

/**
 * Retrieve a charge by ID (for status polling)
 */
export async function getCharge(chargeId: string): Promise<OmiseCharge> {
  const charge = await omise.charges.retrieve(chargeId);
  return {
    id: charge.id,
    amount: charge.amount,
    currency: charge.currency,
    status: charge.status as OmiseCharge["status"],
    paid: charge.paid,
    metadata: charge.metadata as Record<string, string>,
  };
}
