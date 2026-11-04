import { test, expect, type BrowserContext } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const base = "http://127.0.0.1:3200";
const cookieName = "atendehub_session";
async function register(context: BrowserContext, name = "Distribuidora Alfa") {
  const response = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: base },
    data: {
      name: "Ana Moreira",
      company: name,
      email: `tenant-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(response.status()).toBe(201);
  return response.json();
}
function updateDatabase(sql: string, value: string) {
  const metadata = JSON.parse(readFileSync(".e2e-backend.json", "utf8"));
  execFileSync(metadata.python, [
    "-c",
    "import sqlite3,sys; db=sqlite3.connect(sys.argv[1]); db.execute(sys.argv[2],(sys.argv[3],)); db.commit(); db.close()",
    metadata.database,
    sql,
    value,
  ]);
}
test("formulários usam API real e abrem somente o ID de empresa vinculado", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(base + "/login");
  await page.screenshot({ path: test.info().outputPath("login-desktop.png"), fullPage: true });
  await page.getByRole("link", { name: "Cadastre-se", exact: false }).click();
  await page.getByLabel("Seu nome", { exact: true }).fill("Ana Moreira");
  await page.getByLabel("Nome da empresa", { exact: true }).fill("Distribuidora Alfa");
  const email = `ana-${Date.now()}@example.com`;
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-segura-123");
  await page.getByLabel("Confirmar senha").fill("Senha-segura-123");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Olá, Ana Moreira!" })).toBeVisible();
  const me = await context.request.get("/api/v1/auth/me");
  expect(me.status()).toBe(200);
  const identity = await me.json();
  await expect(page).toHaveURL(`${base}/${identity.company.id}`);
  await expect(page.getByRole("heading", { name: "Olá, Ana Moreira!" })).toBeVisible();
  await expect(page.getByText("Distribuidora Alfa · Minha empresa")).toBeVisible();
  expect((await context.cookies()).find((c) => c.name === cookieName)?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain(cookieName);
  await page.screenshot({
    path: test.info().outputPath("workspace-auth-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(base + "/login");
  await page.goto(`/${identity.company.id}/configuracoes`);
  await expect(page).toHaveURL(base + "/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Errada-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "E-mail ou senha inválidos" }),
  ).toBeVisible();
  await page.getByLabel("Senha", { exact: true }).fill("Senha-segura-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(`${base}/${identity.company.id}`);
});
test("usuário A recebe 403 em todas as telas do tenant B, inclusive RSC e links diretos", async ({
  page,
  context,
  browser,
}) => {
  const a = await register(context, "Empresa Alfa privada");
  const other = await browser.newContext({ baseURL: base });
  const b = await register(other, "Empresa Beta confidencial");
  for (const suffix of [
    "",
    "/atendimentos",
    "/clientes",
    "/produtos",
    "/orcamentos",
    "/relatorios",
    "/configuracoes",
    "/integracoes",
    "/empresas",
  ]) {
    const response = await page.goto(`/${b.company.id}${suffix}`);
    expect(response?.status()).toBe(403);
    await expect(
      page.getByRole("heading", { name: "Você não tem acesso a esta empresa" }),
    ).toBeVisible();
    await expect(page.getByText("Empresa Beta confidencial", { exact: false })).toHaveCount(0);
  }
  await page.screenshot({
    path: test.info().outputPath("tenant-access-denied.png"),
    fullPage: true,
  });
  const rsc = await context.request.get(`/${b.company.id}/configuracoes`, {
    headers: { RSC: "1", "Next-Router-Prefetch": "1" },
  });
  expect(rsc.status()).toBe(403);
  expect(await rsc.text()).not.toContain("Empresa Beta confidencial");
  const users = await context.request.get(`/api/v1/users?company_id=${b.company.id}`);
  expect(users.status()).toBe(200);
  for (const user of await users.json()) expect(user.company_id).toBe(a.company.id);
  expect((await context.request.get(`/api/v1/users/${b.user.id}`)).status()).toBe(404);
  await page.getByRole("link", { name: "Ir para minha empresa" }).click();
  await expect(page).toHaveURL(`${base}/${a.company.id}`);
  await expect(page.getByText("Empresa Alfa privada · Minha empresa")).toBeVisible();
  await page.getByRole("link", { name: "Empresa Alfa privada · Minha empresa" }).click();
  await expect(page.getByRole("heading", { name: "Minha empresa" })).toBeVisible();
  await expect(page.getByText("Empresa Beta confidencial", { exact: true })).toHaveCount(0);
  await other.close();
});
test("token forjado e token revogado não autorizam a URL mesmo com cabeçalhos de bypass", async ({
  page,
  context,
}) => {
  const a = await register(context);
  const token = (await context.cookies()).find((c) => c.name === cookieName)!;
  expect(
    (
      await context.request.post("/api/v1/auth/logout", { headers: { Origin: base }, data: {} })
    ).status(),
  ).toBe(204);
  await context.addCookies([token]);
  await page.goto(`/${a.company.id}`);
  await expect(page).toHaveURL(base + "/login");
  await context.clearCookies();
  await context.addCookies([
    {
      name: cookieName,
      value: "token_falso_suficientemente_longo_para_teste_123",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  await page.goto(`/${a.company.id}/atendimentos`);
  await expect(page).toHaveURL(base + "/login");
  const forged = await context.request.get(`/${a.company.id}/clientes`, {
    headers: { "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy" },
    maxRedirects: 0,
  });
  expect([307, 308]).toContain(forged.status());
});
test("trial vencido e conta desativada bloqueiam o workspace no servidor", async ({
  page,
  context,
}) => {
  const a = await register(context);
  updateDatabase("UPDATE companies SET trial_ends_at=0 WHERE id=?", a.company.id);
  await page.goto(`/${a.company.id}`);
  await expect(page.getByRole("heading", { name: "Seu período de teste terminou" })).toBeVisible();
  await expect(page.getByText("Atendimentos por status", { exact: true })).toHaveCount(0);
  expect((await context.request.get("/api/v1/users")).status()).toBe(403);
  updateDatabase("UPDATE users SET active=0 WHERE id=?", a.user.id);
  await page.reload();
  await expect(page).toHaveURL(base + "/login");
});
test("proteção de origem e alias de login não abrem empresa arbitrária", async ({
  page,
  context,
}) => {
  expect(
    (
      await context.request.post("/api/v1/auth/login", {
        headers: { Origin: "https://evil.example" },
        data: { email: "ana@example.com", password: "Senha-segura-123" },
      })
    ).status(),
  ).toBe(403);
  await page.goto("/qualquer-empresa/login");
  await expect(page).toHaveURL(base + "/login");
  await page.goto("/qualquer-empresa/cadastro");
  await expect(page).toHaveURL(base + "/cadastro");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: test.info().outputPath("signup-mobile.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
