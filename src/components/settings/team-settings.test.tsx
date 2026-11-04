import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { TenantProvider } from "@/lib/tenant/provider";
import { testIdentity, testWorkspaceContext } from "@/test/fixtures";
import { TeamSettings } from "./team-settings";
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("equipe e contagem", () => {
  it("publica o total de todos os usuários, inclusive inativos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            testIdentity.user,
            {
              ...testIdentity.user,
              id: "22222222-2222-4222-8222-222222222222",
              name: "Vendedor inativo",
              email: "seller@example.com",
              role: "seller",
              active: false,
            },
          ]),
        ),
      ),
    );
    const count = vi.fn();
    render(
      <TenantProvider value={testWorkspaceContext}>
        <TeamSettings onCountChange={count} />
      </TenantProvider>,
    );
    expect(await screen.findByText("Vendedor inativo")).toBeInTheDocument();
    expect(count).toHaveBeenLastCalledWith(2);
    expect(screen.getByText("Inativo")).toBeInTheDocument();
  });
  it("não consulta lista nem mostra cadastro para vendedor", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const count = vi.fn();
    render(
      <TenantProvider
        value={{ ...testWorkspaceContext, user: { ...testWorkspaceContext.user, role: "seller" } }}
      >
        <TeamSettings onCountChange={count} />
      </TenantProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "Acesso restrito ao administrador" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adicionar usuário" })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(count).toHaveBeenLastCalledWith(null);
  });
  it("falha não exibe contagem fictícia e permite tentar novamente", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(new Response(JSON.stringify([testIdentity.user])));
    vi.stubGlobal("fetch", fetch);
    const count = vi.fn();
    render(
      <TenantProvider value={testWorkspaceContext}>
        <TeamSettings onCountChange={count} />
      </TenantProvider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar");
    expect(count).toHaveBeenLastCalledWith(null);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(count).toHaveBeenLastCalledWith(1));
  });
});
