// lib/plans.ts — SaaS plan definitions and feature gating for EyeFocus

export type PlanType = "starter" | "pro" | "enterprise";

export interface PlanConfig {
  id: PlanType;
  name: string;
  nameTh: string;
  price: number;
  maxBranches: number; // -1 = unlimited
  maxUsers: number;    // -1 = unlimited
  features: FeatureKey[];
}

export type FeatureKey =
  | "pos" | "customers" | "stock" | "prescriptions" | "appointments"
  | "reports_basic" | "reports_advanced" | "commission" | "lab_tracking"
  | "claims" | "tax_invoices" | "multi_branch" | "branch_comparison"
  | "audit_logs" | "loyalty" | "suppliers" | "installments";

export const PLANS: Record<PlanType, PlanConfig> = {
  starter: {
    id: "starter", name: "Starter", nameTh: "สตาร์ทเตอร์", price: 590,
    maxBranches: 1, maxUsers: 5,
    features: ["pos","customers","stock","prescriptions","appointments","reports_basic","loyalty"],
  },
  pro: {
    id: "pro", name: "Pro", nameTh: "โปร", price: 1490,
    maxBranches: 3, maxUsers: 15,
    features: ["pos","customers","stock","prescriptions","appointments","reports_basic",
      "reports_advanced","commission","lab_tracking","claims","tax_invoices",
      "multi_branch","branch_comparison","audit_logs","loyalty","suppliers","installments"],
  },
  enterprise: {
    id: "enterprise", name: "Enterprise", nameTh: "เอนเตอร์ไพรส์", price: 3990,
    maxBranches: -1, maxUsers: -1,
    features: ["pos","customers","stock","prescriptions","appointments","reports_basic",
      "reports_advanced","commission","lab_tracking","claims","tax_invoices",
      "multi_branch","branch_comparison","audit_logs","loyalty","suppliers","installments"],
  },
};

export function planHasFeature(planType: string, feature: FeatureKey): boolean {
  const plan = PLANS[planType as PlanType];
  return plan ? plan.features.includes(feature) : false;
}

export function getTrialDaysRemaining(trialEndsAt: Date | string | null): number | null {
  if (!trialEndsAt) return null;
  const diff = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000);
  return diff > 0 ? diff : 0;
}
