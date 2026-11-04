"use client";

import { createContext, useContext, type ReactNode } from "react";
import { tenantHref, type TenantContext } from "./shared";

const Context = createContext<TenantContext | null>(null);
export function TenantProvider({ value, children }: { value: TenantContext; children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useTenant() {
  const context = useContext(Context);
  if (!context) throw new Error("Contexto da empresa indisponível.");
  return { ...context, href: (path = "/") => tenantHref(context.tenant.slug, path) };
}
