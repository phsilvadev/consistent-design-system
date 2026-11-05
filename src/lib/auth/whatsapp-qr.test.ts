import { afterEach, expect, it, vi } from "vitest";
import { whatsappQR } from "./whatsapp-qr";
const company = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const fixture = {
  company_id: company,
  enabled: true,
  status: "qr",
  qr_data_url: "data:image/png;base64,AA==",
  qr_expires_at: 1900000000,
  phone: null,
};
afterEach(() => vi.unstubAllGlobals());
it("envia ação sem IDs de sessão ou tenant informados pelo navegador", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture)));
  vi.stubGlobal("fetch", fetch);
  expect((await whatsappQR(company, "connect")).status).toBe("qr");
  expect(fetch.mock.calls[0]?.[0]).toBe("/api/v1/integrations/whatsapp-qr/connect");
  expect(fetch.mock.calls[0]?.[1]?.body).toBe("{}");
});
it("rejeita QR Code de outra empresa", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ ...fixture, company_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }),
        ),
      ),
  );
  await expect(whatsappQR(company)).rejects.toThrow("validar a conexão");
});
it("rejeita imagens e status não confiáveis", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ ...fixture, qr_data_url: "data:image/svg+xml,<svg onload=alert(1)>" }),
        ),
      ),
  );
  await expect(whatsappQR(company)).rejects.toThrow("validar a conexão");
});
