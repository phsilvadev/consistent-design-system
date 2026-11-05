import { test, expect } from "@playwright/test";
test("Integrações apresenta estado real sem conexões fictícias", async ({ page, context }) => {
  const response = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Almeida",
      company: "Moreira Distribuidora",
      email: `integrations-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(response.status()).toBe(201);
  const identity = await response.json();
  await page.goto(`/${identity.company.id}/integracoes`);
  await expect(page.getByRole("heading", { name: "Integrações", exact: true })).toBeVisible();
  await expect(page.getByText("Não conectado", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Conectar WhatsApp", exact: true })).toBeDisabled();
  await expect(page.getByText("Conectado", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: "/workspace/atendehub-integracoes-cliente-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "WhatsApp por QR Code" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: "/workspace/atendehub-integracoes-cliente-mobile.png",
    fullPage: true,
  });
});

test("Modal de pareamento trata expiração, conexão e desconexão", async ({ page, context }) => {
  const response = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Almeida",
      company: "Empresa QR Teste",
      email: `qr-ui-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  const identity = await response.json();
  // Provider contract simulated only for this browser-state test. No real pairing claimed.
  let state = {
    company_id: identity.company.id,
    enabled: true,
    status: "disconnected",
    qr_data_url: null as string | null,
    qr_expires_at: null as number | null,
    phone: null as string | null,
  };
  await page.route(/\/api\/v1\/integrations\/whatsapp-qr(?:\/.*)?$/, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/connect")) {
      expect(route.request().postDataJSON()).toEqual({});
      state = {
        ...state,
        status: "qr",
        qr_data_url:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7WQAAAAASUVORK5CYII=",
        qr_expires_at: Math.floor(Date.now() / 1000) + 2,
      };
    } else if (path.endsWith("/disconnect"))
      state = {
        ...state,
        status: "disconnected",
        qr_data_url: null,
        qr_expires_at: null,
        phone: null,
      };
    await route.fulfill({ json: state });
  });
  await page.goto(`/${identity.company.id}/integracoes`);
  await page.getByRole("button", { name: "Conectar WhatsApp", exact: true }).click();
  const image = page.getByAltText("QR Code para conectar o WhatsApp da empresa");
  await expect(image).toBeVisible();
  await expect(image).toHaveCount(0, { timeout: 5000 });
  state = {
    ...state,
    status: "connected",
    qr_data_url: null,
    qr_expires_at: null,
    phone: "5511999999999",
  };
  await expect(page.getByText("WhatsApp conectado!", { exact: true })).toBeVisible({
    timeout: 10000,
  });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Desconectar", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Desconectar", exact: true })
    .click();
  await expect(page.getByText("Não conectado", { exact: true })).toBeVisible();
});
