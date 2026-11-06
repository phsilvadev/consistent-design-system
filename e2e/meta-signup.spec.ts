import { test, expect } from "@playwright/test";
test("Embedded Signup atravessa BFF e API; só a Meta é simulada", async ({ page, context }) => {
  test.skip(
    process.env.E2E_META_STUB !== "1",
    "Requer transporte Meta simulado no ambiente isolado.",
  );
  const registration = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Henrique",
      company: "Moreira Distribuidora",
      email: `meta-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(registration.status()).toBe(201);
  const identity = await registration.json();
  await page.route("https://connect.facebook.net/pt_BR/sdk.js", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `window.FB = {
      init: function() {},
      login: function(callback, options) {
        if (options.response_type !== 'code' || options.config_id !== '88888') throw Error('Invalid SDK setup');
        callback({authResponse:{code:'test-only-meta-authorization-code-abcdefghijklmnopqrstuvwxyz'}});
        window.dispatchEvent(new MessageEvent('message',{ origin:'https://www.facebook.com', data:JSON.stringify({type:'WA_EMBEDDED_SIGNUP',event:'FINISH',data:{phone_number_id:'12345',waba_id:'67890'}})}));
      }
    };`,
    });
  });
  const completions: Record<string, unknown>[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/embedded/complete")) completions.push(request.postDataJSON());
  });
  await page.goto(`/${identity.company.id}/integracoes`);
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "WhatsApp Business", exact: true }) });
  await card.getByRole("button", { name: "Conectar", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "WhatsApp Business oficial", exact: true });
  const button = panel.getByRole("button", { name: "Conectar com a Meta", exact: true });
  await expect(button).toBeEnabled();
  await expect(panel.getByLabel("Token de acesso", { exact: true })).not.toBeVisible();
  await expect.poll(async () => Math.round((await panel.boundingBox())?.x ?? -1)).toBe(0);
  await page.screenshot({ path: "/workspace/cliente-meta-conectar-desktop.png" });
  await button.click();
  await expect(
    panel.getByText(
      "Conta autorizada na Meta e credencial protegida no servidor. Confira as etapas de ativação.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(completions).toHaveLength(1);
  expect(completions[0]).not.toHaveProperty("company_id");
  expect(completions[0]).not.toHaveProperty("access_token");
  const actual = await (await context.request.get("/api/v1/integrations/whatsapp-official")).json();
  expect(actual.has_token).toBe(true);
  expect(actual.phone_number_id).toBe("12345");
  expect(actual.diagnostics.app_confirmed).toBe(true);
  expect(actual.diagnostics.app_subscribed).toBe(false);
  for (const value of [
    "test-only-meta-business-token-abcdefghijklmnopqrstuvwxyz",
    "test-only-meta-app-secret",
  ]) {
    expect(await page.content()).not.toContain(value);
    expect(
      await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage })),
    ).not.toContain(value);
  }
  await page.screenshot({ path: "/workspace/cliente-meta-autorizado-desktop.png" });
  const replay = await context.request.post(
    "/api/v1/integrations/whatsapp-official/embedded/complete",
    { headers: { Origin: "http://127.0.0.1:3200" }, data: completions[0] },
  );
  expect(replay.status()).toBe(409);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(panel).toBeVisible();
  await page.screenshot({ path: "/workspace/cliente-meta-autorizado-mobile.png" });
});
