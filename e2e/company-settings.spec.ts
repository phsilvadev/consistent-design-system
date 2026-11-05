import { test, expect } from "@playwright/test";
const origin = "http://127.0.0.1:3200";
test("Empresa persiste dados e horários, isola tenants e restringe edição", async ({
  page,
  context,
  browser,
}) => {
  const stamp = Date.now();
  const registration = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: origin },
    data: {
      name: "Pedro Almeida",
      company: "Moreira Distribuidora",
      email: `company-${stamp}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(registration.status()).toBe(201);
  const identity = await registration.json();
  await page.goto(`/${identity.company.id}/configuracoes`);
  await page.getByRole("tab", { name: "Empresa", exact: true }).click();
  await expect(page.getByLabel("Nome fantasia", { exact: false })).toHaveValue(
    "Moreira Distribuidora",
  );
  const save = page.getByRole("button", { name: "Salvar alterações", exact: true });
  await expect(save).toBeDisabled();
  await page.getByLabel("Nome fantasia", { exact: false }).fill("Moreira Aços");
  await page
    .getByLabel("Razão social", { exact: true })
    .fill("Moreira Comércio de Ferro e Aço Ltda.");
  await page.getByLabel("CNPJ", { exact: true }).fill("11.222.333/0001-81");
  await page.getByLabel("Telefone comercial", { exact: true }).fill("(11) 3333-4444");
  await page.getByLabel("E-mail comercial", { exact: true }).fill("comercial@example.com");
  await page.getByLabel("CEP", { exact: true }).fill("01001-000");
  await page.getByLabel("Logradouro", { exact: true }).fill("Praça da Sé");
  await page.getByLabel("Número", { exact: true }).fill("100");
  await page.getByLabel("Bairro", { exact: true }).fill("Sé");
  await page.getByLabel("Cidade", { exact: true }).fill("São Paulo");
  await page.getByLabel("UF", { exact: true }).selectOption("SP");
  for (const day of [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
  ]) {
    await page.getByRole("switch", { name: `Atendimento ${day}`, exact: true }).click();
    await page.getByLabel(`Abertura ${day}`, { exact: true }).fill("08:00");
    await page.getByLabel(`Encerramento ${day}`, { exact: true }).fill("18:00");
  }
  await save.click();
  const success = page.getByRole("alertdialog", {
    name: "Dados da empresa atualizados",
    exact: true,
  });
  await expect(success).toBeVisible();
  await success.getByRole("button", { name: "Voltar para configurações" }).click();
  await expect(save).toBeDisabled();
  await expect(page.getByLabel("Nome fantasia", { exact: false })).toHaveValue("Moreira Aços");
  await page.reload();
  await page.getByRole("tab", { name: "Empresa", exact: true }).click();
  await expect(page.getByLabel("Razão social", { exact: true })).toHaveValue(
    "Moreira Comércio de Ferro e Aço Ltda.",
  );
  await expect(page.getByLabel("Abertura Segunda-feira", { exact: true })).toHaveValue("08:00");
  await expect(
    page.getByRole("switch", { name: "Atendimento Domingo", exact: true }),
  ).not.toBeChecked();
  await page
    .getByRole("heading", { name: "Dados da empresa", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: test.info().outputPath("company-settings-desktop.png"),
    fullPage: true,
  });
  await page.getByLabel("Razão social", { exact: true }).fill("Descartar");
  await page.getByRole("button", { name: "Descartar", exact: true }).click();
  await expect(page.getByLabel("Razão social", { exact: true })).toHaveValue(
    "Moreira Comércio de Ferro e Aço Ltda.",
  );
  await page.getByLabel("CNPJ", { exact: true }).fill("11111111111111");
  await save.click();
  await expect(page.getByRole("alert").filter({ hasText: "Dados inválidos" })).toBeVisible();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Descartar", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("company-settings-mobile.png"),
    fullPage: true,
  });
  const sellerEmail = `settings-seller-${stamp}@example.com`;
  expect(
    (
      await context.request.post("/api/v1/users", {
        headers: { Origin: origin },
        data: {
          name: "Vendedor",
          email: sellerEmail,
          password: "Senha-segura-123",
          role: "seller",
        },
      })
    ).status(),
  ).toBe(201);
  const other = await browser.newContext({ baseURL: origin });
  await other.request.post("/api/v1/auth/login", {
    headers: { Origin: origin },
    data: { email: sellerEmail, password: "Senha-segura-123" },
  });
  const employee = await other.newPage();
  await employee.goto(`/${identity.company.id}/configuracoes`);
  await employee.getByRole("tab", { name: "Empresa", exact: true }).click();
  await expect(employee.getByLabel("Nome fantasia", { exact: false })).toBeDisabled();
  await expect(
    employee.getByRole("button", { name: "Salvar alterações", exact: true }),
  ).toHaveCount(0);
  const current = (await context.request.get("/api/v1/company/settings")).json();
  const data = await current;
  delete data.company_id;
  expect(
    (
      await other.request.patch("/api/v1/company/settings", { headers: { Origin: origin }, data })
    ).status(),
  ).toBe(403);
  await other.close();
  const beta = await browser.newContext({ baseURL: origin });
  await beta.request.post("/api/v1/auth/register", {
    headers: { Origin: origin },
    data: {
      name: "Ana Souza",
      company: "Beta",
      email: `beta-settings-${stamp}@example.com`,
      password: "Senha-segura-123",
    },
  });
  const betaData = await (await beta.request.get("/api/v1/company/settings")).json();
  expect(betaData.name).toBe("Beta");
  expect(betaData.legal_name).toBe("");
  expect(
    (
      await beta.request.patch("/api/v1/company/settings", {
        headers: { Origin: origin },
        data: { ...data, company_id: identity.company.id },
      })
    ).status(),
  ).toBe(422);
  await beta.close();
});
