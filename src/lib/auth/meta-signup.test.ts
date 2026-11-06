import { afterEach, expect, it, vi } from "vitest";
import { launchMetaSignup, type MetaSDK } from "./meta-signup";
afterEach(() => {
  vi.useRealTimers();
});
const code = "test-only-meta-code-abcdefghijklmnopqrstuvwxyz";
const finish = {
  type: "WA_EMBEDDED_SIGNUP",
  event: "FINISH",
  data: { phone_number_id: "12345", waba_id: "67890" },
};
function setup() {
  let callback: Parameters<MetaSDK["login"]>[0] = () => {};
  const sdk: MetaSDK = {
    init: vi.fn(),
    login: vi.fn((cb) => {
      callback = cb;
    }),
  };
  const controller = new AbortController();
  const result = launchMetaSignup(sdk, "88888", controller.signal);
  return { result, sdk, controller, authorize: () => callback({ authResponse: { code } }) };
}
function message(data: unknown, origin = "https://www.facebook.com") {
  window.dispatchEvent(new MessageEvent("message", { origin, data: JSON.stringify(data) }));
}
it("combina callback e FINISH fora de ordem e recusa origem falsa", async () => {
  const flow = setup();
  message(
    { ...finish, data: { phone_number_id: "99999", waba_id: "99999" } },
    "https://facebook.com.evil.example",
  );
  message(finish);
  flow.authorize();
  expect(await flow.result).toEqual({ code, phone_number_id: "12345", waba_id: "67890" });
  expect(flow.sdk.login).toHaveBeenCalledWith(
    expect.any(Function),
    expect.objectContaining({ response_type: "code", override_default_response_type: true }),
  );
});
it("aguarda IDs mesmo com código já recebido", async () => {
  const flow = setup();
  flow.authorize();
  message(finish);
  expect((await flow.result).waba_id).toBe("67890");
});
it("cancelamento e mensagens incompletas não concluem conexão", async () => {
  const flow = setup();
  const rejected = expect(flow.result).rejects.toThrow("cancelada");
  message({ type: "WA_EMBEDDED_SIGNUP", event: "CANCEL" });
  await rejected;
  const second = setup();
  const invalid = expect(second.result).rejects.toThrow("número WhatsApp completo");
  message({ ...finish, data: { waba_id: "67890" } });
  await invalid;
});
it("fecha listener ao cancelar ou expirar", async () => {
  const flow = setup();
  const aborted = expect(flow.result).rejects.toThrow("cancelada");
  flow.controller.abort();
  await aborted;
  vi.useFakeTimers();
  const second = setup();
  const expired = expect(second.result).rejects.toThrow("tempo de autorização");
  await vi.advanceTimersByTimeAsync(180000);
  await expired;
});
