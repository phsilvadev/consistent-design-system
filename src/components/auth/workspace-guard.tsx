"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { auth, ApiError } from "@/lib/auth/client";
import { belongsToTenant, type Identity } from "@/lib/auth/contracts";
import { TenantProvider } from "@/lib/tenant/provider";
import { authenticatedContext } from "@/lib/tenant/shared";
import { TrialExpired } from "./trial-expired";
export function WorkspaceGuard({
  initialIdentity,
  tenant,
  children,
}: {
  initialIdentity: Identity;
  tenant: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    async function check() {
      try {
        const value = await auth.me();
        if (!alive) return;
        if (!belongsToTenant(value, tenant)) {
          setIdentity(null);
          router.replace("/acesso-negado");
          return;
        }
        setIdentity(value);
        setError("");
      } catch (e) {
        if (!alive) return;
        setIdentity(null);
        if (e instanceof ApiError && e.status === 401) {
          router.replace("/login");
          router.refresh();
        } else
          setError(
            "Não foi possível verificar sua sessão. Recarregue a página para tentar novamente.",
          );
      }
    }
    void check();
    const focus = () => {
      void check();
    };
    window.addEventListener("focus", focus);
    const timer = setInterval(focus, 60000);
    return () => {
      alive = false;
      window.removeEventListener("focus", focus);
      clearInterval(timer);
    };
  }, [tenant, router]);
  if (error)
    return (
      <main role="alert" className="p-8 text-center">
        {error}
      </main>
    );
  if (!belongsToTenant(initialIdentity, tenant) || !identity || !belongsToTenant(identity, tenant))
    return (
      <main role="status" className="p-8 text-center">
        Verificando acesso…
      </main>
    );
  if (identity.trial_expired) return <TrialExpired />;
  return (
    <TenantProvider
      key={`${identity.company.id}:${identity.user.id}`}
      value={authenticatedContext(identity)}
    >
      {children}
    </TenantProvider>
  );
}
