import type { Identity } from "@/lib/auth/contracts";
export const ACCESS_TENANT = "acesso";

export type Tenant = { id: string; slug: string; name: string };
export type TenantUser = { id: string; name: string; role: Identity["user"]["role"] };
export type TenantContext = { tenant: Tenant; user: TenantUser; trialEndsAt?: number | undefined };

export function validTenantSlug(value: string): boolean {
  return (
    value.trim().length > 0 &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !Array.from(value).some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    ) &&
    value !== "." &&
    value !== ".."
  );
}

export function tenantHref(slug: string, path = "/"): string {
  if (!validTenantSlug(slug)) throw new Error("Identificador de empresa inválido.");
  if (
    !/^\/(?!\/)/.test(path) ||
    /[?#\\]/.test(path) ||
    path.split("/").some((part) => part === "." || part === ".." || part.includes("%"))
  ) {
    throw new Error("Caminho inválido.");
  }
  return `/${encodeURIComponent(slug)}${path === "/" ? "" : path}`;
}

export function authenticatedContext(identity: Identity): TenantContext {
  if (!identity.user.active || identity.user.company_id !== identity.company.id)
    throw new Error("Vínculo de empresa inválido.");
  return {
    trialEndsAt: identity.company.plan === "trial" ? identity.company.trial_ends_at : undefined,
    tenant: { id: identity.company.id, slug: identity.company.id, name: identity.company.name },
    user: { id: identity.user.id, name: identity.user.name, role: identity.user.role },
  };
}
