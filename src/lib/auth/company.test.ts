import { afterEach, describe, expect, it, vi } from "vitest";
import { companyApi } from "./company";
import { testIdentity } from "@/test/fixtures";
export const companyFixture = {
  company_id: testIdentity.company.id,
  name: "Distribuidora Alfa",
  legal_name: "",
  tax_id: "",
  phone: "",
  email: "",
  postal_code: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  timezone: "America/Sao_Paulo",
  business_hours: Object.fromEntries(
    ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => [
      day,
      { enabled: false, opens: null, closes: null },
    ]),
  ),
};
afterEach(() => vi.unstubAllGlobals());
describe("configurações da empresa", () => {
  it("valida a empresa da sessão sem enviar identificador no corpo", async () => {
    const fetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response(JSON.stringify(companyFixture))));
    vi.stubGlobal("fetch", fetch);
    const loaded = await companyApi.get(testIdentity.company.id);
    await companyApi.save(testIdentity.company.id, loaded);
    expect(fetch.mock.calls[1]?.[0]).toBe("/api/v1/company/settings");
    expect(fetch.mock.calls[1]?.[1].method).toBe("PATCH");
    expect(JSON.parse(fetch.mock.calls[1]?.[1].body)).not.toHaveProperty("company_id");
  });
  it("rejeita dados de outro tenant", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ...companyFixture,
            company_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          }),
        ),
      ),
    );
    await expect(companyApi.get(testIdentity.company.id)).rejects.toThrow("validar os dados");
  });
  it("falhas da API não viram sucesso", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ detail: "Acesso negado" }), { status: 403 }),
        ),
    );
    await expect(companyApi.get(testIdentity.company.id)).rejects.toMatchObject({ status: 403 });
  });
});
