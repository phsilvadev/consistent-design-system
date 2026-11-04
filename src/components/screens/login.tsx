"use client";

import { ACCESS_TENANT, tenantHref } from "@/lib/tenant/shared";
import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Eye, EyeOff } from "lucide-react";

export function Login({
  mode = "login",
  tenantSlug,
}: {
  mode?: "login" | "register";
  tenantSlug: string;
}) {
  const registering = mode === "register";
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  function enterWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const slug = String(form.get("tenant") ?? "").trim() || tenantSlug;
    router.push(tenantHref(slug));
  }

  return (
    <main className="grid min-h-svh bg-white font-sans text-slate-800 lg:grid-cols-2">
      <section className="relative flex flex-col overflow-hidden bg-sidebar px-7 py-8 text-sidebar-accent-foreground sm:px-12 lg:min-h-svh lg:px-16 lg:py-12">
        <div className="mx-auto w-full max-w-lg">
          <Link
            href="/"
            aria-label="AtendeHUB — início"
            className="relative w-fit rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <BrandLogo white className="h-auto w-48 -translate-x-[9.5%]" />
          </Link>
        </div>
        <div className="relative mx-auto w-full max-w-lg py-12 lg:my-auto lg:py-16">
          <p className="text-xs font-semibold tracking-wide text-sidebar-foreground/60">
            SUA OPERAÇÃO CONECTADA
          </p>
          <h1 className="mt-6 max-w-md text-4xl font-semibold leading-[1.18] tracking-tight sm:text-5xl">
            O dia a dia da sua distribuidora,
            <br />
            <span className="font-bold text-primary">em um só lugar.</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-sidebar-foreground">
            Acompanhe as conversas do WhatsApp, consulte o estoque e prepare orçamentos sem perder o
            histórico de cada cliente.
          </p>
          <div className="mt-10 border-t border-white/10 pt-7">
            <p className="text-xs text-sidebar-foreground/60">Na sua rotina</p>
            <dl className="mt-5 space-y-5">
              {[
                {
                  title: "Atendimentos",
                  description: "Conversas e responsáveis organizados por cliente.",
                },
                {
                  title: "Produtos e estoque",
                  description:
                    "Preços, medidas e disponibilidade integrados ao seu sistema de gestão.",
                },
                {
                  title: "Orçamentos",
                  description: "Do pedido no WhatsApp ao acompanhamento da proposta.",
                },
              ].map(({ title, description }) => (
                <div key={title} className="grid gap-1.5 sm:grid-cols-[130px_1fr] sm:gap-5">
                  <dt className="text-sm font-semibold">{title}</dt>
                  <dd className="text-sm leading-relaxed text-sidebar-foreground/75">
                    {description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <p className="relative text-xs text-sidebar-foreground/70">
          AtendeHUB · WhatsApp e seu sistema de gestão na mesma operação.
        </p>
      </section>

      <section className="flex flex-col px-7 py-12 sm:px-12 lg:px-16">
        <div className="my-auto w-full max-w-sm self-center py-6 lg:py-12">
          <BrandLogo className="mb-7 h-auto w-48 -translate-x-[9.5%]" />
          <h2 className="text-3xl font-semibold tracking-tight">
            {registering ? "Crie sua conta" : "Bem-vindo de volta"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            {registering
              ? "Cadastre sua empresa e comece a organizar seu atendimento e suas vendas."
              : "Acesse a central de atendimento e vendas da sua distribuidora."}
          </p>
          <form onSubmit={enterWorkspace} method="post" noValidate className="mt-9 space-y-5">
            {registering && (
              <>
                <div>
                  <label htmlFor="name" className="text-sm font-semibold">
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
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label htmlFor="companyName" className="text-sm font-semibold">
                    Nome da empresa
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    autoComplete="organization"
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="Nome da sua empresa"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="tenant" className="text-sm font-semibold">
                Identificador da empresa
              </label>
              <input
                id="tenant"
                name="tenant"
                defaultValue={!registering && tenantSlug !== ACCESS_TENANT ? tenantSlug : ""}
                required
                autoComplete="off"
                aria-describedby="tenant-help"
                placeholder="identificador-da-empresa"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-500"
              />
            </div>
            <p id="tenant-help" className="text-xs text-slate-500">
              Informe o nome que deseja usar na URL da empresa.
            </p>
            <div>
              <label htmlFor="email" className="text-sm font-semibold">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="voce@empresa.com.br"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-semibold">
                Senha
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={registering ? "new-password" : "current-password"}
                  maxLength={256}
                  required
                  placeholder="Digite sua senha"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-12 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1 rounded-lg p-3 text-slate-500 hover:bg-slate-100 focus-visible:outline-slate-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {registering && (
              <div>
                <label htmlFor="confirmPassword" className="text-sm font-semibold">
                  Confirmar senha
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  maxLength={256}
                  placeholder="Repita sua senha"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-500"
                />
              </div>
            )}
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {registering ? "Continuar" : "Entrar"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs text-slate-500">
              {registering ? "Já tem uma conta?" : "Ainda não tem uma conta?"}
            </p>
            <Link
              href={tenantHref(tenantSlug, registering ? "/login" : "/cadastro")}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
            >
              {registering ? "Entrar" : "Cadastre-se"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          AtendeHUB · WhatsApp e seu sistema de gestão na mesma operação.
        </p>
      </section>
    </main>
  );
}
