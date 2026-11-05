import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TenantProvider } from "@/lib/tenant/provider";
import { testWorkspaceContext } from "@/test/fixtures";
import { conversationFixture } from "@/test/conversation-fixtures";
import { AtendimentoScreen } from "./atendimento-screen";
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});
function setup(role = testWorkspaceContext.user.role) {
  render(
    <TenantProvider
      value={{ ...testWorkspaceContext, user: { ...testWorkspaceContext.user, role } }}
    >
      <AtendimentoScreen />
    </TenantProvider>,
  );
}
function stub(items = [conversationFixture]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((path: string) =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            path.includes("/summary")
              ? {
                  company_id: conversationFixture.company_id,
                  total: items.length,
                  active: items.length,
                  unassigned: 0,
                  unread_conversations: 0,
                  unread_messages: 0,
                }
              : path.includes("/assignees")
                ? [conversationFixture.assigned_user]
                : path.includes("/messages")
                  ? { items: [], next_before: null }
                  : path.includes(conversationFixture.id)
                    ? conversationFixture
                    : { items, total: items.length },
          ),
        ),
      ),
    ),
  );
}
describe("central com persistência via API", () => {
  it("carrega os registros do servidor sem clientes fictícios adicionais", async () => {
    stub();
    setup();
    expect(
      await screen.findByRole("button", { name: /Abrir atendimento de Carlos Mendes/ }),
    ).toBeVisible();
    expect(screen.queryByText("Rafael Costa")).toBeNull();
    expect(
      within(screen.getByRole("region", { name: "Em atendimento humano" })).getByText(
        "Metalon 30x30 chapa 18",
      ),
    ).toBeVisible();
  });
  it("mostra estado vazio e não gera conversas automáticas", async () => {
    stub([]);
    setup();
    expect(await screen.findByText("Sua central está pronta para começar")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Abrir atendimento de/ })).toBeNull();
  });
  it("falha de rede oferece nova tentativa", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar");
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
  });
  it("oferece criação manual sem prometer início de IA", async () => {
    stub();
    setup();
    await screen.findByRole("button", { name: /Abrir atendimento de/ });
    fireEvent.click(screen.getByRole("button", { name: "Novo atendimento" }));
    const modal = within(await screen.findByRole("dialog", { name: "Novo atendimento" }));
    expect(modal.getByRole("button", { name: "Criar atendimento" })).toBeVisible();
    expect(modal.queryByText("Iniciar com IA")).toBeNull();
    expect(modal.getByText(/Nenhuma mensagem será enviada pelo WhatsApp/)).toBeVisible();
  });
});
