import { test, expect } from "@playwright/test";
test("Sincroniza catálogo por páginas, persiste produtos e gera prints", async ({
  page,
  context,
}) => {
  test.skip(
    process.env.E2E_GESTAOCLICK_STUB !== "1",
    "Requer ERP HTTP simulado no runner isolado.",
  );
  const registration = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Almeida",
      company: "Moreira Distribuidora",
      email: `gc-products-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(registration.status()).toBe(201);
  const identity = await registration.json();
  const company = identity.company.id;
  const prefix = "/api/v1/integrations/gestaoclick";
  const headers = { Origin: "http://127.0.0.1:3200" };
  expect(
    (
      await context.request.post(prefix, {
        headers,
        data: {
          version: 0,
          base_url: "https://api.gestaoclick.com/api",
          access_token: "test-only-access-token",
          secret_access_token: "test-only-secret-token",
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await context.request.post(`${prefix}/test`, { headers, data: { version: 1 } })).status(),
  ).toBe(200);
  expect(
    (
      await context.request.post(`${prefix}/store`, {
        headers,
        data: { version: 2, store_id: "2" },
      })
    ).status(),
  ).toBe(200);
  await page.goto(`/${company}/produtos`);
  await expect(page.getByText("Seu catálogo começa aqui", { exact: true })).toBeVisible();
  await page.goto(`/${company}/integracoes`);
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "GestãoClick ERP", exact: true }) });
  await card.getByRole("button", { name: "Configurar", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Configurações do GestãoClick", exact: true });
  await panel.getByRole("button", { name: "Sincronizar produtos", exact: true }).click();
  await expect(
    panel.getByText("Sincronização concluída: 2 produtos importados.", { exact: true }),
  ).toBeVisible();
  await panel
    .getByRole("region", { name: "Sincronização de produtos", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "/workspace/atendehub-gestaoclick-produtos-sincronizados-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await panel.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.goto(`/${company}/produtos`);
  await expect(page.getByText("Metalon 30x30 Chapa 18", { exact: true })).toBeVisible();
  await expect(page.getByText("Vergalhão CA-50 12 mm", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "/workspace/atendehub-produtos-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("textbox", { name: "Buscar produto", exact: true }).fill("Metalon");
  await expect(page.getByText("Vergalhão CA-50 12 mm", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Metalon 30x30 Chapa 18", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Buscar produto", exact: true }).fill("");
  await expect(page.getByText("Vergalhão CA-50 12 mm", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Metalon 30x30 Chapa 18", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: "/workspace/atendehub-produtos-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});
