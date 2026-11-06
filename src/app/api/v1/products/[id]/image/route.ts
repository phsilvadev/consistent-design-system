import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/lib/auth/server";
import { SESSION_COOKIE } from "@/lib/auth/contracts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 5 * 1024 * 1024;
async function forward(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fail = (status: number, detail: string) =>
    NextResponse.json({ detail }, { status, headers: { "Cache-Control": "no-store" } });
  if (!/^[a-f0-9-]{36}$/.test(id)) return fail(404, "Produto não encontrado.");
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session || !/^[A-Za-z0-9_-]{20,200}$/.test(session))
    return fail(401, "Sessão inválida ou expirada.");
  const headers = new Headers({ Cookie: `${SESSION_COOKIE}=${session}` });
  let body: Buffer | undefined;
  let version = "";
  if (request.method === "POST") {
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
    if (!expected || origin !== expected) return fail(403, "Origem não permitida.");
    version = request.nextUrl.searchParams.get("version") || "";
    if (!/^\d{1,10}$/.test(version)) return fail(422, "Versão da imagem inválida.");
    const type = request.headers.get("content-type")?.split(";")[0] || "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(type))
      return fail(415, "Envie uma imagem JPG, PNG ou WebP.");
    const length = request.headers.get("content-length");
    if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES))
      return fail(413, "Envie uma imagem de até 5 MB.");
    const reader = request.body?.getReader();
    if (!reader) return fail(422, "Selecione uma imagem.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      size += item.value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        return fail(413, "Envie uma imagem de até 5 MB.");
      }
      chunks.push(item.value);
    }
    if (!size) return fail(422, "Selecione uma imagem.");
    body = Buffer.concat(chunks);
    headers.set("Content-Type", type);
    headers.set("Origin", origin);
  }
  try {
    const upstream = await fetch(
      backendUrl(`/api/v1/products/${id}/image${version ? `?version=${version}` : ""}`),
      {
        method: request.method,
        headers,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(45000),
        ...(body ? { body: new Uint8Array(body) } : {}),
      },
    );
    // Only our bounded, authenticated image endpoint is forwarded. No arbitrary URLs.
    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) return fail(502, "Imagem excede o limite permitido.");
    return new NextResponse(bytes, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        ...(upstream.ok && request.method === "GET"
          ? { "Content-Disposition": 'inline; filename="produto.webp"' }
          : {}),
      },
    });
  } catch {
    return fail(503, "Não foi possível acessar o serviço de imagens. Tente novamente.");
  }
}
export { forward as GET, forward as POST };
