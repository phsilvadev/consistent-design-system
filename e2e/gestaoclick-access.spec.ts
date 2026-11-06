import { test, expect } from "@playwright/test";
test("Teste real da aplicação valida lojas, persiste seleção e trata credencial recusada", async ({
  page,
  context,
}) => {
  test.skip(
    process.env.E2E_GESTAOCLICK_STUB !== "1",
    "Requer o runner isolado com transporte HTTP ERP simulado.",
  );
  const registration = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Almeida",
      company: "Moreira Distribuidora",
      email: `gc-access-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(registration.status()).toBe(201);
  const identity = await registration.json();
  await page.goto(`/${identity.company.id}/integracoes`);
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "GestãoClick ERP", exact: true }) });
  await card.getByRole("button", { name: "Cadastrar credenciais", exact: true }).click();
  await page
    .getByLabel("Endereço base da API", { exact: true })
    .fill("https://api.gestaoclick.com/api");
  await page.getByLabel("Access Token", { exact: true }).fill("test-only-access-token");
  await page.getByLabel("Secret Access Token", { exact: true }).fill("test-only-secret-token");
  await page.getByRole("button", { name: "Salvar credenciais", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Configurações do GestãoClick", exact: true });
  await expect(
    panel.getByText(
      "Credenciais cadastradas com segurança. O acesso ao ERP ainda não foi validado.",
      { exact: true },
    ),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Testar conexão", exact: true }).click();
  await expect(
    panel.getByText("Acesso à listagem de lojas validado. Selecione a loja da integração.", {
      exact: true,
    }),
  ).toBeVisible();
  const select = page.getByLabel("Loja da integração", { exact: true });
  await select.selectOption("2");
  await page.getByRole("button", { name: "Salvar loja", exact: true }).click();
  await expect(
    panel.getByText("Loja da integração salva. Nenhuma sincronização foi iniciada.", {
      exact: true,
    }),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.reload();
  await card.getByRole("button", { name: "Configurar", exact: true }).click();
  await expect(select).toHaveValue("2");
  await expect.poll(async () => Math.round((await panel.boundingBox())?.x ?? -1)).toBe(0);
  const value = await (await context.request.get("/api/v1/integrations/gestaoclick")).json();
  expect(value.status).toBe("access_validated");
  expect(value.selected_store_id).toBe("2");
  expect(value).not.toHaveProperty("access_token");
  expect(value).not.toHaveProperty("secret_access_token");
  await page.screenshot({
    path: "/workspace/atendehub-gestaoclick-acesso-loja-desktop.png",
    animations: "disabled",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: "/workspace/atendehub-gestaoclick-acesso-loja-mobile.png",
    animations: "disabled",
    fullPage: true,
  });
  await page.getByLabel("Access Token", { exact: true }).fill("test-only-invalid-access-token");
  await page.getByRole("button", { name: "Salvar credenciais", exact: true }).click();
  await expect(select).toBeDisabled();
  await page.getByRole("button", { name: "Testar conexão", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText("O GestãoClick recusou as credenciais");
  await expect(select).toHaveValue("");
  await expect(select).toBeDisabled();
});
