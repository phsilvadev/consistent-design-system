import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TenantProvider } from "@/lib/tenant/provider";
import { testWorkspaceContext } from "@/test/fixtures";
import { ConversationOverview } from "./conversation-overview";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function show(company_id: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          company_id,
          total: 12,
          active: 8,
          unassigned: 2,
          unread_conversations: 3,
          unread_messages: 5,
        }),
      ),
    ),
  );
  render(
    <TenantProvider value={testWorkspaceContext}>
      <ConversationOverview />
    </TenantProvider>,
  );
}
it("mostra os quatro indicadores retornados pela API", async () => {
  show(testWorkspaceContext.tenant.id);
  expect(await screen.findByLabelText("Em andamento: 8")).toBeVisible();
  expect(screen.getByLabelText("Sem responsável: 2")).toBeVisible();
  expect(screen.getByLabelText("Com registros não lidos: 3")).toBeVisible();
  expect(screen.getByLabelText("Registros não lidos: 5")).toBeVisible();
});
it("recusa contadores de outra empresa sem exibir valores fictícios", async () => {
  show("11111111-1111-4111-8111-111111111111");
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível atualizar");
  expect(screen.queryByLabelText("Em andamento: 8")).toBeNull();
});
