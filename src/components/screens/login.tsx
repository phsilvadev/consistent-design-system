"use client";
import { tenantHref } from "@/lib/tenant/shared";
import { auth } from "@/lib/auth/client";
import { AntiBotChallenge, type AntiBotState } from "@/components/auth/anti-bot";
import { ClientAuthShell } from "@/components/auth/client-auth-shell";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import type { Identity } from "@/lib/auth/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
const field =
  "mt-2 h-11 w-full rounded-xl border border-transparent bg-muted/70 px-4 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring";
export function Login({ mode = "login" }: { mode?: "login" | "register" }) {
  const registering = mode === "register";
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [company, setCompany] = useState("");
  const [challenge, setChallenge] = useState<AntiBotState>({
    ready: false,
    enabled: true,
    token: "",
  });
  const [challengeReset, setChallengeReset] = useState(0),
    [remember, setRemember] = useState(false);
  function done(identity: Identity) {
    router.replace(tenantHref(identity.company.id));
    router.refresh();
  }
  function resetChallenge() {
    if (challenge.enabled) {
      setChallenge({ ready: false, enabled: true, token: "" });
      setChallengeReset((v) => v + 1);
    }
  }
  async function enterWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !challenge.ready) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || ""),
      password = String(form.get("password") || "");
    if (registering && password !== form.get("confirmPassword")) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      done(
        registering
          ? await auth.register(
              String(form.get("name") || ""),
              company,
              email,
              password,
              challenge.token,
            )
          : await auth.login(email, password, remember, challenge.token),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setBusy(false);
      resetChallenge();
    }
  }
  return (
    <ClientAuthShell registering={registering}>
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
            <LockKeyhole className="size-3" />
            {registering ? "Comece com 7 dias grátis" : "Sua conta AtendeHub"}
          </span>
          <h1 className="text-[28px] font-semibold tracking-tight">
            {registering ? "Crie sua conta" : "Bem-vindo de volta"}
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
            {registering
              ? "Cadastre sua empresa e conheça a plataforma por 7 dias."
              : "Entre para acompanhar sua equipe e os atendimentos da sua empresa."}
          </p>
        </div>
        <form onSubmit={enterWorkspace} method="post" className="mt-7 space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            {registering && (
              <>
                <div>
                  <label htmlFor="name" className="text-xs font-medium">
                    Seu nome
                  </label>
                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="Seu nome completo"
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="companyName" className="text-xs font-medium">
                    Nome da empresa
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    autoComplete="organization"
                    required
                    minLength={2}
                    maxLength={160}
                    placeholder="Nome da sua empresa"
                    className={field}
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="email" className="text-xs font-medium">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                maxLength={254}
                autoComplete="username"
                required
                placeholder="voce@empresa.com.br"
                className={field}
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-xs font-medium">
                  Senha
                </label>
                {!registering && (
                  <Link
                    href="/esqueci-senha"
                    className="text-[11px] font-medium text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={registering ? "new-password" : "current-password"}
                  maxLength={128}
                  minLength={registering ? 8 : 1}
                  required
                  placeholder={
                    registering ? "Crie uma senha com 8 ou mais caracteres" : "Digite sua senha"
                  }
                  className={`${field} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-3 rounded-lg p-2.5 text-muted-foreground hover:bg-muted"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {registering && (
              <div>
                <label htmlFor="confirmPassword" className="text-xs font-medium">
                  Confirmar senha
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  maxLength={128}
                  minLength={8}
                  placeholder="Repita sua senha"
                  className={field}
                />
              </div>
            )}
            {!registering && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-3.5 rounded border-border accent-primary"
                />
                Lembrar meu acesso
              </label>
            )}
          </fieldset>
          <AntiBotChallenge
            configPath="/api/v1/auth/challenge"
            action={registering ? "client_register" : "client_login"}
            resetKey={challengeReset}
            onState={setChallenge}
          />
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              {error}
            </p>
          )}
          <button
            disabled={busy || !challenge.ready}
            type="submit"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Aguarde…" : registering ? "Criar conta" : "Entrar"}
            <ArrowRight className="size-4" />
          </button>
        </form>
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] text-muted-foreground">ou continue com</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleSignIn
          mode={mode}
          challenge={challenge}
          company={company}
          remember={remember}
          busy={busy}
          onBusy={setBusy}
          onComplete={done}
          onChallengeUsed={resetChallenge}
        />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {registering ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
          <Link
            href={registering ? "/login" : "/cadastro"}
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            {registering ? "Entrar" : "Cadastre-se"}
          </Link>
        </p>
      </div>
    </ClientAuthShell>
  );
}
