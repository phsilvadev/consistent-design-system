import { describe, expect, it } from "vitest";
import { tenantHref, validTenantSlug } from "./shared";

describe("tenant navigation", () => {
  it("keeps navigation within the selected company", () => {
    expect(tenantHref("empresa-a")).toBe("/empresa-a");
    expect(tenantHref("empresa-a", "/login")).toBe("/empresa-a/login");
    expect(tenantHref("acesso", "/cadastro")).toBe("/acesso/cadastro");
    expect(tenantHref("empresa-b", "/atendimentos")).toBe("/empresa-b/atendimentos");
  });
  it.each(["", "../b", "a/b", "a\\b", ".", ".."])("rejects invalid slug %s", (slug) => {
    expect(validTenantSlug(slug)).toBe(false);
    expect(() => tenantHref(slug)).toThrow();
  });
  it("accepts arbitrary company names without registration", () => {
    for (const slug of [
      "qualquer-coisa",
      "Empresa_123",
      "demo",
      "acesso",
      "Minha Empresa",
      "Aço Moreira",
    ]) {
      expect(validTenantSlug(slug)).toBe(true);
      expect(tenantHref(slug)).toBe(`/${encodeURIComponent(slug)}`);
    }
  });
  it.each([
    "//example.com",
    "/../other",
    "/%2e%2e/b",
    "/a\\b",
    "https://example.com",
    "/x?tenant=b",
  ])("rejects unsafe destination %s", (path) => {
    expect(() => tenantHref("empresa", path)).toThrow();
  });
});
