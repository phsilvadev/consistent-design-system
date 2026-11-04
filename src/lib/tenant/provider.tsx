"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useInterfaceAppearance } from "@/hooks/use-interface-appearance";
import { tenantHref, type TenantContext } from "./shared";

const Context = createContext<TenantContext | null>(null);
const AppearanceContext = createContext<ReturnType<typeof useInterfaceAppearance> | null>(null);
export function TenantProvider({ value, children }: { value: TenantContext; children: ReactNode }) {
  const appearance = useInterfaceAppearance(
    `atendehub:${value.tenant.id}:${value.user.id}:appearance`,
  );
  return (
    <Context.Provider value={value}>
      <AppearanceContext.Provider value={appearance}>{children}</AppearanceContext.Provider>
    </Context.Provider>
  );
}
export function useTenant() {
  const context = useContext(Context);
  if (!context) throw new Error("Contexto da empresa indisponível.");
  return { ...context, href: (path = "/") => tenantHref(context.tenant.slug, path) };
}
export function useTenantAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("Aparência da empresa indisponível.");
  return context;
}
