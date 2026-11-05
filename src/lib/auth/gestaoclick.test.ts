import { afterEach, expect, it, vi } from "vitest";
import { gestaoClick } from "./gestaoclick";
const company = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const data = {
  company_id: company,
  enabled: true,
  base_url: "https://erp.example.com/api",
  has_credentials: true,
  status: "credentials_saved",
  version: 1,
  updated_at: 1,
};
afterEach(() => vi.unstubAllGlobals());
it("rejeita configuração de outra empresa", async () => {
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
  await expect(gestaoClick(company)).rejects.toThrow("configuração da empresa");
});
it("não envia tokens ao manter credenciais existentes", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(data)));
  vi.stubGlobal("fetch", fetch);
  const result = await gestaoClick(company, "save", { base_url: data.base_url, version: 1 });
  expect(result.status).toBe("credentials_saved");
  expect(JSON.parse(fetch.mock.calls[0]?.[1]?.body)).not.toHaveProperty("access_token");
  expect(JSON.parse(fetch.mock.calls[0]?.[1]?.body)).not.toHaveProperty("secret_access_token");
});
