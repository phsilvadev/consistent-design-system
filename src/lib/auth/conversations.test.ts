import { afterEach, expect, it, vi } from "vitest";
import { conversationsApi } from "./conversations";
import { conversationFixture } from "@/test/conversation-fixtures";
afterEach(() => vi.unstubAllGlobals());
it("encaminha busca e filtro na consulta", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ items: [conversationFixture], total: 1 })));
  vi.stubGlobal("fetch", fetch);
  await conversationsApi.list(conversationFixture.company_id, { q: "metalon 30", mine: true });
  const path = String(fetch.mock.calls[0]?.[0]);
  expect(path).toContain("q=metalon+30");
  expect(path).toContain("mine=true");
});
it("rejeita atendimento de outra empresa", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ...conversationFixture,
          company_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        }),
      ),
    ),
  );
  await expect(
    conversationsApi.get(conversationFixture.company_id, conversationFixture.id),
  ).rejects.toThrow("validar o atendimento");
});
it("rejeita mensagem vinculada a outra conversa", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 1,
              company_id: conversationFixture.company_id,
              conversation_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              actor: null,
              kind: "system",
              body: "externo",
              created_at: 1,
            },
          ],
          next_before: null,
        }),
      ),
    ),
  );
  await expect(
    conversationsApi.messages(conversationFixture.company_id, conversationFixture.id),
  ).rejects.toThrow("validar o histórico");
});
