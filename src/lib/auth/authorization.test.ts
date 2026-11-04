import { afterEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { testIdentity } from "@/test/fixtures";
import { authenticatedContext } from "@/lib/tenant/shared";
import { belongsToTenant } from "./contracts";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
import { readSession } from "./server";
import { proxy } from "@/proxy";
const token = "token_de_teste_com_32_caracteres_123456";
const own = testIdentity.company.id;
function request(path: string, cookie = true) {
  return new NextRequest("http://localhost:3000" + path, {
    headers: cookie ? { cookie: `atendehub_session=${token}` } : {},
  });
}
function mockIdentity() {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(testIdentity), { status: 200 }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("identidade e autorização por empresa", () => {
  it("não autoriza uma URL pelo nome ou por ID diferente", () => {
    expect(belongsToTenant(testIdentity, own)).toBe(true);
    expect(belongsToTenant(testIdentity, "empresa-a")).toBe(false);
    expect(belongsToTenant(testIdentity, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")).toBe(false);
  });
  it("não cria contexto para vínculo inconsistente", () => {
    expect(() =>
      authenticatedContext({
        ...testIdentity,
        user: { ...testIdentity.user, company_id: "outra" },
      }),
    ).toThrow();
  });
  it("não consulta API sem token válido", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(await readSession()).toEqual({ status: "anonymous" });
    expect(await readSession("forged")).toEqual({ status: "anonymous" });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("valida sessão no backend sem cache e sem seguir redirecionamentos", async () => {
    const fetch = mockIdentity();
    expect((await readSession(token)).status).toBe("authenticated");
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      cache: "no-store",
      redirect: "error",
      headers: { Cookie: `atendehub_session=${token}` },
    });
  });
  it.each([401, 500])("sessão HTTP %s não libera acesso", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status })));
    expect((await readSession(token)).status).toBe(status === 401 ? "anonymous" : "unavailable");
  });
  it("resposta malformada ou vínculo inválido falha fechado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ...testIdentity,
            user: { ...testIdentity.user, company_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
          }),
        ),
      ),
    );
    expect((await readSession(token)).status).toBe("unavailable");
  });
  it("falha de rede não usa dados fictícios", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await readSession(token)).toEqual({ status: "unavailable" });
  });
});
describe("proxy (middleware Next 16)", () => {
  it("login, cadastro e logos são públicos sem carregar workspace", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    for (const path of [
      "/login",
      "/cadastro",
      "/acesso/login",
      "/outro/cadastro",
      "/atendehub-logo.png",
    ])
      expect((await proxy(request(path, false))).headers.get("x-middleware-next")).toBe("1");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("redireciona usuário sem sessão para login", async () => {
    const response = await proxy(request(`/${own}`, false));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });
  it.each(["", "/atendimentos", "/configuracoes", "/empresas", "/produtos"])(
    "libera apenas o tenant vinculado %s",
    async (path) => {
      mockIdentity();
      const response = await proxy(request(`/${own}${path}`));
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    },
  );
  it.each([
    "",
    "/atendimentos",
    "/configuracoes",
    "/clientes",
    "/empresas",
    "/produtos",
    "/relatorios",
    "/integracoes",
    "/orcamentos",
  ])("bloqueia qualquer página de outra empresa %s", async (path) => {
    mockIdentity();
    const response = await proxy(request(`/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb${path}`));
    expect(response.status).toBe(403);
    expect(await response.text()).toContain("Você não tem acesso a esta empresa");
    expect(response.headers.get("x-middleware-next")).toBeNull();
  });
  it("raiz redireciona apenas à empresa obtida na sessão", async () => {
    mockIdentity();
    expect((await proxy(request("/"))).headers.get("location")).toBe(
      `http://localhost:3000/${own}`,
    );
  });
  it("API indisponível devolve 503, sem liberar workspace", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const response = await proxy(request(`/${own}`));
    expect(response.status).toBe(503);
    expect(await response.text()).toContain("Não foi possível verificar seu acesso");
  });
  it("não confia em tenant ou papel enviados em cabeçalhos", async () => {
    mockIdentity();
    const response = await proxy(
      new NextRequest("http://localhost:3000/empresa-b", {
        headers: {
          cookie: `atendehub_session=${token}`,
          "x-tenant-id": "empresa-b",
          "x-user-role": "admin",
        },
      }),
    );
    expect(response.status).toBe(403);
  });
});
