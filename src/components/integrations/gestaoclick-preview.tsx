"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTenant } from "@/lib/tenant/provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
export function GestaoClickPreview() {
  const { tenant } = useTenant();
  const [open, setOpen] = useState(true),
    [tested, setTested] = useState(false),
    [busy, setBusy] = useState(false),
    [synced, setSynced] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function simulate(action: "test" | "sync") {
    if (busy) return;
    setBusy(true);
    timer.current = setTimeout(() => {
      if (action === "test") setTested(true);
      else setSynced(true);
      setBusy(false);
    }, 650);
  }
  return (
    <main className="space-y-6 p-5 md:p-8">
      <Link
        href={`/${tenant.id}/integracoes`}
        className="inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às integrações
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Integrações</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Prévia das próximas etapas do GestãoClick.
        </p>
      </div>
      <article className="max-w-sm space-y-4 rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">GestãoClick ERP</h2>
          <span className="text-[11px] text-neutral-500">Credenciais cadastradas</span>
        </div>
        <p className="text-sm text-neutral-500">Acesso ao ERP e sincronização de dados.</p>
        <Button
          variant="outline"
          className="w-full rounded-lg shadow-none"
          onClick={() => setOpen(true)}
        >
          Configurar
        </Button>
      </article>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="flex h-dvh w-full flex-col gap-0 overflow-hidden bg-white p-0 text-neutral-900 sm:max-w-[740px] [&>button]:right-7 [&>button]:top-7 [&>button]:focus:ring-neutral-300"
        >
          <SheetHeader className="border-b border-neutral-200 bg-white px-6 py-6 pr-14 text-left sm:px-7 sm:pr-16">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
              Integração ERP
            </p>
            <SheetTitle className="text-[24px] font-bold tracking-tight">GestãoClick</SheetTitle>
            <SheetDescription className="mt-1 text-sm text-neutral-500">
              Acesso, loja e sincronização em um só lugar.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f6f6f7] p-5 sm:px-6">
            <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-[15px] font-bold tracking-tight">Credenciais</h3>
                <span className="flex items-center gap-2 text-[11px] text-neutral-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                  Cadastradas
                </span>
              </div>
              <dl className="grid gap-4 border-t border-neutral-100 pt-3 text-xs sm:grid-cols-2">
                <div className="space-y-1.5">
                  <dt className="text-neutral-500">Endereço da API</dt>
                  <dd className="break-all font-mono text-[11px] text-neutral-700">
                    https://servidor-exemplo/api
                  </dd>
                </div>
                <div className="space-y-1.5">
                  <dt className="text-neutral-500">Dados de acesso</dt>
                  <dd className="text-neutral-700">Access Token e Secret protegidos</dd>
                </div>
              </dl>
            </section>
            <section className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight">Validar acesso</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                    Valide o acesso antes de sincronizar os dados.
                  </p>
                </div>
                <span className="text-[11px] text-neutral-500">
                  {tested ? "Acesso validado · simulação" : "Aguardando teste"}
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="preview-store" className="text-xs font-medium">
                    Loja utilizada
                  </label>
                  <select
                    id="preview-store"
                    disabled={!tested}
                    className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-700 disabled:bg-neutral-50 disabled:text-neutral-400"
                  >
                    <option>
                      {tested ? "Matriz · loja demonstrativa" : "Disponível após validar o acesso"}
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium">Permissões</p>
                  <p className="flex min-h-10 items-center text-xs leading-relaxed text-neutral-500">
                    {tested
                      ? "Consulta de produtos e clientes · exemplo"
                      : "Serão conferidas no teste de conexão"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className={`h-10 rounded-xl px-5 text-xs font-semibold shadow-none ${tested ? "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50" : "border-transparent bg-[#fb982b] text-neutral-950 hover:bg-[#ed8c20]"}`}
                disabled={busy}
                onClick={() => simulate("test")}
              >
                {busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                {tested ? "Testar novamente" : "Testar conexão"}
              </Button>
            </section>
            <section className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div>
                <h3 className="text-[15px] font-bold tracking-tight">Dados para sincronizar</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                  Selecione os dados que deseja importar do GestãoClick.
                </p>
              </div>
              <div className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200">
                {[
                  { title: "Produtos", text: "Catálogo, códigos e unidades" },
                  { title: "Clientes", text: "Cadastros e contatos comerciais" },
                ].map(({ title, text }) => (
                  <label
                    key={title}
                    className={`flex items-center gap-3 px-4 py-3.5 ${tested ? "" : "opacity-50"}`}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      disabled={!tested || busy}
                      className="h-3.5 w-3.5 accent-neutral-900"
                    />
                    <span className="flex flex-1 flex-wrap items-center justify-between gap-1.5">
                      <span className="text-xs font-medium">{title}</span>
                      <span className="text-[11px] text-neutral-500">{text}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-neutral-500">
                  {synced
                    ? "Simulação concluída · nenhum dado importado"
                    : "Nenhuma sincronização realizada"}
                </p>
                <Button
                  type="button"
                  className="h-10 rounded-xl bg-[#fb982b] px-5 text-xs font-semibold text-neutral-950 shadow-none hover:bg-[#ed8c20] disabled:bg-neutral-100 disabled:text-neutral-400 disabled:opacity-100"
                  disabled={!tested || busy}
                  onClick={() => simulate("sync")}
                >
                  {busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Sincronizar agora
                </Button>
              </div>
            </section>
            <section className="space-y-2 rounded-2xl border border-neutral-200/80 bg-white p-5">
              <h3 className="text-[15px] font-bold tracking-tight">Atividade recente</h3>
              <p className="text-xs leading-relaxed text-neutral-500">
                {synced
                  ? "Simulação de sincronização concluída. Nenhum registro real foi alterado."
                  : "O histórico aparecerá aqui após as primeiras sincronizações."}
              </p>
            </section>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-neutral-200 bg-white px-6 py-4 sm:px-7">
            <span className="text-[11px] text-neutral-400">Prévia visual · ações simuladas</span>
            <Button
              variant="outline"
              className="h-9 rounded-lg border-neutral-200 bg-white text-xs text-neutral-700 shadow-none hover:bg-neutral-50"
              onClick={() => setOpen(false)}
            >
              Fechar prévia
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
