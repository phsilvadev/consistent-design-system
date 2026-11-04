import { NextResponse } from "next/server";
// Static error documents: never interpolate a tenant, query string, user or upstream error.
// Direct responses preserve HTTP 403/503; an App Router rewrite can become HTTP 200.
export function accessResponse(status: 403 | 503) {
  const denied = status === 403;
  const title = denied
    ? "Você não tem acesso a esta empresa"
    : "Não foi possível verificar seu acesso";
  const description = denied
    ? "Entre com uma conta vinculada a esta empresa ou retorne ao seu espaço de trabalho."
    : "O serviço está temporariamente indisponível. O conteúdo da empresa não foi carregado.";
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} — AtendeHUB</title><style>body{margin:0;background:#f8fafc;color:#334155;font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100dvh}main{max-width:480px;margin:24px;text-align:center}small{color:#64748b;font-size:12px}h1{font-size:26px;line-height:1.3}p{font-size:14px;line-height:1.8;color:#64748b}a{display:block;margin:18px auto;color:#334155;font-size:14px}.primary{width:fit-content;padding:14px 22px;border-radius:12px;text-decoration:none;background:#ff9800;color:#1e293b;font-weight:600}a:focus-visible{outline:3px solid #fdba74;outline-offset:4px}</style></head><body><main><small>${denied ? "403 · Acesso restrito" : "503 · Serviço indisponível"}</small><h1>${title}</h1><p>${description}</p><a class="primary" href="/">${denied ? "Ir para minha empresa" : "Tentar novamente"}</a>${denied ? '<a href="/login">Entrar com outra conta</a>' : ""}</main></body></html>`;
  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}
