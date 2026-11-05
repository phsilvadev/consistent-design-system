import { test, expect } from "@playwright/test";
test("Cadastra, mantém, edita e remove credenciais GestãoClick com API real", async ({
  page,
  context,
}) => {
  const response = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Almeida",
      company: "Moreira Distribuidora",
      email: `gc-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(response.status()).toBe(201);
  const identity = await response.json();
  await page.goto(`/${identity.company.id}/integracoes`);
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "GestãoClick ERP", exact: true }) });
  await card.getByRole("button", { name: "Cadastrar credenciais", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Configurações do GestãoClick", exact: true });
  await expect(panel).toBeVisible();
  await page
    .getByLabel("Endereço base da API", { exact: true })
    .fill("https://erp.example.com/api");
  await page.getByLabel("Access Token", { exact: true }).fill("test-only-access-token");
  await page.getByLabel("Secret Access Token", { exact: true }).fill("test-only-secret-token");
  await page.getByRole("button", { name: "Salvar credenciais", exact: true }).click();
  await expect(
    panel.getByText(
      "Credenciais cadastradas com segurança. O acesso ao ERP ainda não foi validado.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Access Token", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Secret Access Token", { exact: true })).toHaveValue("");
  expect(await page.content()).not.toContain("test-only-secret-token");
  await page.screenshot({
    path: "/workspace/atendehub-gestaoclick-cadastro-desktop.png",
    fullPage: true,
  });
  await panel.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.reload();
  await card.getByRole("button", { name: "Configurar", exact: true }).click();
  await expect(page.getByLabel("Endereço base da API", { exact: true })).toHaveValue(
    "https://erp.example.com/api",
  );
  await expect(page.getByLabel("Access Token", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Salvar credenciais", exact: true }).click();
  await expect(panel.getByRole("status")).toBeVisible();
  await page
    .getByLabel("Secret Access Token", { exact: true })
    .fill("replacement-only-test-secret");
  await page.getByRole("button", { name: "Salvar credenciais", exact: true }).click();
  await expect(page.getByLabel("Secret Access Token", { exact: true })).toHaveValue("");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: "/workspace/atendehub-gestaoclick-cadastro-mobile.png",
    fullPage: true,
  });
  await panel.getByRole("button", { name: "Remover", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Remover configuração", exact: true })
    .click();
  await expect(
    panel.getByText("Configuração removida e credenciais apagadas.", { exact: true }),
  ).toBeVisible();
  expect(
    (await (await context.request.get("/api/v1/integrations/gestaoclick")).json()).has_credentials,
  ).toBe(false);
});
