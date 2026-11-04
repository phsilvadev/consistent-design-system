import type { ReactNode } from "react";
import { redirect, forbidden } from "next/navigation";
import { currentSession } from "@/lib/auth/server";
import { belongsToTenant } from "@/lib/auth/contracts";
import { TrialExpired } from "@/components/auth/trial-expired";
import { WorkspaceGuard } from "@/components/auth/workspace-guard";
export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const result = await currentSession();
  if (result.status === "anonymous") redirect("/login");
  if (result.status === "unavailable") redirect("/servico-indisponivel");
  if (!belongsToTenant(result.identity, tenant)) forbidden();
  if (result.identity.trial_expired) return <TrialExpired />;
  return (
    <WorkspaceGuard initialIdentity={result.identity} tenant={tenant}>
      {children}
    </WorkspaceGuard>
  );
}
