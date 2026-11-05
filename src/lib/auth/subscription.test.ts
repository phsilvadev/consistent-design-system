import { afterEach, describe, expect, it, vi } from "vitest";
import { getSubscription, planPrice, subscriptionDate } from "./subscription";
import { testIdentity } from "@/test/fixtures";
const fixture = {
  company_id: testIdentity.company.id,
  plan_code: "trial",
  plan_name: "Teste gratuito",
  current_plan: null,
  status: "trial_active",
  trial_started_at: 1,
  trial_ends_at: 604801,
  trial_days_remaining: 7,
  total_users: 1,
  active_users: 1,
  billing_enabled: false,
  available_plans: [],
};
afterEach(() => vi.unstubAllGlobals());
describe("assinatura", () => {
  it("consome catálogo da API sem preencher planos fictícios no front", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture))));
    expect((await getSubscription(testIdentity.company.id)).available_plans).toEqual([]);
  });
  it("rejeita outra empresa e dados inválidos", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ ...fixture, company_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }),
          ),
        ),
    );
    await expect(getSubscription(testIdentity.company.id)).rejects.toThrow("validar a assinatura");
  });
  it("formata preço em reais e data em São Paulo", () => {
    expect(
      planPrice({
        code: "sample",
        name: "Plano banco",
        description: "",
        monthly_price_cents: 14900,
        currency: "BRL",
        user_limit: 3,
        features: [],
        is_demo: true,
      }),
    ).toContain("149");
    expect(subscriptionDate(Date.UTC(2026, 10, 5, 1) / 1000)).toContain("04");
  });
});

it("preserva centavos do preço cadastrado no banco", () => {
  expect(
    planPrice({
      code: "sample",
      name: "Plano",
      description: "",
      monthly_price_cents: 14950,
      currency: "BRL",
      user_limit: 3,
      features: [],
      is_demo: true,
    }),
  ).toContain("149,50");
});
