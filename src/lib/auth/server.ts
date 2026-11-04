import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, identitySchema, type Identity } from "./contracts";
export type SessionResult =
  | { status: "authenticated"; identity: Identity }
  | { status: "anonymous" }
  | { status: "unavailable" };
export function backendUrl(path: string): URL {
  return new URL(path, process.env["BACKEND_URL"] || "http://127.0.0.1:8000");
}
export async function readSession(token?: string): Promise<SessionResult> {
  if (!token || !/^[A-Za-z0-9_-]{20,200}$/.test(token)) return { status: "anonymous" };
  try {
    const response = await fetch(backendUrl("/api/v1/auth/me"), {
      headers: { Cookie: `${SESSION_COOKIE}=${token}` },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 401) return { status: "anonymous" };
    if (!response.ok) return { status: "unavailable" };
    const parsed = identitySchema.safeParse(await response.json());
    if (!parsed.success || parsed.data.user.company_id !== parsed.data.company.id)
      return { status: "unavailable" };
    if (!parsed.data.user.active) return { status: "anonymous" };
    return { status: "authenticated", identity: parsed.data };
  } catch {
    return { status: "unavailable" };
  }
}
export async function currentSession(): Promise<SessionResult> {
  return readSession((await cookies()).get(SESSION_COOKIE)?.value);
}
