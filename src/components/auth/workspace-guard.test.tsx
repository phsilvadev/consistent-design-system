import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { testIdentity } from "@/test/fixtures";
import { WorkspaceGuard } from "./workspace-guard";
const mocks = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("revalidação no navegador", () => {
  it("não renderiza filhos para tenant divergente", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(
      <WorkspaceGuard initialIdentity={testIdentity} tenant="outra">
        <p>Conteúdo privado</p>
      </WorkspaceGuard>,
    );
    expect(screen.queryByText("Conteúdo privado")).toBeNull();
  });
  it("bloqueia trial vencido", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ ...testIdentity, trial_expired: true }))),
    );
    render(
      <WorkspaceGuard
        initialIdentity={{ ...testIdentity, trial_expired: true }}
        tenant={testIdentity.company.id}
      >
        <p>Conteúdo privado</p>
      </WorkspaceGuard>,
    );
    expect(await screen.findByText("Seu período de teste terminou")).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo privado")).toBeNull();
  });
  it("retira o conteúdo quando a sessão é revogada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    render(
      <WorkspaceGuard initialIdentity={testIdentity} tenant={testIdentity.company.id}>
        <p>Conteúdo privado</p>
      </WorkspaceGuard>,
    );
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Conteúdo privado")).toBeNull();
  });
  it("troca de conta não mantém conteúdo do tenant anterior", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(testIdentity)));
    vi.stubGlobal("fetch", fetch);
    render(
      <WorkspaceGuard initialIdentity={testIdentity} tenant={testIdentity.company.id}>
        <p>Conteúdo privado</p>
      </WorkspaceGuard>,
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...testIdentity,
          company: { ...testIdentity.company, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
          user: { ...testIdentity.user, company_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
        }),
      ),
    );
    fireEvent.focus(window);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/acesso-negado"));
    expect(screen.queryByText("Conteúdo privado")).toBeNull();
  });
});
