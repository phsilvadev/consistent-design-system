import { test, expect } from "@playwright/test";
const origin = "http://127.0.0.1:3200";
test("Central sincroniza duas sessões, preserva rascunho e mantém leitura individual", async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(65000);
  const stamp = Date.now();
  const registration = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: origin },
    data: {
      name: "Pedro Almeida",
      company: "Moreira Distribuidora",
      email: `live-${stamp}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(registration.status()).toBe(201);
  const identity = await registration.json();
  const person = {
    name: "Ana Souza",
    email: `live-seller-${stamp}@example.com`,
    password: "Senha-segura-123",
    role: "seller",
  };
  const result = await context.request.post("/api/v1/users", {
    headers: { Origin: origin },
    data: person,
  });
  const seller = await result.json();
  async function newConversation(
    name: string,
    phone: string,
    subject: string,
    owner: string | null,
  ) {
    const response = await context.request.post("/api/v1/conversations", {
      headers: { Origin: origin },
      data: {
        request_id: crypto.randomUUID(),
        customer_name: name,
        customer_phone: phone,
        customer_business: "Construção e estruturas",
        subject,
        assigned_user_id: owner,
        initial_message: "Solicitação registrada para acompanhamento da equipe.",
      },
    });
    expect(response.status()).toBe(201);
    return response.json();
  }
  const conversation = await newConversation(
    "Carlos Mendes",
    "11999990101",
    "Metalon 30x30 chapa 18 — 20 barras",
    seller.id,
  );
  await newConversation("Juliana Costa", "11999990102", "Vergalhão CA-50 12 mm", null);
  async function note(body: string) {
    const current = await (
      await context.request.get(`/api/v1/conversations/${conversation.id}`)
    ).json();
    const response = await context.request.post(
      `/api/v1/conversations/${conversation.id}/messages`,
      {
        headers: { Origin: origin },
        data: {
          request_id: crypto.randomUUID(),
          version: current.version,
          kind: "internal_note",
          body,
        },
      },
    );
    expect(response.status()).toBe(201);
    return response.json();
  }
  await note("Conferir as medidas e o prazo de retirada com o cliente.");
  const employeeContext = await browser.newContext({
    baseURL: origin,
    viewport: { width: 1440, height: 1000 },
  });
  await employeeContext.request.post("/api/v1/auth/login", {
    headers: { Origin: origin },
    data: { email: person.email, password: person.password },
  });
  const employee = await employeeContext.newPage();
  await employee.goto(`/${identity.company.id}/atendimentos`);
  await expect(employee.getByLabel("Com registros não lidos: 2", { exact: true })).toBeVisible();
  const card = employee.getByRole("button", { name: /Abrir atendimento de Carlos Mendes/ });
  await expect(card.getByLabel("2 registros não lidos", { exact: true })).toBeVisible();
  await employee.getByRole("heading", { name: "Atendimentos", exact: true }).click();
  await employee.screenshot({
    path: test.info().outputPath("conversations-unread-desktop.png"),
    fullPage: true,
  });
  await employee.getByRole("button", { name: /Não lidos/ }).click();
  await card.click();
  const panel = employee.getByRole("dialog", { name: "Carlos Mendes", exact: true });
  await expect(panel.getByRole("log")).toContainText("Conferir as medidas");
  await expect
    .poll(
      async () =>
        (
          await (
            await employeeContext.request.get(`/api/v1/conversations/${conversation.id}`)
          ).json()
        ).unread_count,
    )
    .toBe(0);
  const draft = panel.getByRole("textbox", { name: "Mensagem do atendimento", exact: true });
  await draft.fill("Rascunho da Ana preservado durante as atualizações.");
  await note("Pedro atualizou a condição comercial enquanto Ana atende.");
  await expect(panel.getByRole("log")).toContainText("Pedro atualizou a condição comercial", {
    timeout: 15000,
  });
  await expect(draft).toHaveValue("Rascunho da Ana preservado durante as atualizações.");
  await panel.getByRole("button", { name: "Registrar", exact: true }).click();
  await expect(panel.getByRole("log")).toContainText("Rascunho da Ana preservado");
  expect(
    (await (await context.request.get(`/api/v1/conversations/${conversation.id}`)).json())
      .unread_count,
  ).toBe(1);
  await expect(employee.getByLabel("Com registros não lidos: 1", { exact: true })).toBeVisible({
    timeout: 15000,
  });
  await expect(panel.getByText("Primeira resposta manual:", { exact: false })).toBeVisible();
  await panel.evaluate(async (el) => {
    await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
  });
  await employee.screenshot({ path: test.info().outputPath("conversation-live-desktop.png") });
  await employee.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      panel.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return r.x >= 0 && r.right <= innerWidth;
      }),
    )
    .toBe(true);
  await employee.screenshot({ path: test.info().outputPath("conversation-live-mobile.png") });
  const current = await (
    await context.request.get(`/api/v1/conversations/${conversation.id}`)
  ).json();
  expect(
    (
      await context.request.patch(`/api/v1/conversations/${conversation.id}`, {
        headers: { Origin: origin },
        data: { version: current.version, assigned_user_id: identity.user.id },
      })
    ).status(),
  ).toBe(200);
  const deniedPanel = employee.getByRole("dialog", { name: "Atendimento", exact: true });
  await expect(
    deniedPanel.getByText(
      "Este atendimento foi transferido ou não está mais disponível para seu perfil.",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 15000 });
  await expect(deniedPanel.getByRole("log")).toHaveCount(0);
  expect(
    (
      await employeeContext.request.post(`/api/v1/conversations/${conversation.id}/read`, {
        headers: { Origin: origin },
        data: { last_message_id: 1 },
      })
    ).status(),
  ).toBe(404);
  await employeeContext.close();
  await page.goto(`/${identity.company.id}/atendimentos`);
  await expect(page.getByLabel("Registros não lidos: 1", { exact: true })).toBeVisible();
});
