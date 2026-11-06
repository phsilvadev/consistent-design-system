import { afterEach, describe, expect, it, vi } from "vitest";
import { products, productSync } from "./products";
const company = "11111111-1111-4111-8111-111111111111";
afterEach(() => vi.unstubAllGlobals());
describe("Catálogo e sincronização por empresa", () => {
  it("valida a empresa retornada e rejeita um catálogo de outro tenant", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            company_id: "22222222-2222-4222-8222-222222222222",
            total: 0,
            page: 1,
            page_size: 20,
            items: [],
          }),
        ),
      ),
    );
    await expect(products(company, "", 1)).rejects.toThrow("catálogo desta empresa");
  });
  it("busca nomes com parâmetros codificados", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ company_id: company, total: 0, page: 1, page_size: 20, items: [] }),
        ),
      );
    vi.stubGlobal("fetch", fetcher);
    await products(company, "metalon & chapa", 1);
    expect(fetcher.mock.calls[0]![0]).toBe("/api/v1/products?q=metalon+%26+chapa&page=1");
  });
  it("envia somente o identificador da execução ao continuar", async () => {
    const run = "33333333-3333-4333-8333-333333333333";
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          company_id: company,
          run_id: run,
          status: "completed",
          processed: 0,
          pages_done: 1,
          total_pages: 1,
          started_at: 1,
          completed_at: 2,
          last_success_at: 2,
          error_code: null,
        }),
      ),
    );
    vi.stubGlobal("fetch", fetcher);
    await expect(productSync(company, "next", { run_id: run })).resolves.toHaveProperty(
      "status",
      "completed",
    );
    expect(fetcher.mock.calls[0]![1].body).toBe(JSON.stringify({ run_id: run }));
  });
});
