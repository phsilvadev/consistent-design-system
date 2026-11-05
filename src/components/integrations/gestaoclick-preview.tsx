"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileText,
  History,
  Loader2,
  LockKeyhole,
  Package,
  RefreshCw,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
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
        <h1 className="text-2xl font-bold">Integrações</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Prévia das próximas etapas do GestãoClick.
        </p>
      </div>
      <article className="max-w-sm space-y-5 rounded-[32px] bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-violet-100 p-3 text-violet-500">
            <Boxes className="h-6 w-6" />
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
            Credenciais cadastradas
          </span>
        </div>
        <h2 className="text-lg font-semibold">GestãoClick ERP</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie o acesso ao ERP e acompanhe as sincronizações.
        </p>
        <Button variant="outline" className="w-full rounded-full" onClick={() => setOpen(true)}>
          Configurar
        </Button>
      </article>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="flex h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[840px] [&>button]:right-6 [&>button]:top-7"
        >
          <SheetHeader className="border-b bg-card p-6 pr-14 text-left sm:px-8">
            <div className="mb-3 flex items-center gap-3">
              <span className="rounded-2xl bg-violet-100 p-3 text-violet-500">
                <Boxes className="h-6 w-6" />
              </span>
              <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[10px] font-semibold text-violet-600">
                PRÉVIA INTERATIVA
              </span>
            </div>
            <SheetTitle className="text-xl">GestãoClick ERP</SheetTitle>
            <SheetDescription>
              Configure o acesso e mantenha os dados comerciais atualizados.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:px-8 sm:py-6">
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
              Dados demonstrativos. Os botões abaixo simulam o fluxo visual, sem consultar o ERP ou
              alterar dados reais.
            </p>
            <ol className="grid grid-cols-3 gap-2 text-[11px] sm:text-xs">
              {[
                ["Credenciais", true],
                ["Validar acesso", tested],
                ["Sincronizar", synced],
              ].map(([title, done], i) => (
                <li key={String(title)} className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${done ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"}`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="font-medium">{title}</span>
                  {i < 2 && (
                    <ChevronRight className="ml-auto hidden h-3 w-3 text-muted-foreground sm:block" />
                  )}
                </li>
              ))}
            </ol>
            <section className="space-y-4 rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                    <LockKeyhole className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">Credenciais cadastradas</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Os dados de acesso ficam protegidos no servidor.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                  Etapa concluída · exemplo
                </span>
              </div>
              <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                {[
                  ["Endereço da API", "https://servidor-exemplo/api"],
                  ["Credenciais", "Access Token e Secret protegidos"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                    <p className="mt-1 break-words text-xs font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="space-y-4 rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-violet-50 p-2.5 text-violet-500">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">Validar acesso ao ERP</h3>
                    <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                      Confirme as credenciais e as permissões antes de importar informações.
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${tested ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                >
                  {tested ? "Acesso validado · simulação" : "Aguardando teste"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="preview-store"
                    className="flex items-center gap-1.5 text-xs font-medium"
                  >
                    <Store className="h-3.5 w-3.5" />
                    Loja utilizada
                  </label>
                  <select
                    id="preview-store"
                    className="h-10 w-full rounded-xl border bg-background px-3 text-xs"
                    disabled={!tested}
                  >
                    <option>
                      {tested ? "Matriz · loja demonstrativa" : "Disponível após validar o acesso"}
                    </option>
                  </select>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-[11px] text-muted-foreground">Permissões da integração</p>
                  <p className="mt-1 text-xs">
                    {tested
                      ? "Consulta de produtos e clientes · exemplo"
                      : "Serão conferidas no teste de conexão"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full sm:w-auto"
                disabled={busy}
                onClick={() => simulate("test")}
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {tested ? "Testar novamente" : "Testar conexão"}
                <span className="ml-1 text-[10px] opacity-60">· simular</span>
              </Button>
            </section>
            <section className="space-y-4 rounded-2xl border bg-card p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-blue-50 p-2.5 text-blue-500">
                  <Database className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">Sincronização de dados</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Escolha o que será consultado no GestãoClick.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { Icon: Package, title: "Produtos", text: "Catálogo, códigos e unidades" },
                  { Icon: Users, title: "Clientes", text: "Cadastros e contatos comerciais" },
                ].map(({ Icon, title, text }) => (
                  <label
                    key={title}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${tested ? "" : "opacity-60"}`}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      disabled={!tested || busy}
                      className="mt-1 accent-violet-600"
                    />
                    <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span>
                      <span className="block text-xs font-semibold">{title}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">{text}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {synced
                    ? "Simulação concluída · nenhum dado importado"
                    : "Nenhuma sincronização realizada"}
                </p>
                <Button
                  type="button"
                  className="rounded-full"
                  disabled={!tested || busy}
                  onClick={() => simulate("sync")}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sincronizar agora<span className="ml-1 text-[10px] opacity-70">· simular</span>
                </Button>
              </div>
            </section>
            <section className="rounded-2xl border border-dashed bg-card p-4">
              <h3 className="flex items-center gap-2 text-xs font-semibold">
                <History className="h-4 w-4 text-muted-foreground" />
                Histórico de sincronização
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">
                {synced
                  ? "Simulação de sincronização concluída. Nenhum registro real foi alterado."
                  : "O histórico aparecerá aqui após as primeiras sincronizações."}
              </p>
            </section>
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <FileText className="mt-0.5 h-4 w-4 shrink-0" />
              Preços e estoque serão consultados por loja. A integração real ainda depende da
              documentação OpenAPI da conta.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 border-t bg-card p-5 sm:px-8">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Somente prévia visual
            </span>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
              Fechar prévia
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
