import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

test("Mensagem assinada da Meta aparece na central sem duplicar", async ({ page, context }) => {
  const registration = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Almeida",
      company: "Moreira Distribuidora",
      email: `whatsapp-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(registration.status()).toBe(201);
  const identity = await registration.json();
  const metadata = JSON.parse(readFileSync(".e2e-backend.json", "utf8"));
  execFileSync(metadata.python, [
    "-c",
    "import sqlite3,sys; db=sqlite3.connect(sys.argv[1]); db.execute('INSERT INTO whatsapp_numbers (phone_number_id,company_id,waba_id,active,revision) VALUES (?,?,?,1,0)',('111',sys.argv[2],'222')); db.commit()",
    metadata.database,
    identity.company.id,
  ]);
  const event = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "222",
        changes: [
          {
            field: "messages",
            value: {
              metadata: { phone_number_id: "111" },
              contacts: [{ wa_id: "5511999999010", profile: { name: "Carlos Mendes" } }],
              messages: [
                {
                  from: "5511999999010",
                  id: "wamid.e2e",
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: {
                    body: "Bom dia! Vocês têm metalon 30x30 chapa 18? Preciso de 20 barras.",
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  });
  for (let i = 0; i < 2; i++) {
    const response = await context.request.post("http://127.0.0.1:8200/api/v1/webhooks/whatsapp", {
      data: event,
      headers: {
        "x-hub-signature-256":
          "sha256=" + createHmac("sha256", "test-only-webhook-secret").update(event).digest("hex"),
      },
    });
    expect(response.status()).toBe(200);
  }
  const conversations = await (await context.request.get("/api/v1/conversations")).json();
  expect(conversations.total).toBe(1);
  await page.goto(`/${identity.company.id}/atendimentos`);
  await page.getByRole("button", { name: /Abrir atendimento de Carlos Mendes/ }).click();
  await expect(page.getByText("Cliente · WhatsApp")).toBeVisible();
  await expect(
    page.getByText("Bom dia! Vocês têm metalon 30x30 chapa 18? Preciso de 20 barras."),
  ).toHaveCount(1);
  await page.screenshot({
    path: "/workspace/atendehub-whatsapp-inbound-desktop.png",
    fullPage: true,
  });
});
