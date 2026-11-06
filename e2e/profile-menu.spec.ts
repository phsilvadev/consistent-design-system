import { test, expect } from "@playwright/test";
test("perfil abre menu, navega dentro da empresa e encerra sessão", async ({ page, context }) => {
  const response = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Henrique",
      company: "Distribuidora Moreira",
      email: `profile-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(response.status()).toBe(201);
  const identity = await response.json();
  await page.goto(`/${identity.company.id}`);
  await page.getByRole("button", { name: "Menu da conta" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Integrações", exact: true })).toHaveAttribute(
    "href",
    `/${identity.company.id}/integracoes`,
  );
  await page.waitForTimeout(1600);
  await page.screenshot({ path: "/workspace/cliente-menu-perfil-desktop.png" });
  await page.getByRole("menuitem", { name: "Configurações da conta", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${identity.company.id}/configuracoes$`));
  await page.getByRole("button", { name: "Menu da conta" }).click();
  await page.getByRole("menuitem", { name: "Sair da conta", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.request.get("/api/v1/auth/me")).status()).toBe(401);
});
