import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

test("chat anima entrada/saída, resposta e mantém conversa ao recolher", async ({
  page,
  context,
}) => {
  const result = await context.request.post("/api/v1/auth/register", {
    headers: { Origin: "http://127.0.0.1:3200" },
    data: {
      name: "Pedro Henrique",
      company: "Moreira Distribuidora",
      email: `motion-${Date.now()}@example.com`,
      password: "Senha-segura-123",
    },
  });
  expect(result.status()).toBe(201);
  const identity = await result.json();
  await page.goto(`/${identity.company.id}/ajuda`);
  const capture = await context.newCDPSession(page);
  const frames: { data: string; timestamp: number }[] = [];
  capture.on("Page.screencastFrame", (frame) => {
    frames.push({ data: frame.data, timestamp: frame.metadata.timestamp ?? Date.now() / 1000 });
    void capture.send("Page.screencastFrameAck", { sessionId: frame.sessionId });
  });
  await capture.send("Page.startScreencast", {
    format: "jpeg",
    quality: 80,
    maxWidth: 1440,
    maxHeight: 1000,
  });
  const chat = page.getByRole("dialog", { name: "Chat de suporte", exact: true });
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Abrir suporte", exact: true }).click();
  await expect(chat).toHaveCSS("animation-name", /expand/);
  await expect(chat.getByRole("textbox")).toBeFocused();
  await page.waitForTimeout(500);
  await chat.getByRole("button", { name: "Conectar meu WhatsApp", exact: false }).click();
  await expect(
    chat.getByRole("status", { name: "Assistente preparando resposta", exact: true }),
  ).toBeVisible();
  await expect(chat.getByRole("button", { name: "Enviar mensagem", exact: true })).toBeDisabled();
  await page.screenshot({ path: "/workspace/cliente-suporte-animado-desktop.png" });
  await expect(chat.getByRole("log")).toContainText("Dispositivos conectados");
  await page.waitForTimeout(600);
  await chat.getByRole("button", { name: "Minimizar chat", exact: true }).click();
  const panel = page.locator("#support-chat");
  await expect(panel).toHaveAttribute("data-state", "closed");
  await expect(panel).toHaveAttribute("inert", "");
  await expect(panel).toHaveCSS("animation-name", /collapse/);
  await expect(panel).toHaveCount(0);
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Abrir suporte", exact: true }).click();
  await expect(chat.getByRole("log")).toContainText("Dispositivos conectados");
  // Interrupt an exit animation: its old timer must not unmount the reopened chat.
  await chat.getByRole("button", { name: "Minimizar chat", exact: true }).click();
  await page.getByRole("button", { name: "Abrir suporte", exact: true }).click();
  await page.waitForTimeout(350);
  await expect(chat).toBeVisible();
  await page.waitForTimeout(500);
  await capture.send("Page.stopScreencast");
  await capture.detach();
  const directory = "/tmp/atendehub-support-motion-frames";
  await mkdir(directory, { recursive: true });
  for (let i = 0; i < frames.length; i++)
    await writeFile(`${directory}/${i}.jpg`, Buffer.from(frames[i]!.data, "base64"));
  const concat = frames
    .map(
      (frame, i) =>
        `file '${directory}/${i}.jpg'\nduration ${Math.max(0.025, (frames[i + 1]?.timestamp ?? frame.timestamp + 0.3) - frame.timestamp)}`,
    )
    .join("\n");
  await writeFile(`${directory}/frames.txt`, concat);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(chat).toHaveCSS("animation-name", "none");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/workspace/cliente-suporte-animado-mobile.png" });
  await chat.getByRole("textbox").press("Escape");
  await expect(chat).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir suporte", exact: true })).toBeFocused();
});
