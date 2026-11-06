import { z } from "zod";
import { apiRequest, ApiError } from "./client";

const configSchema = z.object({
  company_id: z.string().uuid(),
  enabled: z.boolean(),
  app_id: z.string().regex(/^\d+$/).nullable(),
  config_id: z.string().regex(/^\d+$/).nullable(),
  graph_version: z.string().regex(/^v\d+\.0$/),
  reason: z.string().nullable(),
});
export type MetaConfig = z.infer<typeof configSchema>;
export async function metaConfig(company: string) {
  const data = configSchema.parse(
    await apiRequest("/integrations/whatsapp-official/embedded/config"),
  );
  if (data.company_id !== company) throw new ApiError(502, "Configuração da empresa inválida.");
  return data;
}
export async function beginMeta(company: string, version: number) {
  const data = z
    .object({
      company_id: z.string().uuid(),
      state: z.string().regex(/^[A-Za-z0-9_-]{40,100}$/),
      expires_at: z.number().int(),
    })
    .parse(await apiRequest("/integrations/whatsapp-official/embedded/start", { version }));
  if (data.company_id !== company) throw new ApiError(502, "Autorização da empresa inválida.");
  return data;
}
export type SignupResult = { code: string; phone_number_id: string; waba_id: string };
export type MetaSDK = {
  init: (config: {
    appId: string;
    version: string;
    autoLogAppEvents: boolean;
    xfbml: boolean;
    cookie: boolean;
  }) => void;
  login: (
    callback: (response: { authResponse?: { code?: string } }) => void,
    config: {
      config_id: string;
      response_type: "code";
      override_default_response_type: true;
      extras: { setup: Record<string, never> };
    },
  ) => void;
};
type MetaWindow = Window & { FB?: MetaSDK };
let sdkPromise: Promise<MetaSDK> | undefined;
export function loadMetaSDK(config: MetaConfig): Promise<MetaSDK> {
  if (!config.enabled || !config.app_id || !config.config_id)
    return Promise.reject(new Error("Cadastro da Meta indisponível."));
  const initialize = (sdk: MetaSDK) => {
    sdk.init({
      appId: config.app_id!,
      version: config.graph_version,
      autoLogAppEvents: false,
      xfbml: false,
      cookie: false,
    });
    return sdk;
  };
  if ((window as MetaWindow).FB) return Promise.resolve(initialize((window as MetaWindow).FB!));
  if (!sdkPromise)
    sdkPromise = new Promise<MetaSDK>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/pt_BR/sdk.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      const timer = setTimeout(() => {
        script.remove();
        reject(new Error("A Meta demorou para carregar. Tente novamente."));
      }, 15000);
      script.onload = () => {
        clearTimeout(timer);
        const sdk = (window as MetaWindow).FB;
        if (sdk) resolve(sdk);
        else reject(new Error("Não foi possível carregar a Meta."));
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error("Não foi possível carregar a Meta. Confira sua conexão."));
      };
      document.head.append(script);
    }).catch((error: unknown) => {
      sdkPromise = undefined;
      throw error;
    });
  return sdkPromise.then(initialize);
}

const metaOrigins = new Set([
  "https://www.facebook.com",
  "https://web.facebook.com",
  "https://facebook.com",
  "https://m.facebook.com",
]);
// The SDK callback and FINISH postMessage may arrive in either order.
export function launchMetaSignup(
  sdk: MetaSDK,
  configId: string,
  signal: AbortSignal,
): Promise<SignupResult> {
  return new Promise((resolve, reject) => {
    let code: string | undefined;
    let ids: { phone_number_id: string; waba_id: string } | undefined;
    let settled = false;
    const clean = () => {
      clearTimeout(timer);
      window.removeEventListener("message", receive);
      signal.removeEventListener("abort", abort);
    };
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      clean();
      reject(new Error(message));
    };
    const finish = () => {
      if (!settled && code && ids) {
        settled = true;
        clean();
        resolve({ code, ...ids });
      }
    };
    const receive = (event: MessageEvent) => {
      if (!metaOrigins.has(event.origin)) return;
      try {
        const data: unknown = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (
          !data ||
          typeof data !== "object" ||
          !("type" in data) ||
          data.type !== "WA_EMBEDDED_SIGNUP" ||
          !("event" in data)
        )
          return;
        if (data.event === "CANCEL" || data.event === "ERROR") {
          fail("A autorização foi cancelada ou interrompida na Meta. Você pode tentar novamente.");
          return;
        }
        if (data.event !== "FINISH" || !("data" in data)) return;
        const result = z
          .object({
            phone_number_id: z.string().regex(/^\d{1,40}$/),
            waba_id: z.string().regex(/^\d{1,40}$/),
          })
          .safeParse(data.data);
        if (!result.success) {
          fail("A Meta não informou um número WhatsApp completo. Reinicie e selecione um número.");
          return;
        }
        ids = result.data;
        finish();
      } catch {
        /* Ignore unrelated or malformed messages; never log provider payloads. */
      }
    };
    const abort = () => fail("Conexão cancelada. Inicie novamente quando quiser.");
    const timer = setTimeout(
      () => fail("O tempo de autorização terminou. Inicie novamente."),
      180000,
    );
    if (signal.aborted) {
      abort();
      return;
    }
    window.addEventListener("message", receive);
    signal.addEventListener("abort", abort, { once: true });
    try {
      sdk.login(
        (response) => {
          if (settled) return;
          const value = response.authResponse?.code;
          if (typeof value !== "string" || !/^[\x21-\x7e]{20,4096}$/.test(value)) {
            fail("A autorização não foi concluída. Permita a janela da Meta e tente novamente.");
            return;
          }
          code = value;
          finish();
        },
        {
          config_id: configId,
          response_type: "code",
          override_default_response_type: true,
          extras: { setup: {} },
        },
      );
    } catch {
      fail("Não foi possível abrir a Meta. Permita pop-ups e tente novamente.");
    }
  });
}
