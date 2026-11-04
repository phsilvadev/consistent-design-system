import { z } from "zod";
export const SESSION_COOKIE = "atendehub_session";
export const identitySchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    company_id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["admin", "supervisor", "seller", "operator"]),
    active: z.boolean(),
  }),
  company: z.object({
    id: z.string().uuid(),
    name: z.string(),
    plan: z.string(),
    trial_started_at: z.number(),
    trial_ends_at: z.number(),
  }),
  trial_expired: z.boolean(),
});
export type Identity = z.infer<typeof identitySchema>;
export function belongsToTenant(identity: Identity, tenant: string): boolean {
  return (
    identity.user.active &&
    identity.user.company_id === identity.company.id &&
    identity.company.id === tenant
  );
}
