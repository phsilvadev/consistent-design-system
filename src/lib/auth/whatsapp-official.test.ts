import { afterEach, expect, it, vi } from "vitest";
import { officialWhatsApp } from "./whatsapp-official";
const company = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const data = {
  company_id: company,
  enabled: true,
  status: "validated",
  phone_number_id: "12345",
  waba_id: "67890",
  display_phone_number: "+5511999990000",
  verified_name: "Teste",
  has_token: true,
  verified_at: 1,
  last_received_at: null,
  version: 1,
  webhook_url: null,
  webhook_configured: false,
  platform_app_configured: false,
  diagnostics: {},
};
afterEach(() => vi.unstubAllGlobals());
it("envia token apenas na operação explícita de salvamento", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(data)));
  vi.stubGlobal("fetch", fetch);
  const result = await officialWhatsApp(company, "connect", {
    phone_number_id: "12345",
    waba_id: "67890",
    version: 0,
    access_token: "test-only-secret",
  });
  expect(result.has_token).toBe(true);
  expect(fetch.mock.calls[0]?.[1]?.body).toContain("test-only-secret");
  expect("access_token" in result).toBe(false);
});
it("bloqueia metadados de outra empresa", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ ...data, company_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }),
        ),
      ),
  );
  await expect(officialWhatsApp(company)).rejects.toThrow("configuração da empresa");
});
it("mantém o token ausente quando reutiliza a credencial salva", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(data)));
  vi.stubGlobal("fetch", fetch);
  await officialWhatsApp(company, "connect", {
    phone_number_id: "12345",
    waba_id: "67890",
    version: 1,
  });
  expect(JSON.parse(fetch.mock.calls[0]?.[1]?.body)).not.toHaveProperty("access_token");
});
