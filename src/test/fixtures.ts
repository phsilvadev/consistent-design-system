import { authenticatedContext } from "@/lib/tenant/shared";
import type { Identity } from "@/lib/auth/contracts";
export const testIdentity: Identity = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    company_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Marina Silva",
    email: "marina@example.com",
    role: "admin",
    active: true,
  },
  company: {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Empresa de teste",
    plan: "trial",
    trial_started_at: 1700000000,
    trial_ends_at: 9999999999,
  },
  trial_expired: false,
};
export const testWorkspaceContext = authenticatedContext(testIdentity);
