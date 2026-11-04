export const ACCESS_TENANT = "acesso";

export type Tenant = { id: string; slug: string; name: string };
export type TenantUser = { id: string; name: string; role: "owner" | "admin" | "member" };
export type TenantContext = { tenant: Tenant; user: TenantUser };

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

export function workspaceContext(slug: string): TenantContext {
  return {
    tenant: { id: slug, slug, name: slug.replace(/[-_]/g, " ") },
    user: { id: "usuario-fixo", name: "Marina Silva", role: "owner" },
  };
}
