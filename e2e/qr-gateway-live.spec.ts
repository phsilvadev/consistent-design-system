import { test, expect } from "@playwright/test";
test("Gateway real gera QR sem parear celular", async ({ page, context }) => {
  test.skip(
    process.env.QR_GATEWAY_LIVE !== "1",
    "Requer gateway real privado iniciado pelo operador; não pareia celular.",
  );
  test.setTimeout(60000);
  const registration = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Almeida",
      company: "Moreira Distribuidora",
      email: `live-qr-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(registration.status()).toBe(201);
  const identity = await registration.json();
  await page.goto(`/${identity.company.id}/integracoes`);
  const button = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "WhatsApp por QR Code", exact: true }) })
    .getByRole("button", { name: "Conectar", exact: true });
  await expect(button).toBeEnabled();
  await page.screenshot({
    path: "/workspace/atendehub-integracoes-cliente-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: "/workspace/atendehub-integracoes-cliente-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await button.click();
  await page.getByRole("button", { name: "Gerar QR Code", exact: true }).click();
  await expect(page.getByAltText("QR Code para conectar o WhatsApp da empresa")).toBeVisible({
    timeout: 40000,
  });
  await page.screenshot({
    path: "/workspace/atendehub-whatsapp-qr-real-desktop.png",
    fullPage: true,
  });
  const disconnected = await context.request.post("/api/v1/integrations/whatsapp-qr/disconnect", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {},
  });
  expect(disconnected.status()).toBe(200);
});
