import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/lib/auth/server";
import { SESSION_COOKIE } from "@/lib/auth/contracts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const allowed: Record<string, string[]> = {
  "auth/challenge": ["GET"],
  products: ["GET"],
  "integrations/gestaoclick/products-sync": ["GET"],
  "integrations/gestaoclick/products-sync/start": ["POST"],
  "integrations/gestaoclick/products-sync/next": ["POST"],
  "integrations/gestaoclick/test": ["POST"],
  "integrations/gestaoclick/store": ["POST"],
  "integrations/gestaoclick": ["GET", "POST"],
  "integrations/gestaoclick/remove": ["POST"],
  "integrations/whatsapp-official": ["GET"],
  "integrations/whatsapp-official/setup": ["POST"],
  "integrations/whatsapp-official/connect": ["POST"],
  "integrations/whatsapp-official/disconnect": ["POST"],
  "integrations/whatsapp-qr": ["GET"],
  "integrations/whatsapp-qr/connect": ["POST"],
  "integrations/whatsapp-qr/disconnect": ["POST"],
  "auth/register": ["POST"],
  "auth/login": ["POST"],
  "auth/logout": ["POST"],
  "auth/me": ["GET"],
  users: ["GET", "POST"],
  "company/settings": ["GET", "PATCH"],
  "company/subscription": ["GET"],
  conversations: ["GET", "POST"],
  "conversations/assignees": ["GET"],
  "conversations/summary": ["GET"],
};
async function forward(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const joined = path.join("/");
  const methods =
    allowed[joined] ||
    (/^users\/[a-f0-9-]{36}$/.test(joined) || /^conversations\/[a-f0-9-]{36}$/.test(joined)
      ? ["GET", "PATCH"]
      : /^conversations\/[a-f0-9-]{36}\/read$/.test(joined)
        ? ["POST"]
        : /^conversations\/[a-f0-9-]{36}\/updates$/.test(joined)
          ? ["GET"]
          : /^conversations\/[a-f0-9-]{36}\/messages$/.test(joined)
            ? ["GET", "POST"]
            : []);
  if (!methods.includes(request.method))
    return NextResponse.json({ detail: "Recurso indisponível." }, { status: 404 });
  if (request.method !== "GET") {
    const expected =
      process.env["APP_ORIGIN"] ||
      (process.env.NODE_ENV === "development" ? request.nextUrl.origin : undefined);
    let origin = request.headers.get("origin");
    if (!origin && request.headers.get("referer")) {
      try {
        origin = new URL(request.headers.get("referer")!).origin;
      } catch {
        origin = null;
      }
    }
    if (!expected || origin !== expected)
      return NextResponse.json({ detail: "Origem não permitida." }, { status: 403 });
  }
  const headers = new Headers();
  for (const name of ["content-type", "origin", "referer"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (cookie && /^[A-Za-z0-9_-]{20,200}$/.test(cookie))
    headers.set("Cookie", `${SESSION_COOKIE}=${cookie}`);
  try {
    let body: string | undefined;
    if (request.method !== "GET") {
      if (Number(request.headers.get("content-length") || 0) > 16384)
        return NextResponse.json({ detail: "Solicitação muito grande." }, { status: 413 });
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader) {
        while (true) {
          const item = await reader.read();
          if (item.done) break;
          size += item.value.byteLength;
          if (size > 16384) {
            await reader.cancel();
            return NextResponse.json({ detail: "Solicitação muito grande." }, { status: 413 });
          }
          chunks.push(item.value);
        }
      }
      body = Buffer.concat(chunks).toString("utf8");
    }
    const upstream = await fetch(
      backendUrl(`/api/v1/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`),
      {
        method: request.method,
        headers,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        ...(body === undefined ? {} : { body }),
      },
    );
    const response = new NextResponse(upstream.status === 204 ? null : await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
    for (const value of upstream.headers.getSetCookie())
      response.headers.append("Set-Cookie", value);
    const retry = upstream.headers.get("retry-after");
    if (retry) response.headers.set("Retry-After", retry);
    return response;
  } catch {
    return NextResponse.json(
      { detail: "Serviço de autenticação indisponível. Tente novamente." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export { forward as GET, forward as POST, forward as PATCH };
