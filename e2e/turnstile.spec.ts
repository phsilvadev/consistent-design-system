import { test, expect } from "@playwright/test";
test("Turnstile protege cadastro e login do cliente", async ({ page, context }) => {
  test.skip(
    process.env.E2E_TURNSTILE_TEST !== "1",
    "Usa chaves públicas oficiais de teste, sem proteção de produção.",
  );
  test.setTimeout(120000);
  const signup = {
    name: "Pedro Almeida",
    company: "Distribuidora de teste",
    email: `antibot-${Date.now()}@example.com`,
    password: "Senha-segura-123",
  };
  const blocked = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: signup,
  });
  expect(blocked.status()).toBe(403);
  await page.goto("/cadastro");
  await page.getByLabel("Seu nome", { exact: true }).fill(signup.name);
  await page.getByLabel("Nome da empresa", { exact: true }).fill(signup.company);
  await page.getByLabel("E-mail", { exact: true }).fill(signup.email);
  await page.getByLabel("Senha", { exact: true }).fill(signup.password);
  await page.getByLabel("Confirmar senha", { exact: true }).fill(signup.password);
  const create = page.getByRole("button", { name: "Criar conta", exact: true });
  await expect(create).toBeEnabled({ timeout: 45000 });
  await page.screenshot({
    path: "/workspace/atendehub-cadastro-turnstile-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await create.click();
  await expect(page).toHaveURL(/\/[a-f0-9-]{36}$/, { timeout: 20000 });
  expect(
    (
      await context.request.post("/api/v1/auth/logout", {
        headers: { Origin: "http://127.0.0.1:3200" },
      })
    ).status(),
  ).toBe(204);
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(signup.email);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-incorreta");
  const enter = page.getByRole("button", { name: "Entrar", exact: true });
  await expect(enter).toBeEnabled({ timeout: 45000 });
  await enter.click();
  await expect(page.getByText("E-mail ou senha inválidos.", { exact: true })).toContainText(
    "E-mail ou senha inválidos",
  );
  await page.getByLabel("Senha", { exact: true }).fill(signup.password);
  await expect(enter).toBeEnabled({ timeout: 45000 });
  await page.screenshot({
    path: "/workspace/atendehub-login-turnstile-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: "/workspace/atendehub-login-turnstile-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await enter.click();
  await expect(page).toHaveURL(/\/[a-f0-9-]{36}$/, { timeout: 20000 });
});
