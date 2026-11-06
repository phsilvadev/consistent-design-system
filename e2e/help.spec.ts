import { test, expect } from "@playwright/test";
test("ajuda no rodapé, busca, categorias, chat e isolamento", async ({
  page,
  context,
  browser,
}) => {
  const result = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Henrique",
      company: "Moreira Distribuidora",
      email: `help-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(result.status()).toBe(201);
  const identity = await result.json();
  await page.goto(`/${identity.company.id}`);
  const sidebar = page.locator("[data-app-sidebar]");
  await sidebar.getByRole("link", { name: "Ajuda e suporte", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${identity.company.id}/ajuda$`));
  await expect(
    page.getByRole("heading", { name: "Como podemos ajudar?", exact: true }),
  ).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Ajuda e suporte", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("button", { name: "Integrações", exact: false }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "4 respostas encontradas" }),
  ).toBeVisible();
  await page.getByText("Como conecto o WhatsApp por QR Code?", { exact: true }).click();
  await page.screenshot({ path: "/workspace/cliente-ajuda-suporte-desktop.png", fullPage: true });
  const search = page.getByRole("searchbox", { name: "Buscar na central de ajuda" });
  await page.getByRole("button", { name: "Ver todas", exact: true }).click();
  await search.fill("usuario");
  await expect(page.getByRole("status").filter({ hasText: "2 respostas encontradas" })).toBeVisible();
  await search.fill("xxxxxxxxxxx");
  await expect(
    page.getByText("Não encontramos uma resposta para essa busca.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver todas", exact: true }).click();
  await page.getByRole("button", { name: "Abrir chat de suporte", exact: true }).click();
  const chat = page.getByRole("dialog", { name: "Chat de suporte", exact: true });
  await expect(chat).toBeVisible();
  await chat.getByRole("button", { name: "Fechar chat", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "/workspace/cliente-ajuda-suporte-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Menu da conta", exact: true }).click();
  await expect(
    page.getByRole("menuitem", { name: "Ajuda e suporte", exact: true }),
  ).toHaveAttribute("href", `/${identity.company.id}/ajuda`);
  expect((await context.request.get("/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/ajuda")).status()).toBe(
    403,
  );
  const anonymous = await browser.newContext();
  const anon = await anonymous.request.get(`/${identity.company.id}/ajuda`, { maxRedirects: 0 });
  expect(anon.status()).toBe(307);
  expect(anon.headers()["location"]).toContain("/login");
  await anonymous.close();
});
