import { test, expect } from "@playwright/test";
test("faixa do teste gratuito no painel", async ({ page, context }) => {
  const response = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Almeida",
      company: "Distribuidora Moreira",
      email: `trial-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(response.status()).toBe(201);
  const identity = await response.json();
  await page.goto(`/${identity.company.id}`);
  await expect(page.getByRole("status", { name: "Período de teste" })).toContainText(
    "Restam 7 dias",
  );
  await page.waitForTimeout(1800); // Aguarda a animação de entrada dos gráficos para o print.
  await page.screenshot({ path: "/workspace/cliente-faixa-teste-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("status", { name: "Período de teste" })).toBeVisible();
  const bounds = await page.getByRole("status", { name: "Período de teste" }).boundingBox();
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "/workspace/cliente-faixa-teste-mobile.png" });
});
