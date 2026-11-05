import { test, expect } from "@playwright/test";
test("Cadastro oficial protege token, expande painel e confirma ativação", async ({
  page,
  context,
}) => {
  const registration = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Almeida",
      company: "Moreira Distribuidora",
      email: `official-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(registration.status()).toBe(201);
  const identity = await registration.json();
  // UI contract fixture only. Real API, AES-GCM and Graph contracts are covered by Pytest.
  let state = {
    company_id: identity.company.id,
    enabled: true,
    status: "disconnected",
    phone_number_id: "",
    waba_id: "",
    display_phone_number: "",
    verified_name: "",
    has_token: false,
    verified_at: null as number | null,
    last_received_at: null as number | null,
    version: 0,
    webhook_url: "https://api.example.com/api/v1/webhooks/whatsapp",
    webhook_configured: true,
    platform_app_configured: true,
    diagnostics: {} as Record<string, unknown>,
  };
  const token = "test-only-access-token-not-a-real-meta-credential";
  const requests: Record<string, unknown>[] = [];
  await page.route(/\/api\/v1\/integrations\/whatsapp-official(?:\/.*)?$/, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/connect")) {
      const body = route.request().postDataJSON();
      requests.push(body);
      expect(body).not.toHaveProperty("company_id");
      if (state.version === 0) expect(body.access_token).toBe(token);
      state = {
        ...state,
        status: "validated",
        phone_number_id: body.phone_number_id,
        waba_id: body.waba_id,
        display_phone_number: "+55 11 99999-0000",
        verified_name: "Moreira Distribuidora",
        has_token: true,
        verified_at: Math.floor(Date.now() / 1000),
        version: state.version + 1,
        diagnostics: {
          app_confirmed: true,
          scopes: ["whatsapp_business_management", "whatsapp_business_messaging"],
          expires_at: Math.floor(Date.now() / 1000) + 86400,
          app_subscribed: false,
          phone_status: "PENDING",
          code_verification_status: "VERIFIED",
          platform_type: "CLOUD_API",
        },
      };
    } else if (path.endsWith("/setup")) {
      const body = route.request().postDataJSON();
      requests.push(body);
      expect(body.confirm).toBe(true);
      if (body.action === "register") {
        expect(body.pin).toBe("123456");
        state = {
          ...state,
          version: state.version + 1,
          diagnostics: { ...state.diagnostics, phone_status: "CONNECTED" },
        };
      } else {
        expect(body).not.toHaveProperty("pin");
        state = {
          ...state,
          version: state.version + 1,
          diagnostics: { ...state.diagnostics, app_subscribed: true },
        };
      }
    } else if (path.endsWith("/disconnect"))
      state = { ...state, has_token: false, status: "disconnected", version: state.version + 1 };
    await route.fulfill({ json: state });
  });
  await page.goto(`/${identity.company.id}/integracoes`);
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "WhatsApp Business", exact: true }) });
  await card.getByRole("button", { name: "Conectar", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "WhatsApp Business oficial", exact: true });
  await expect(panel).toBeVisible();
  await expect.poll(async () => Math.round((await panel.boundingBox())?.x ?? -1)).toBe(0);
  await expect(page.getByLabel("Phone Number ID", { exact: true })).toBeVisible();
  expect((await panel.boundingBox())?.width).toBe(640);
  await page.screenshot({
    path: "/workspace/atendehub-whatsapp-oficial-form-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Phone Number ID", { exact: true }).fill("123456789012345");
  await page
    .getByLabel("WhatsApp Business Account ID (WABA)", { exact: true })
    .fill("987654321098765");
  const password = page.getByLabel("Token de acesso", { exact: true });
  await password.fill(token);
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Validar e salvar", exact: true }).click();
  await expect(
    page.getByText("Credenciais validadas na Meta e salvas com segurança.", { exact: true }),
  ).toBeVisible();
  await expect(password).toHaveValue("");
  await expect.poll(async () => Math.round((await panel.boundingBox())?.width ?? 0)).toBe(960);
  expect(await page.content()).not.toContain(token);
  expect(
    await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage })),
  ).not.toContain(token);
  await page.getByLabel("PIN de seis dígitos", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Registrar na Cloud API", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Confirmar", exact: true })
    .click();
  await expect(page.getByLabel("PIN de seis dígitos", { exact: true })).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Registrar na Cloud API", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Ativar recebimento de eventos", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Confirmar", exact: true })
    .click();
  await expect(page.getByText("Aplicativo inscrito na conta", { exact: true })).toBeVisible();
  await panel.locator(".overflow-y-auto").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: "/workspace/atendehub-whatsapp-oficial-expandido-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: "/workspace/atendehub-whatsapp-oficial-form-mobile.png",
    fullPage: true,
  });
  await password.fill("test-only-replacement-secret-not-submitted");
  await panel.getByRole("button", { name: "Fechar", exact: true }).click();
  await card.getByRole("button", { name: "Configurar", exact: true }).click();
  await expect(page.getByLabel("Token de acesso", { exact: true })).toHaveValue("");
  expect(requests).toHaveLength(3);
  await page.getByRole("button", { name: "Remover conexão", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Remover conexão", exact: true })
    .click();
  await expect(
    page.getByText("Conexão removida. O token armazenado foi apagado.", { exact: true }),
  ).toBeVisible();
});
