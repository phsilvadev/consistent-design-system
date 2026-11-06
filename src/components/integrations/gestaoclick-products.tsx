"use client";
import { useEffect, useRef, useState } from "react";
import { Database, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useTenant } from "@/lib/tenant/provider";
import { productSync, type ProductSync } from "@/lib/auth/products";
import { ApiError } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
export function GestaoClickProducts({
  version,
  ready,
  busy,
  onBusy,
}: {
  version: number;
  ready: boolean;
  busy: boolean;
  onBusy: (value: boolean) => void;
}) {
  const { tenant } = useTenant();
  const [state, setState] = useState<ProductSync | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    productSync(tenant.id)
      .then((result) => {
        if (mounted.current) setState(result);
      })
      .catch((e: unknown) => {
        if (mounted.current)
          setError(e instanceof Error ? e.message : "Não foi possível consultar o progresso.");
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, [tenant.id]);
  async function synchronize() {
    if (busy) return;
    onBusy(true);
    setError("");
    try {
      let current = await productSync(tenant.id);
      if (current.status !== "running")
        current = await productSync(tenant.id, "start", { version });
      if (mounted.current) setState(current);
      while (current.status === "running" && mounted.current) {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        if (!mounted.current) break;
        try {
          current = await productSync(tenant.id, "next", { run_id: current.run_id! });
        } catch (e) {
          if (e instanceof ApiError && e.status === 429) continue;
          throw e;
        }
        if (mounted.current) setState(current);
      }
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : "Não foi possível sincronizar.");
        const latest = await productSync(tenant.id).catch(() => null);
        if (latest && mounted.current) setState(latest);
      }
    } finally {
      onBusy(false);
    }
  }
  return (
    <section
      aria-label="Sincronização de produtos"
      className="space-y-5 rounded-2xl border bg-white p-5"
    >
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-5 w-5 shrink-0 text-neutral-600" />
        <div>
          <h3 className="text-[15px] font-bold">Sincronização de dados</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Importe o catálogo do GestãoClick para a sua empresa.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">Produtos</p>
          <p className="mt-1 text-xs text-neutral-500">Códigos, nomes, descrição e categorias</p>
        </div>
        <div className="border-t pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="text-sm font-semibold text-neutral-400">Clientes</p>
          <p className="mt-1 text-xs text-neutral-500">Disponível em uma próxima etapa</p>
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-12 rounded-xl" />
      ) : (
        <>
          <div aria-live="polite" className="space-y-2 text-xs text-neutral-600">
            {state?.status === "running" && (
              <>
                <p>Sincronização em andamento · {state.processed} produtos consultados</p>
                <progress
                  className="h-2 w-full accent-orange-500"
                  aria-label="Progresso da sincronização"
                  value={state.pages_done}
                  max={state.total_pages || 1}
                />
                <p>
                  Páginas: {state.pages_done} de {state.total_pages ?? "—"}. Ao sair, o
                  processamento pausa; você pode continuar depois.
                </p>
              </>
            )}
            {state?.status === "completed" && (
              <p role="status">Sincronização concluída: {state.processed} produtos importados.</p>
            )}
            {state?.status === "failed" && (
              <p>A última tentativa não foi concluída. O catálogo anterior foi preservado.</p>
            )}
            <p>
              {state?.last_success_at
                ? `Última sincronização: ${new Date(state.last_success_at * 1000).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
                : "Nenhuma sincronização concluída"}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href={`/${tenant.id}/produtos`} className="text-xs underline underline-offset-4">
              Ver produtos
            </Link>
            <Button
              type="button"
              className="rounded-xl text-xs"
              disabled={busy || !ready}
              onClick={() => void synchronize()}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} />
              {busy
                ? "Sincronizando…"
                : state?.status === "running"
                  ? "Continuar sincronização"
                  : "Sincronizar produtos"}
            </Button>
          </div>
        </>
      )}
      {!ready && (
        <p className="text-xs text-neutral-500">Selecione e salve a loja antes de sincronizar.</p>
      )}
      <p className="text-[11px] leading-relaxed text-neutral-500">
        Somente leitura no ERP. Preços, estoque, unidades comerciais e detalhes das variações não
        são importados nesta etapa. O catálogo só é atualizado após a leitura completa; produtos
        ausentes não são excluídos.
      </p>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
