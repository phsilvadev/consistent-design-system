import { NextRequest, NextResponse } from "next/server";
import { accessResponse } from "@/lib/auth/access-response";
import { readSession } from "@/lib/auth/server";
import { SESSION_COOKIE, belongsToTenant } from "@/lib/auth/contracts";
const publicPages = new Set([
  "/login",
  "/cadastro",
  "/acesso-negado",
  "/servico-indisponivel",
  "/favicon.ico",
  "/robots.txt",
  "/atendehub-logo.png",
  "/atendehub-logo-white.png",
]);
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/")) return NextResponse.next(); // Each API operation authenticates in FastAPI.
  if (publicPages.has(path) || /^\/[^/]+\/(login|cadastro)\/?$/.test(path))
    return NextResponse.next();
  const result = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const destination = (target: string) => new URL(target, process.env["APP_ORIGIN"] || request.url);
  if (result.status === "anonymous") return NextResponse.redirect(destination("/login"));
  if (result.status === "unavailable") return accessResponse(503);
  if (path === "/") return NextResponse.redirect(destination(`/${result.identity.company.id}`));
  let tenant: string;
  try {
    tenant = decodeURIComponent(path.split("/")[1] || "");
  } catch {
    return accessResponse(403);
  }
  if (!belongsToTenant(result.identity, tenant)) return accessResponse(403);
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/((?!_next/).*)"] };
