import { test, expect } from "@playwright/test";
test("Prévia GestãoClick simula etapas sem acessar APIs de integração", async ({
  page,
  context,
}) => {
  const response = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Almeida",
      company: "Moreira Distribuidora",
      email: `gc-preview-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  const identity = await response.json();
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/integrations/")) requests.push(request.url());
  });
  await page.goto(`/${identity.company.id}/integracoes/previa-gestaoclick`);
  const panel = page.getByRole("dialog", { name: "GestãoClick ERP", exact: true });
  await expect(panel).toBeVisible();
  await expect.poll(async () => Math.round((await panel.boundingBox())?.x ?? -1)).toBe(0);
  await expect(page.getByRole("button", { name: /Sincronizar agora/ })).toBeDisabled();
  await page.screenshot({
    path: "/workspace/atendehub-gestaoclick-previa-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /Testar conexão/ }).click();
  await expect(page.getByText("Acesso validado · simulação", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Sincronizar agora/ })).toBeEnabled();
  await page.screenshot({
    path: "/workspace/atendehub-gestaoclick-previa-validada.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /Sincronizar agora/ }).click();
  await expect(
    page.getByText("Simulação concluída · nenhum dado importado", { exact: true }),
  ).toBeVisible();
  expect(requests).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await panel.locator(".overflow-y-auto").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: "/workspace/atendehub-gestaoclick-previa-mobile.png",
    fullPage: true,
  });
});
