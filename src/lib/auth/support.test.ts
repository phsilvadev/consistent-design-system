import { afterEach, expect, it, vi } from "vitest";
import { supportApi } from "./support";
afterEach(() => vi.unstubAllGlobals());
const company = "11111111-1111-4111-8111-111111111111",
  user = "22222222-2222-4222-8222-222222222222";
const history = {
  company_id: company,
  user_id: user,
  available: true,
  items: [],
  daily_limit: 30,
  used_today: 0,
  retention_days: 30,
};
it("recusa histórico de outra empresa ou outro usuário", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(history))));
  await expect(supportApi.history("33333333-3333-4333-8333-333333333333", user)).rejects.toThrow(
    "validar",
  );
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(history))));
  await expect(supportApi.history(company, "33333333-3333-4333-8333-333333333333")).rejects.toThrow(
    "validar",
  );
});
it("envia só mensagem e identificador idempotente sem escolher empresa no browser", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        id: company,
        request_id: user,
        message: "Ajuda",
        answer: null,
        status: "processing",
        error: null,
        created_at: 1,
        sources: [],
      }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  await supportApi.send(user, "Ajuda");
  expect(fetch.mock.calls[0]?.[0]).toBe("/api/v1/support/messages");
  expect(JSON.parse(fetch.mock.calls[0]?.[1].body)).toEqual({ request_id: user, message: "Ajuda" });
});
