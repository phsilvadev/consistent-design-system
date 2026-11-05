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

it("rejeita confirmação de leitura de outra conversa", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          company_id: conversationFixture.company_id,
          conversation_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          last_message_id: 8,
          unread_count: 0,
        }),
      ),
    ),
  );
  await expect(
    conversationsApi.read(conversationFixture.company_id, conversationFixture.id, 8),
  ).rejects.toThrow("validar a leitura");
});

it("aceita atendimento e mensagem recebidos do WhatsApp", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...conversationFixture, channel: "whatsapp" })),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                id: 1,
                company_id: conversationFixture.company_id,
                conversation_id: conversationFixture.id,
                actor: null,
                kind: "whatsapp_inbound",
                body: "Preciso de metalon",
                created_at: 1,
              },
            ],
            next_before: null,
          }),
        ),
      ),
  );
  expect(
    (await conversationsApi.get(conversationFixture.company_id, conversationFixture.id)).channel,
  ).toBe("whatsapp");
  expect(
    (await conversationsApi.messages(conversationFixture.company_id, conversationFixture.id))
      .items[0]?.kind,
  ).toBe("whatsapp_inbound");
});
