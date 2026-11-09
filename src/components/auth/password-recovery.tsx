"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail } from "lucide-react";
import { ClientAuthShell } from "./client-auth-shell";
import { AntiBotChallenge, type AntiBotState } from "./anti-bot";
import { apiRequest } from "@/lib/auth/client";
import { z } from "zod";
export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const [token, setToken] = useState("");
  const [tokenLoaded, setTokenLoaded] = useState(!reset);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [challenge, setChallenge] = useState<AntiBotState>({
    ready: false,
    enabled: true,
    token: "",
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (reset) {
      const value = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
      setToken(value);
      setTokenLoaded(true);
      window.history.replaceState(window.history.state, "", window.location.pathname);
      return;
    }
    let alive = true;
    apiRequest("/auth/options")
      .then((data) => {
        if (alive)
          setEnabled(
            z.object({ password_reset_enabled: z.boolean() }).parse(data).password_reset_enabled,
          );
      })
      .catch(() => {
        if (alive)
          setError("Não foi possível verificar o serviço. Recarregue para tentar novamente.");
      });
    return () => {
      alive = false;
    };
  }, [reset]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || (!reset && (!enabled || !challenge.ready))) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (reset && password !== form.get("confirmPassword")) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = z.object({ message: z.string() }).parse(
        await apiRequest(
          reset ? "/auth/password/reset" : "/auth/password/forgot",
          reset
            ? { token, password }
            : {
                email: String(form.get("email") || ""),
                ...(challenge.token ? { challenge_token: challenge.token } : {}),
              },
        ),
      );
      setSuccess(result.message);
      if (reset) setToken("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
      if (!reset && challenge.enabled) {
        setChallenge({ ready: false, enabled: true, token: "" });
        setRevision((v) => v + 1);
      }
    }
  }
  const field =
    "mt-2 h-12 w-full rounded-xl border border-transparent bg-muted/70 px-4 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring";
  return (
    <ClientAuthShell>
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-7 text-center">
          <span className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            {success ? (
              <CheckCircle2 className="size-5" />
            ) : reset ? (
              <KeyRound className="size-5" />
            ) : (
              <Mail className="size-5" />
            )}
          </span>
          <h1 className="text-[28px] font-semibold tracking-tight">
            {success
              ? reset
                ? "Senha atualizada"
                : "Confira seu e-mail"
              : reset
                ? "Crie uma nova senha"
                : "Esqueceu sua senha?"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {success ||
              (reset
                ? "Escolha uma senha segura para voltar à sua conta."
                : "Informe seu e-mail para receber um link de recuperação.")}
          </p>
        </div>
        {!success && (
          <form onSubmit={submit} className="space-y-5">
            <fieldset disabled={busy} className="space-y-4">
              {reset ? (
                <>
                  <div>
                    <label htmlFor="password" className="text-xs font-medium">
                      Nova senha
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="Pelo menos 8 caracteres"
                      className={field}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="text-xs font-medium">
                      Confirmar nova senha
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="Repita sua nova senha"
                      className={field}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="email" className="text-xs font-medium">
                    E-mail
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    placeholder="voce@empresa.com.br"
                    className={field}
                  />
                </div>
              )}
            </fieldset>
            {!reset && (
              <AntiBotChallenge
                configPath="/api/v1/auth/challenge"
                action="client_password_reset"
                resetKey={revision}
                onState={setChallenge}
              />
            )}
            {!reset && enabled === false && (
              <p
                role="status"
                className="rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground"
              >
                O envio de e-mails de recuperação ainda precisa ser configurado pela plataforma.
                Procure o administrador.
              </p>
            )}
            {reset && tokenLoaded && !token && (
              <p role="alert" className="rounded-xl bg-muted p-3 text-xs leading-5">
                Este link está incompleto. Solicite um novo e-mail de recuperação.
              </p>
            )}
            {error && (
              <p role="alert" className="text-xs text-red-700">
                {error}
              </p>
            )}
            <button
              disabled={busy || (reset ? !token : !enabled || !challenge.ready)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Aguarde…" : reset ? "Salvar nova senha" : "Enviar link de recuperação"}
              <ArrowRight className="size-4" />
            </button>
          </form>
        )}
        <div className="mt-7 text-center">
          <Link
            href={reset && !success ? "/esqueci-senha" : "/login"}
            className="inline-flex items-center gap-2 text-xs font-semibold underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            {reset && !success ? "Solicitar novo link" : "Voltar para o login"}
          </Link>
        </div>
      </div>
    </ClientAuthShell>
  );
}
