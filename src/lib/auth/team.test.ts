import { afterEach, describe, expect, it, vi } from "vitest";
import { testIdentity } from "@/test/fixtures";
import { teamApi } from "./team";
afterEach(() => vi.unstubAllGlobals());
describe("API de equipe", () => {
  it("consulta usuários da sessão sem enviar tenant na URL", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([testIdentity.user])));
    vi.stubGlobal("fetch", fetch);
    expect(await teamApi.list(testIdentity.company.id)).toHaveLength(1);
    expect(fetch.mock.calls[0]?.[0]).toBe("/api/v1/users");
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      credentials: "same-origin",
      cache: "no-store",
    });
  });
  it("rejeita resposta que contenha usuário de outra empresa", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify([
              { ...testIdentity.user, company_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
            ]),
          ),
        ),
    );
    await expect(teamApi.list(testIdentity.company.id)).rejects.toThrow("validar os usuários");
  });
  it("cadastro envia apenas campos autorizados e nunca company_id", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(testIdentity.user), { status: 201 }));
    vi.stubGlobal("fetch", fetch);
    await teamApi.create(testIdentity.company.id, {
      name: "Marina",
      email: "marina@example.com",
      password: "Senha-teste-123",
      role: "admin",
    });
    expect(JSON.parse(fetch.mock.calls[0]?.[1].body)).toEqual({
      name: "Marina",
      email: "marina@example.com",
      password: "Senha-teste-123",
      role: "admin",
    });
  });
  it("erro 403 não vira lista vazia de sucesso", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ detail: "Acesso permitido apenas para administradores." }),
            { status: 403 },
          ),
        ),
    );
    await expect(teamApi.list(testIdentity.company.id)).rejects.toMatchObject({ status: 403 });
  });
});

it("edição usa PATCH e descarta campos que não podem ser alterados", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(testIdentity.user)));
  vi.stubGlobal("fetch", fetch);
  await teamApi.update(testIdentity.company.id, testIdentity.user.id, testIdentity.user);
  expect(fetch.mock.calls[0]?.[1].method).toBe("PATCH");
  expect(JSON.parse(fetch.mock.calls[0]?.[1].body)).toEqual({
    name: testIdentity.user.name,
    email: testIdentity.user.email,
    role: testIdentity.user.role,
    active: testIdentity.user.active,
  });
});
