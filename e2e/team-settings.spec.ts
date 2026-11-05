import { test, expect } from "@playwright/test";
const base = "http://127.0.0.1:3200";
test("Equipe vem primeiro, conta usuários reais e atualiza após cadastro", async ({
  page,
  context,
  browser,
}) => {
  const stamp = Date.now();
  const registration = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: base },
    data: {
      name: "Pedro Almeida",
      company: "Aço Moreira",
      email: `pedro-${stamp}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(registration.status()).toBe(201);
  const identity = await registration.json();
  for (const [index, name, role] of [
    [1, "Ana Souza", "supervisor"],
    [2, "Lucas Nunes", "seller"],
    [3, "Camila Ribeiro", "operator"],
  ] as const) {
    const r = await context.request.post("/api/v1/users", {
      headers: { Origin: base },
      data: {
        name,
        email: `equipe-${index}-${stamp}@example.com`,
        password: "Senha-segura-123",
        role,
      },
    });
    expect(r.status()).toBe(201);
  }
  await page.goto(`/${identity.company.id}/configuracoes`);
  const categories = page.getByRole("tablist", { name: "Categorias de configurações" });
  const tabs = categories.getByRole("tab");
  await expect(tabs.nth(0)).toContainText("Equipe");
  await expect(tabs.nth(1)).toHaveText("Empresa");
  await expect(tabs.nth(2)).toHaveText("Aparência");
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("Quantidade de usuários: 4")).toHaveText("4");
  await expect(page.getByText("Ana Souza", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Adicionar usuário", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Adicionar usuário", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
  await expect(dialog).toHaveCSS("opacity", "1");
  await page.screenshot({ path: test.info().outputPath("user-create-modal-desktop.png") });
  await dialog.getByLabel("Nome completo", { exact: true }).fill("Juliana Costa");
  const email = `juliana-${stamp}@example.com`;
  await dialog.getByLabel("E-mail", { exact: true }).fill(identity.user.email);
  await dialog.getByLabel("Perfil de acesso", { exact: true }).selectOption("seller");
  await dialog.getByLabel("Senha inicial", { exact: true }).fill("Senha-segura-456");
  await dialog.getByRole("button", { name: "Cadastrar usuário", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("E-mail indisponível");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await dialog.getByLabel("E-mail", { exact: true }).fill(email);
  await dialog.getByRole("button", { name: "Cadastrar usuário", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const success = page.getByRole("alertdialog", { name: "Usuário cadastrado", exact: true });
  await expect(success).toBeVisible();
  await success.evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
  await expect(success).toHaveCSS("opacity", "1");
  await expect(success.getByText("Juliana Costa", { exact: true })).toBeVisible();
  const blur = await page
    .locator('[data-state="open"][class*="backdrop-blur-sm"]')
    .evaluate((element) => getComputedStyle(element).backdropFilter);
  expect(blur).toContain("blur");
  await page.screenshot({ path: test.info().outputPath("user-success-modal-desktop.png") });
  await success.getByRole("button", { name: "Voltar para equipe" }).click();
  await expect(success).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Adicionar usuário", exact: true })).toBeFocused();
  await expect(page.getByLabel("Quantidade de usuários: 5")).toHaveText("5");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("settings-team-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Editar Ana Souza", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Editar usuário", exact: true });
  await expect(editor).toHaveAttribute("data-display-mode", "modal");
  await editor.getByLabel("Nome completo", { exact: true }).fill("Ana Souza Martins");
  async function captureEditor(filename: string) {
    await editor.evaluate(async (element) => {
      await Promise.all(
        element.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})),
      );
    });
    await page.screenshot({ path: test.info().outputPath(filename) });
  }
  await captureEditor("user-edit-modal.png");
  await editor.getByRole("button", { name: "Modo de exibição" }).click();
  await page.getByRole("group", { name: "Formato do formulário" }).waitFor();
  await page.screenshot({
    path: test.info().outputPath("user-edit-mode-picker.png"),
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Tela cheia", exact: true }).click();
  await expect(editor).toHaveAttribute("data-display-mode", "fullscreen");
  await expect(editor.getByLabel("Nome completo", { exact: true })).toHaveValue(
    "Ana Souza Martins",
  );
  expect(
    await editor.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return (
        Math.abs(r.x) < 1 &&
        Math.abs(r.y) < 1 &&
        Math.abs(r.width - innerWidth) < 1 &&
        Math.abs(r.height - innerHeight) < 1
      );
    }),
  ).toBe(true);
  await captureEditor("user-edit-fullscreen.png");
  await editor.getByRole("button", { name: "Modo de exibição" }).click();
  await page.getByRole("button", { name: "Barra lateral", exact: true }).click();
  await expect(editor).toHaveAttribute("data-display-mode", "aside");
  expect(
    await editor.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.y === 0 && r.right === innerWidth && r.height === innerHeight;
    }),
  ).toBe(true);
  await captureEditor("user-edit-aside.png");
  await editor.getByRole("button", { name: "Salvar alterações", exact: true }).click();
  const saved = page.getByRole("alertdialog", { name: "Alterações salvas", exact: true });
  await expect(saved).toBeVisible();
  await saved.getByRole("button", { name: "Voltar para equipe" }).click();
  await expect(page.getByText("Ana Souza Martins", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Quantidade de usuários: 5")).toHaveText("5");
  await page.reload();
  await page.getByRole("button", { name: "Editar Ana Souza Martins", exact: true }).click();
  await expect(editor).toHaveAttribute("data-display-mode", "aside");
  await expect(editor.getByLabel("Nome completo", { exact: true })).toHaveValue(
    "Ana Souza Martins",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => editor.evaluate((el) => el.getBoundingClientRect().width <= innerWidth))
    .toBe(true);
  await editor.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await categories.getByRole("tab", { name: "Aparência", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Estilo da interface" })).toBeVisible();
  await expect(page.getByLabel("Quantidade de usuários: 5")).toHaveText("5");
  await tabs.nth(0).click();
  await expect(page.getByLabel("Quantidade de usuários: 5")).toHaveText("5");
  await page.reload();
  await expect(page.getByLabel("Quantidade de usuários: 5")).toHaveText("5");
  const other = await browser.newContext({ baseURL: base });
  const login = await other.request.post("/api/v1/auth/login", {
    headers: { Origin: base },
    data: { email, password: "Senha-segura-456", remember: false },
  });
  expect(login.status()).toBe(200);
  const employee = await other.newPage();
  await employee.goto(`/${identity.company.id}/configuracoes`);
  await expect(
    employee.getByRole("heading", { name: "Acesso restrito ao administrador" }),
  ).toBeVisible();
  await expect(
    employee.getByRole("button", { name: "Adicionar usuário", exact: true }),
  ).toHaveCount(0);
  expect((await other.request.get("/api/v1/users")).status()).toBe(403);
  await employee.getByRole("tab", { name: "Aparência", exact: true }).click();
  await expect(employee.getByRole("heading", { name: "Estilo da interface" })).toBeVisible();
  await other.close();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByLabel("Quantidade de usuários: 5")).toHaveText("5");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("settings-team-mobile.png"),
    fullPage: true,
  });
});
