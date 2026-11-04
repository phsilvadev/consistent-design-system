"use client";
import Link from "next/link";
import { useTenant } from "@/lib/tenant/provider";
import { LogoutButton } from "./logout-button";
export function CompanyScreen() {
  const { tenant, user, href } = useTenant();
  return (
    <main className="mx-auto max-w-xl space-y-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">Minha empresa</h1>
      <p className="text-muted-foreground">Empresa vinculada à sua conta.</p>
      <article className="space-y-3 rounded-xl border bg-card p-6">
        <h2 className="font-semibold">{tenant.name}</h2>
        <p className="break-all text-sm text-muted-foreground">Identificador: {tenant.id}</p>
        <p className="text-sm">Usuário: {user.name}</p>
        <Link
          className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          href={href()}
        >
          Abrir meu Dashboard
        </Link>
      </article>
      <p className="text-sm text-muted-foreground">
        A troca entre múltiplas empresas ainda não está disponível.
      </p>
      <LogoutButton />
    </main>
  );
}
