import { test, expect } from "@playwright/test";
test("prévia local de suporte abre, responde e recolhe sem backend de IA", async ({
  page,
  context,
}) => {
  const response = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Henrique",
      company: "Distribuidora Moreira",
      email: `support-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(response.status()).toBe(201);
  const identity = await response.json();
  await page.goto(`/${identity.company.id}/integracoes`);
  await expect(page.getByRole("button", { name: "Abrir suporte", exact: true })).toBeVisible();
  await expect(page.getByText("Dados comerciais demonstrativos", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Distribuidora Moreira · Minha empresa", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: "/workspace/cliente-suporte-recolhido.png" });
  await page.getByRole("button", { name: "Abrir suporte", exact: true }).click();
  const chat = page.getByRole("dialog", { name: "Chat de suporte", exact: true });
  await expect(chat).toBeVisible();
  await expect(chat.getByRole("textbox")).toBeFocused();
  await page.screenshot({ path: "/workspace/cliente-suporte-aberto-desktop.png" });
  await chat.getByRole("button", { name: "Conectar meu WhatsApp" }).click();
  await expect(chat.getByRole("log")).toContainText("Dispositivos conectados");
  await chat.getByRole("textbox").fill("Olá, preciso de ajuda");
  await chat.getByRole("button", { name: "Enviar mensagem", exact: true }).click();
  await expect(chat.getByRole("log")).toContainText("a IA ainda não está conectada");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(chat).toBeVisible();
  const bounds = await chat.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "/workspace/cliente-suporte-aberto-mobile.png" });
  await chat.getByRole("textbox").press("Escape");
  await expect(chat).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir suporte", exact: true })).toBeFocused();
});
