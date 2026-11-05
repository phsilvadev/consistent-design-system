import { test, expect } from "@playwright/test";
const origin = "http://127.0.0.1:3200";
test("Planos usa catálogo do banco, exibe skeleton e não altera assinatura sem checkout", async ({
  page,
  context,
  browser,
}) => {
  const stamp = Date.now();
  const result = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: origin },
    data: {
      name: "Pedro Almeida",
      company: "Moreira Distribuidora",
      email: `plans-${stamp}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(result.status()).toBe(201);
  const identity = await result.json();
  const actual = await (await context.request.get("/api/v1/company/subscription")).json();
  expect(actual.available_plans).toHaveLength(3);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/company/subscription", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto(`/${identity.company.id}/configuracoes`);
  await page.getByRole("tab", { name: "Planos", exact: true }).click();
  await expect(page.getByRole("status", { name: "Carregando planos" })).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("plans-skeleton-desktop.png"),
    animations: "disabled",
  });
  release();
  await expect(page.getByRole("heading", { name: "Teste gratuito", exact: true })).toBeVisible();
  await expect(
    page.getByText("7 dias restantes para conhecer a plataforma", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status", { name: "Carregando planos" })).toHaveCount(0);
  for (const plan of actual.available_plans) {
    const card = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: plan.name, exact: true }) });
    await expect(card).toContainText(String(plan.monthly_price_cents / 100));
    await expect(card).toContainText(`Até ${plan.user_limit} usuários`);
    for (const feature of plan.features) await expect(card).toContainText(feature);
  }
  await page.getByRole("heading", { name: "Seu plano e assinatura" }).click();
  await page.screenshot({ path: test.info().outputPath("plans-desktop.png"), fullPage: true });
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Profissional", exact: true }) })
    .getByRole("button", { name: "Ver opções de upgrade" })
    .click();
  const modal = page.getByRole("dialog", { name: "Plano Profissional", exact: true });
  await expect(modal).toContainText("Contratação ainda indisponível");
  await modal.getByRole("button", { name: "Entendi", exact: true }).click();
  expect((await (await context.request.get("/api/v1/company/subscription")).json()).plan_code).toBe(
    "trial",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({ path: test.info().outputPath("plans-mobile.png"), fullPage: true });
  const email = `plans-seller-${stamp}@example.com`;
  await context.request.post("/api/v1/users", {
    headers: { Origin: origin },
    data: { name: "Vendedor", email, password: "Senha-segura-123", role: "seller" },
  });
  const other = await browser.newContext({ baseURL: origin });
  await other.request.post("/api/v1/auth/login", {
    headers: { Origin: origin },
    data: { email, password: "Senha-segura-123" },
  });
  const employee = await other.newPage();
  await employee.goto(`/${identity.company.id}/configuracoes`);
  await employee.getByRole("tab", { name: "Planos", exact: true }).click();
  await expect(employee.getByRole("heading", { name: "Seu plano e assinatura" })).toBeVisible();
  for (const button of await employee.getByRole("button", { name: "Ver opções de upgrade" }).all())
    await expect(button).toBeDisabled();
  await other.close();
});
