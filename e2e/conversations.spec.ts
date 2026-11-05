import { test, expect } from "@playwright/test";
const origin = "http://127.0.0.1:3200";
test("Central manual persiste atendimento, responsável, status e histórico", async ({
  page,
  context,
  browser,
}) => {
  const stamp = Date.now();
  const r = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: origin },
    data: {
      name: "Pedro Almeida",
      company: "Moreira Distribuidora",
      email: `central-${stamp}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(r.status()).toBe(201);
  const identity = await r.json();
  const employeeInput = {
    name: "Ana Souza",
    email: `central-seller-${stamp}@example.com`,
    password: "Senha-segura-123",
    role: "seller",
  };
  const employeeResult = await context.request.post("/api/v1/users", {
    headers: { Origin: origin },
    data: employeeInput,
  });
  const employee = await employeeResult.json();
  await page.goto(`/${identity.company.id}/atendimentos`);
  await expect(
    page.getByRole("heading", { name: "Sua central está pronta para começar" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Novo atendimento", exact: true }).click();
  const create = page.getByRole("dialog", { name: "Novo atendimento", exact: true });
  await expect(create).toBeVisible();
  await create.getByLabel("Nome do cliente", { exact: true }).fill("Carlos Mendes");
  await create.getByLabel("Telefone", { exact: true }).fill("(11) 99999-0101");
  await create.getByLabel("Empresa do cliente", { exact: true }).fill("Construtora Vale");
  await create.getByLabel("Assunto", { exact: true }).fill("Metalon 30x30 chapa 18 — 20 barras");
  await create
    .getByLabel("Relato do cliente", { exact: true })
    .fill("Preciso de 20 barras de metalon com 6 metros. Quero retirar na loja.");
  await create.evaluate(async (el) => {
    await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
  });
  await page.screenshot({ path: test.info().outputPath("conversation-create-desktop.png") });
  await create.getByRole("button", { name: "Criar atendimento", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Carlos Mendes", exact: true });
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("data-display-mode", "modal");
  await expect(panel.getByRole("log")).toContainText("Preciso de 20 barras");
  await panel
    .getByRole("textbox", { name: "Mensagem do atendimento", exact: true })
    .fill("Olá, Carlos! Vou acompanhar sua solicitação e conferir os itens com a equipe.");
  await panel.getByRole("button", { name: "Registrar", exact: true }).click();
  await expect(panel.getByRole("log")).toContainText("Vou acompanhar sua solicitação");
  await panel
    .getByRole("combobox", { name: "Tipo de registro", exact: true })
    .selectOption("internal_note");
  await panel
    .getByRole("textbox", { name: "Mensagem do atendimento", exact: true })
    .fill("Cliente prefere retirada. Validar disponibilidade antes de oferecer prazo.");
  await panel.getByRole("button", { name: "Registrar", exact: true }).click();
  await expect(panel.getByRole("log")).toContainText("Cliente prefere retirada");
  const draft = panel.getByRole("textbox", { name: "Mensagem do atendimento", exact: true });
  await draft.fill("Rascunho preservado ao trocar a visualização.");
  await panel.getByRole("button", { name: "Modo de exibição", exact: true }).click();
  await page.getByRole("group", { name: "Formato da conversa", exact: true }).waitFor();
  await page.screenshot({
    path: test.info().outputPath("conversation-mode-picker.png"),
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Modal", exact: true }).click();
  async function captureMode(name: string) {
    await panel.evaluate(async (el) => {
      await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
    });
    await page.screenshot({ path: test.info().outputPath(`conversation-mode-${name}.png`) });
  }
  await captureMode("modal");
  for (const [label, mode] of [
    ["Tela cheia", "fullscreen"],
    ["Barra lateral", "aside"],
  ] as const) {
    await panel.getByRole("button", { name: "Modo de exibição", exact: true }).click();
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(panel).toHaveAttribute("data-display-mode", mode);
    await expect(draft).toHaveValue("Rascunho preservado ao trocar a visualização.");
    await expect(panel.getByRole("log")).toContainText("Cliente prefere retirada");
    if (mode === "fullscreen")
      await expect
        .poll(() =>
          panel.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return (
              Math.abs(r.x) < 1 &&
              Math.abs(r.y) < 1 &&
              Math.abs(r.width - innerWidth) < 1 &&
              Math.abs(r.height - innerHeight) < 1
            );
          }),
        )
        .toBe(true);
    else
      expect(
        await panel.evaluate((el) => Math.abs(el.getBoundingClientRect().right - innerWidth) < 1),
      ).toBe(true);
    await captureMode(mode);
  }

  await panel
    .getByRole("combobox", { name: "Status do atendimento", exact: true })
    .selectOption("quoting");
  await expect(
    panel.getByRole("combobox", { name: "Status do atendimento", exact: true }),
  ).toHaveValue("quoting");
  await page.reload();
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("data-display-mode", "aside");
  await expect(panel.getByRole("log")).toContainText("Cliente prefere retirada");
  await expect(
    panel.getByRole("combobox", { name: "Status do atendimento", exact: true }),
  ).toHaveValue("quoting");
  await panel
    .getByRole("combobox", { name: "Responsável do atendimento", exact: true })
    .selectOption(employee.id);
  await expect(
    panel.getByRole("combobox", { name: "Responsável do atendimento", exact: true }),
  ).toHaveValue(employee.id);
  await expect(panel.getByRole("log")).toContainText("Responsável alterado para Ana Souza");
  await panel.evaluate(async (el) => {
    await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
  });
  await page.screenshot({ path: test.info().outputPath("conversation-history-desktop.png") });
  await panel
    .getByRole("combobox", { name: "Status do atendimento", exact: true })
    .selectOption("closed");
  await expect(
    panel.getByRole("button", { name: "Reabrir atendimento", exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByRole("textbox", { name: "Mensagem do atendimento", exact: true }),
  ).toBeDisabled();
  await panel.getByRole("button", { name: "Reabrir atendimento", exact: true }).click();
  await expect(
    panel.getByRole("textbox", { name: "Mensagem do atendimento", exact: true }),
  ).toBeEnabled();
  await panel.getByRole("button", { name: "Close", exact: true }).click();
  for (const [name, phone, subject, status] of [
    ["Juliana Costa", "11999990102", "Vergalhão CA-50 12 mm", "awaiting_customer"],
    ["Roberto Lima", "11999990103", "Chapa 3 mm — orçamento", "quoting"],
    ["Paulo Santos", "11999990104", "Cantoneira — retirada concluída", "closed"],
  ]) {
    const response = await context.request.post("/api/v1/conversations", {
      headers: { Origin: origin },
      data: {
        request_id: crypto.randomUUID(),
        customer_name: name,
        customer_phone: phone,
        customer_business: "Obras e estruturas",
        subject,
        assigned_user_id: identity.user.id,
        initial_message: "Solicitação registrada manualmente para acompanhamento comercial.",
      },
    });
    expect(response.status()).toBe(201);
    const conv = await response.json();
    expect(
      (
        await context.request.patch(`/api/v1/conversations/${conv.id}`, {
          headers: { Origin: origin },
          data: { version: conv.version, status },
        })
      ).status(),
    ).toBe(200);
  }
  await page.getByRole("button", { name: "Atualizar atendimentos", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Abrir atendimento de Juliana Costa/ }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("conversations-board-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("textbox", { name: "Buscar atendimento", exact: true }).fill("Metalon");
  await expect(
    page.getByRole("button", { name: /Abrir atendimento de Juliana Costa/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Abrir atendimento de Carlos Mendes/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Abrir atendimento de Carlos Mendes/ }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(panel).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await panel.evaluate(async (el) => {
    await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
  });
  await expect
    .poll(() =>
      panel.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return Math.abs(r.x) < 1 && Math.abs(r.width - innerWidth) < 1;
      }),
    )
    .toBe(true);
  await page.screenshot({ path: test.info().outputPath("conversation-history-mobile.png") });
  const seller = await browser.newContext({ baseURL: origin });
  await seller.request.post("/api/v1/auth/login", {
    headers: { Origin: origin },
    data: { email: employeeInput.email, password: employeeInput.password },
  });
  const convs = await (await seller.request.get("/api/v1/conversations")).json();
  expect(convs.total).toBe(1);
  expect(convs.items[0].customer.name).toBe("Carlos Mendes");
  const otherTenant = await browser.newContext({ baseURL: origin });
  await otherTenant.request.post("/api/v1/auth/register", {
    headers: { Origin: origin },
    data: {
      name: "Administrador Beta",
      company: "Beta",
      email: `central-beta-${stamp}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(
    (await otherTenant.request.get(`/api/v1/conversations/${convs.items[0].id}`)).status(),
  ).toBe(404);
  expect((await otherTenant.request.get("/api/v1/conversations")).status()).toBe(200);
  expect((await (await otherTenant.request.get("/api/v1/conversations")).json()).total).toBe(0);
  await seller.close();
  await otherTenant.close();
});
