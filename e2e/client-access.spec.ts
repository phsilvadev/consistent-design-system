import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

test("layout de login/cadastro, Google e recuperação completa com API real", async ({
  page,
  context,
}) => {
  test.skip(process.env.E2E_CLIENT_ACCESS_STUB !== "1", "Requer transportes Google/SMTP isolados.");
  await page.route("https://accounts.google.com/gsi/client", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `let settings;
    window.google = {accounts:{id:{initialize: function(value){settings=value}, cancel:function(){}, renderButton:function(container){
      const button=document.createElement('button');button.type='button';button.textContent='Entrar com Google';button.style='width:100%;border:1px solid #dadce0;border-radius:24px;background:white;padding:12px;font-size:14px';
      button.onclick=function(){settings.callback({credential:'e2e-only-google.'+btoa(JSON.stringify({sub:'1234567890',email:'google-user@gmail.com',email_verified:true,nonce:settings.nonce,name:'Pedro Google'}))})};container.replaceChildren(button);
    }}}};`,
    });
  });
  await page.goto("/login");
  await expect(
    page.getByRole("link", { name: "Esqueci minha senha", exact: true }),
  ).toHaveAttribute("href", "/esqueci-senha");
  await expect(page.getByRole("button", { name: "Entrar com Google", exact: true })).toBeEnabled();
  await page.screenshot({ path: "/workspace/cliente-login-novo-desktop.png", fullPage: true });
  await page.getByRole("link", { name: "Cadastre-se", exact: true }).click();
  await page.getByLabel("Nome da empresa", { exact: true }).fill("Moreira Distribuidora");
  await expect(page.getByRole("button", { name: "Entrar com Google", exact: true })).toBeEnabled();
  await page.screenshot({ path: "/workspace/cliente-cadastro-novo-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Entrar com Google", exact: true }).click();
  await expect(page).toHaveURL(/\/[a-f0-9-]{36}$/);
  const first = await (await context.request.get("/api/v1/auth/me")).json();
  expect(first.user.role).toBe("admin");
  expect(first.company.trial_ends_at - first.company.trial_started_at).toBe(604800);
  await context.request.post("/api/v1/auth/logout", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {},
  });
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar com Google", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${first.company.id}$`));
  await page.getByRole("button", { name: "Menu da conta", exact: true }).click();
  await page.getByRole("menuitem", { name: "Sair da conta", exact: true }).click();
  await page.getByRole("link", { name: "Esqueci minha senha", exact: true }).click();
  await expect(page).toHaveURL(/\/esqueci-senha$/);
  await expect(
    page.getByRole("button", { name: "Enviar link de recuperação", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("E-mail", { exact: true }).fill("google-user@gmail.com");
  await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue("google-user@gmail.com");
  await page.screenshot({ path: "/workspace/cliente-recuperar-senha-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Enviar link de recuperação", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Confira seu e-mail", exact: true }),
  ).toBeVisible();
  const metadata = JSON.parse(readFileSync(".e2e-backend.json", "utf8"));
  const email = JSON.parse(
    readFileSync(join(dirname(metadata.database), "reset-email.json"), "utf8"),
  );
  await page.goto(`/redefinir-senha#token=${email.token}`);
  await expect(page).toHaveURL(/\/redefinir-senha$/);
  await page.getByLabel("Nova senha", { exact: true }).fill("Nova-senha-segura-123!");
  await page.getByLabel("Confirmar nova senha", { exact: true }).fill("Nova-senha-segura-123!");
  await page.screenshot({ path: "/workspace/cliente-redefinir-senha-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Salvar nova senha", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Senha atualizada", exact: true })).toBeVisible();
  const login = await context.request.post("/api/v1/auth/login", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: { email: "google-user@gmail.com", password: "Nova-senha-segura-123!" },
  });
  expect(login.status()).toBe(200);
  expect((await login.json()).company.id).toBe(first.company.id);
  await context.clearCookies();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cadastro");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/workspace/cliente-cadastro-novo-mobile.png", fullPage: true });
});
