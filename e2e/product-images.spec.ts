import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
test("Upload privado da imagem com arrastar/soltar, persistência e isolamento", async ({
  page,
  context,
  browser,
}) => {
  test.skip(
    process.env.E2E_FIREBASE_STORAGE_STUB !== "1",
    "Requer o runner isolado com SDK Storage simulado.",
  );
  const headers = { Origin: "http://127.0.0.1:3200" };
  const signup = {
    name: "Pedro Almeida",
    company: "Moreira Distribuidora",
    email: `images-${Date.now()}@example.com`,
    password: "Senha-segura-123",
  };
  const registration = await context.request.post("/api/v1/auth/register", {
    headers,
    data: signup,
  });
  expect(registration.status()).toBe(201);
  const identity = await registration.json();
  const prefix = "/api/v1/integrations/gestaoclick";
  expect(
    (
      await context.request.post(prefix, {
        headers,
        data: {
          version: 0,
          base_url: "https://api.gestaoclick.com/api",
          access_token: "test-only-access-token",
          secret_access_token: "test-only-secret-token",
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await context.request.post(`${prefix}/test`, { headers, data: { version: 1 } })).status(),
  ).toBe(200);
  expect(
    (
      await context.request.post(`${prefix}/store`, {
        headers,
        data: { version: 2, store_id: "2" },
      })
    ).status(),
  ).toBe(200);
  const run = await (
    await context.request.post(`${prefix}/products-sync/start`, { headers, data: { version: 3 } })
  ).json();
  expect(
    (
      await context.request.post(`${prefix}/products-sync/next`, {
        headers,
        data: { run_id: run.run_id },
      })
    ).status(),
  ).toBe(200);
  await new Promise((resolve) => setTimeout(resolve, 1100));
  expect(
    (
      await context.request.post(`${prefix}/products-sync/next`, {
        headers,
        data: { run_id: run.run_id },
      })
    ).status(),
  ).toBe(200);
  const catalog = await (await context.request.get("/api/v1/products")).json();
  const product = catalog.items.find((item: { erp_id: string }) => item.erp_id === "1");
  await page.goto(`/${identity.company.id}/produtos`);
  await expect(page.getByText("Sem imagem", { exact: true })).toHaveCount(2);
  await page
    .getByRole("button", { name: "Adicionar imagem de Metalon 30x30 Chapa 18", exact: true })
    .click();
  const modal = page.getByRole("dialog", { name: "Adicionar imagem ao produto", exact: true });
  await expect(modal.getByText("Arraste e solte a imagem aqui", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "/workspace/atendehub-produto-upload-modal-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await modal.getByLabel("Selecionar imagem do produto").setInputFiles({
    name: "unsafe.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(modal.getByRole("alert")).toContainText("Formato não permitido");
  const fixture = await readFile(path.join(process.cwd(), "e2e/fixtures/product-tube.png"));
  const transfer = await page.evaluateHandle((base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const data = new DataTransfer();
    data.items.add(new File([bytes], "metalon.png", { type: "image/png" }));
    return data;
  }, fixture.toString("base64"));
  await modal
    .getByRole("button", { name: "Área de upload de imagem" })
    .dispatchEvent("drop", { dataTransfer: transfer });
  await expect(modal.getByAltText("Prévia de Metalon 30x30 Chapa 18")).toBeVisible();
  await page.screenshot({
    path: "/workspace/atendehub-produto-upload-previa-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: "/workspace/atendehub-produto-upload-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const uploadedResponse = page.waitForResponse(
    (r) => r.url().includes(`/products/${product.id}/image`) && r.request().method() === "POST",
  );
  await modal.getByRole("button", { name: "Enviar imagem", exact: true }).click();
  expect((await uploadedResponse).status()).toBe(200);
  await expect(
    page.getByRole("dialog", { name: "Imagem atualizada", exact: true }).getByRole("status"),
  ).toContainText("Imagem salva com sucesso");
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await expect(page.getByText("Com imagem", { exact: true })).toHaveCount(1);
  await page.reload();
  const thumb = page.getByAltText("Foto de Metalon 30x30 Chapa 18", { exact: true });
  await expect(thumb).toBeVisible();
  await expect
    .poll(() => thumb.evaluate((element) => (element as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await page.screenshot({
    path: "/workspace/atendehub-produtos-com-imagem-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  const other = await browser.newContext({ baseURL: "http://127.0.0.1:3200" });
  const imagePath = `/api/v1/products/${product.id}/image`;
  expect((await other.request.get(imagePath)).status()).toBe(401);
  await other.request.post("/api/v1/auth/register", {
    headers,
    data: { ...signup, email: `images-other-${Date.now()}@example.com`, company: "Outra empresa" },
  });
  expect((await other.request.get(imagePath)).status()).toBe(404);
  expect(
    (
      await other.request.post(`${imagePath}?version=1`, {
        headers: { ...headers, "Content-Type": "image/png" },
        data: fixture,
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await context.request.post(`${imagePath}?version=1`, {
        headers: { Origin: "https://attacker.example", "Content-Type": "image/png" },
        data: fixture,
      })
    ).status(),
  ).toBe(403);
  await other.close();
});
