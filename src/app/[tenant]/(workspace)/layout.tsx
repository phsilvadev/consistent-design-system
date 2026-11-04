import type { ReactNode } from "react";
import { TenantProvider } from "@/lib/tenant/provider";
import { workspaceContext } from "@/lib/tenant/shared";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  return (
    <TenantProvider key={tenant} value={workspaceContext(tenant)}>
      {children}
    </TenantProvider>
  );
}
