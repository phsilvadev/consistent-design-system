import { test, expect } from "@playwright/test";
const origin = "http://127.0.0.1:3200";
test("suporte persistido: fontes, reload, usuário isolado, falha e origem", async ({
  page,
  context,
  browser,
}) => {
  const reg = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: origin },
    data: {
      name: "Pedro Almeida",
      company: "Distribuidora de teste",
      email: `support-ai-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(reg.status()).toBe(201);
  const identity = await reg.json();
  await page.goto(`/${identity.company.id}/ajuda`);
  await page.getByRole("button", { name: "Abrir suporte", exact: true }).click();
  const chat = page.getByRole("dialog", { name: "Chat de suporte", exact: true });
  await expect(chat.getByRole("textbox")).toBeEnabled();
  await chat.getByRole("button", { name: "Gerenciar minha equipe", exact: true }).click();
  await expect(
    chat.getByRole("status", { name: "Assistente preparando resposta", exact: true }),
  ).toBeVisible();
  await expect(chat.getByRole("log")).toContainText("Configurações → Equipe");
  await expect(
    chat.getByRole("link", { name: "Usuários e permissões", exact: true }),
  ).toHaveAttribute("href", `/${identity.company.id}/ajuda`);
  await page.screenshot({ path: "/workspace/suporte-ia-conectado-desktop.png" });
  await page.reload();
  await page.getByRole("button", { name: "Abrir suporte", exact: true }).click();
  await expect(chat.getByRole("log")).toContainText("Configurações → Equipe");
  await chat.getByRole("textbox").fill("simular falha");
  await chat.getByRole("button", { name: "Enviar mensagem", exact: true }).click();
  await expect(chat.getByRole("log")).toContainText("não conseguiu responder");
  const history = await (await context.request.get("/api/v1/support/messages")).json();
  expect(history.used_today).toBe(2);
  expect(history.items).toHaveLength(2);
  const replay = await context.request.post("/api/v1/support/messages", {
    headers: { Origin: origin },
    data: { request_id: history.items[1].request_id, message: "simular falha" },
  });
  expect((await replay.json()).status).toBe("failed");
  expect((await (await context.request.get("/api/v1/support/messages")).json()).used_today).toBe(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/workspace/suporte-ia-conectado-mobile.png" });
  const other = await browser.newContext({ baseURL: origin });
  const second = await other.request.post("/api/v1/auth/register", {
    headers: { Origin: origin },
    data: {
      name: "Ana",
      company: "Outra empresa",
      email: `support-other-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(second.status()).toBe(201);
  expect((await (await other.request.get("/api/v1/support/messages")).json()).items).toEqual([]);
  await other.close();
  expect(
    (
      await context.request.post("/api/v1/support/messages", {
        headers: { Origin: "https://evil.example" },
        data: { request_id: crypto.randomUUID(), message: "teste" },
      })
    ).status(),
  ).toBe(403);
  await chat.getByRole("textbox").press("Escape");
  await expect(chat).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir suporte", exact: true })).toBeFocused();
});
