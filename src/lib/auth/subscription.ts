import { z } from "zod";
import { apiRequest, ApiError } from "./client";
export const planSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string(),
  monthly_price_cents: z.number().int().nonnegative(),
  currency: z.literal("BRL"),
  user_limit: z.number().int().positive(),
  features: z.array(z.string()),
  is_demo: z.boolean(),
});
export type Plan = z.infer<typeof planSchema>;
const schema = z.object({
  company_id: z.string().uuid(),
  plan_code: z.string(),
  plan_name: z.string(),
  current_plan: planSchema.nullable(),
  available_plans: z.array(planSchema),
  status: z.enum(["trial_active", "trial_expired", "active"]),
  trial_started_at: z.number().nullable(),
  trial_ends_at: z.number().nullable(),
  trial_days_remaining: z.number().int().nonnegative().nullable(),
  total_users: z.number().int().nonnegative(),
  active_users: z.number().int().nonnegative(),
  billing_enabled: z.literal(false),
});
export type Subscription = z.infer<typeof schema>;
export async function getSubscription(companyId: string) {
  const result = schema.safeParse(await apiRequest("/company/subscription"));
  if (!result.success || result.data.company_id !== companyId)
    throw new ApiError(502, "Não foi possível validar a assinatura da empresa.");
  return result.data;
}
export function planPrice(plan: Plan) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: plan.currency,
    minimumFractionDigits: plan.monthly_price_cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(plan.monthly_price_cents / 100);
}
export function subscriptionDate(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(timestamp * 1000));
}
