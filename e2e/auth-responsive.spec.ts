import { test, expect } from "@playwright/test";
test("auth: moldura branca e conteúdo adaptado à altura", async ({ page }) => {
  await page.addInitScript(() => {
    window.turnstile = {
      render(element: HTMLElement, options: Record<string, unknown>) {
        element.style.height = "65px";
        element.style.border = "1px solid #ddd";
        element.style.borderRadius = "8px";
        element.style.display = "grid";
        element.style.placeItems = "center";
        element.textContent = "Verificação de segurança";
        (options["callback"] as (value: string) => void)("test-only-layout-token");
        return "layout-widget";
      },
      remove() {},
    };
  });
  await page.route("**/api/v1/auth/challenge", (route) =>
    route.fulfill({ json: { enabled: true, testing: false, site_key: "test-only-layout-key" } }),
  );
  for (const path of ["/login", "/cadastro", "/esqueci-senha"]) {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(path);
    await expect(page.getByText("Verificação de segurança", { exact: true })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      height: innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
    }));
    expect(dimensions.scrollWidth).toBe(dimensions.width);
    expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.height + 1);
    const panel = page.locator("main aside");
    const bounds = await panel.boundingBox();
    expect(bounds?.x).toBe(8);
    expect(bounds?.y).toBe(8);
    expect(bounds?.height).toBe(752);
    expect(await panel.evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
    await page.screenshot({
      path: `/workspace/cliente-${path.slice(1)}-notebook-moldura.png`,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 1366, height: 650 });
  await page.goto("/login");
  await expect(page.getByText("Verificação de segurança", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(
    true,
  );
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({
    path: "/workspace/cliente-login-moldura-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cadastro");
  await expect(page.getByText("Verificação de segurança", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Criar conta", exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Criar conta", exact: true })).toBeVisible();
  await page.screenshot({
    path: "/workspace/cliente-cadastro-moldura-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});
