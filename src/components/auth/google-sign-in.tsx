"use client";
import { useEffect, useRef, useState } from "react";
import { apiRequest, ApiError } from "@/lib/auth/client";
import { identitySchema, type Identity } from "@/lib/auth/contracts";
import type { AntiBotState } from "./anti-bot";
import { z } from "zod";
type GoogleSDK = {
  accounts: {
    id: {
      initialize: (options: Record<string, unknown>) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
      cancel: () => void;
    };
  };
};
type GoogleWindow = Window & { google?: GoogleSDK };
let loading: Promise<GoogleSDK> | null = null;
function sdk(): Promise<GoogleSDK> {
  const ready = (window as GoogleWindow).google;
  if (ready) return Promise.resolve(ready);
  if (!loading)
    loading = new Promise<GoogleSDK>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      const timer = setTimeout(() => {
        script.remove();
        reject(new Error("O Google demorou para carregar."));
      }, 12000);
      script.onload = () => {
        clearTimeout(timer);
        const value = (window as GoogleWindow).google;
        if (value) resolve(value);
        else reject(new Error("Não foi possível carregar o Google."));
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error("Não foi possível carregar o Google."));
      };
      document.head.append(script);
    }).catch((error: unknown) => {
      loading = null;
      throw error;
    });
  return loading;
}
const flowSchema = z.object({
  client_id: z.string().min(1),
  state: z.string().min(40),
  nonce: z.string().min(40),
});
export function GoogleSignIn({
  mode,
  challenge,
  company,
  remember,
  busy,
  onBusy,
  onComplete,
  onChallengeUsed,
}: {
  mode: "login" | "register";
  challenge: AntiBotState;
  company: string;
  remember: boolean;
  busy: boolean;
  onBusy: (value: boolean) => void;
  onComplete: (value: Identity) => void;
  onChallengeUsed: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const values = useRef({ challenge, company, remember, onBusy, onComplete, onChallengeUsed });
  values.current = { challenge, company, remember, onBusy, onComplete, onChallengeUsed };
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const active = useRef(false);
  useEffect(() => {
    let alive = true;
    const element = container.current;
    setReady(false);
    async function prepare() {
      try {
        const options = z
          .object({ google_enabled: z.boolean() })
          .parse(await apiRequest("/auth/options"));
        if (!alive) return;
        setEnabled(options.google_enabled);
        if (!options.google_enabled) return;
        const google = await sdk();
        if (!alive) return;
        const flow = flowSchema.parse(await apiRequest("/auth/google/start", { mode }));
        if (!alive || !element) return;
        google.accounts.id.initialize({
          client_id: flow.client_id,
          nonce: flow.nonce,
          auto_select: false,
          callback: async (response: { credential?: string }) => {
            if (!alive || active.current) return;
            if (!values.current.challenge.ready) {
              setError("Confirme novamente a verificação de segurança para continuar com Google.");
              return;
            }
            const current = values.current;
            if (mode === "register" && current.company.trim().length < 2) {
              setError("Informe o nome da empresa no formulário para continuar com Google.");
              return;
            }
            if (!response.credential) {
              setError("A autorização do Google não foi concluída.");
              return;
            }
            active.current = true;
            current.onBusy(true);
            setError("");
            try {
              const identity = identitySchema.parse(
                await apiRequest("/auth/google/complete", {
                  state: flow.state,
                  credential: response.credential,
                  company: current.company,
                  remember: current.remember,
                  ...(current.challenge.token ? { challenge_token: current.challenge.token } : {}),
                }),
              );
              if (alive) current.onComplete(identity);
            } catch (e) {
              if (alive) {
                setError(e instanceof ApiError ? e.message : "Não foi possível entrar com Google.");
                setRevision((v) => v + 1);
              }
            } finally {
              active.current = false;
              current.onBusy(false);
              current.onChallengeUsed();
            }
          },
        });
        google.accounts.id.renderButton(element, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          width: Math.min(384, element.clientWidth || 300),
          text: mode === "register" ? "signup_with" : "signin_with",
          locale: "pt-BR",
        });
        setReady(true);
      } catch {
        if (alive) setError("O acesso pelo Google está indisponível no momento.");
      }
    }
    void prepare();
    return () => {
      alive = false;
      element?.replaceChildren();
    };
  }, [mode, revision]);
  return (
    <div className="space-y-2">
      <div
        ref={container}
        inert={busy || !challenge.ready}
        aria-disabled={busy || !challenge.ready}
        className={`flex justify-center ${busy || !challenge.ready ? "pointer-events-none opacity-60" : ""}`}
      />
      {!ready && (
        <button
          type="button"
          disabled
          className="flex h-11 w-full items-center justify-center gap-3 rounded-full border bg-card text-sm font-medium disabled:opacity-60"
        >
          <span aria-hidden="true" className="font-bold">
            G
          </span>
          {mode === "register" ? "Cadastrar com Google" : "Entrar com Google"}
        </button>
      )}
      {enabled === false && (
        <p className="text-center text-[10px] text-muted-foreground">
          Acesso pelo Google aguardando configuração da plataforma.
        </p>
      )}
      {enabled && mode === "register" && (
        <p className="text-center text-[10px] text-muted-foreground">
          Para usar o Google, informe primeiro o nome da empresa.
        </p>
      )}
      {error && (
        <p role="alert" className="text-center text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
