"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Boxes, LockKeyhole, Loader2, RefreshCw } from "lucide-react";
import { useTenant } from "@/lib/tenant/provider";
import { gestaoClick, type GestaoClickConfiguration } from "@/lib/auth/gestaoclick";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
export function GestaoClickCard() {
  const { tenant, user } = useTenant();
  const admin = user.role === "admin";
  const [data, setData] = useState<GestaoClickConfiguration | null>(null),
    [url, setUrl] = useState(""),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(admin),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [revision, setRevision] = useState(0),
    [confirm, setConfirm] = useState(false);
  const accessRef = useRef<HTMLInputElement>(null),
    secretRef = useRef<HTMLInputElement>(null);
  function clearSecrets() {
    if (accessRef.current) accessRef.current.value = "";
    if (secretRef.current) secretRef.current.value = "";
  }
  function changeOpen(value: boolean) {
    if (!value) clearSecrets();
    setOpen(value);
    setSuccess("");
  }
  useEffect(() => {
    if (!admin) return;
    let alive = true;
    gestaoClick(tenant.id)
      .then((result) => {
        if (alive) {
          setData(result);
          setUrl(result.base_url);
          setError("");
        }
      })
      .catch((e: unknown) => {
        if (alive) {
          setData(null);
          setError(e instanceof Error ? e.message : "Não foi possível consultar a configuração.");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tenant.id, admin, revision]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !data) return;
    const access = accessRef.current?.value.trim() || "",
      secret = secretRef.current?.value.trim() || "";
    clearSecrets();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await gestaoClick(tenant.id, "save", {
        base_url: url.trim(),
        version: data.version,
        ...(access ? { access_token: access } : {}),
        ...(secret ? { secret_access_token: secret } : {}),
      });
      setData(result);
      setUrl(result.base_url);
      setSuccess("Credenciais cadastradas com segurança. O acesso ao ERP ainda não foi validado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (busy || !data) return;
    clearSecrets();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await gestaoClick(tenant.id, "remove", { version: data.version });
      setData(result);
      setUrl(result.base_url);
      setSuccess("Configuração removida e credenciais apagadas.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível remover.");
    } finally {
      setBusy(false);
    }
  }
  const required = !data?.has_credentials || url.trim().replace(/\/$/, "") !== data.base_url;
  return (
    <>
      <article className="flex min-h-64 flex-col rounded-[32px] bg-card p-6 shadow-[0_4px_24px_-4px_rgba(24,32,55,0.07)]">
        <div className="mb-5 flex items-start justify-between gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-500">
            <Boxes className="h-6 w-6" />
          </span>
          {loading ? (
            <Skeleton className="h-6 w-28 rounded-full" />
          ) : (
            <span className="mt-0.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {!admin
                ? "Acesso administrativo"
                : data?.has_credentials
                  ? "Credenciais cadastradas"
                  : data
                    ? "Não configurado"
                    : "Indisponível"}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold tracking-tight">GestãoClick ERP</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Cadastre os dados de acesso ao ERP da sua empresa.
        </p>
        <div className="mt-auto pt-6">
          <Button
            variant="outline"
            className="h-10 w-full rounded-full font-normal"
            disabled={!admin}
            onClick={() => changeOpen(true)}
          >
            {data?.has_credentials ? "Configurar" : "Cadastrar credenciais"}
          </Button>
        </div>
      </article>
      <Sheet open={open && admin} onOpenChange={changeOpen}>
        <SheetContent
          side="left"
          className="flex h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px] [&>button]:right-6 [&>button]:top-7"
        >
          <SheetHeader className="border-b bg-card p-7 pr-14 text-left">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-500">
              <Boxes className="h-6 w-6" />
            </span>
            <SheetTitle>Configurações do GestãoClick</SheetTitle>
            <SheetDescription>
              Guarde as credenciais do ERP de {tenant.name} com segurança.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={save} autoComplete="off" className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto p-6 sm:p-7">
              {loading ? (
                <Skeleton className="h-72 rounded-2xl" />
              ) : (
                <>
                  <div className="rounded-2xl border bg-card p-4">
                    <p className="text-sm font-semibold">
                      {data?.has_credentials ? "Credenciais cadastradas" : "Cadastro da integração"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Esta etapa salva os dados de acesso. Validação da conexão e sincronização de
                      produtos e clientes serão disponibilizadas depois.
                    </p>
                  </div>
                  <section className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
                    <div className="space-y-1.5">
                      <label htmlFor="gc-url" className="text-xs font-medium">
                        Endereço base da API
                      </label>
                      <Input
                        id="gc-url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        type="url"
                        maxLength={300}
                        required
                        placeholder="https://servidor-da-conta/api"
                        disabled={busy || !data}
                        className="rounded-xl"
                      />
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Copie o servidor HTTPS informado em API → Documentação no GestãoClick,
                        terminado em /api ou /v1.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="gc-access" className="text-xs font-medium">
                        Access Token
                      </label>
                      <Input
                        ref={accessRef}
                        id="gc-access"
                        name="gc-access"
                        type="password"
                        autoComplete="new-password"
                        spellCheck={false}
                        maxLength={4096}
                        required={required}
                        placeholder={
                          data?.has_credentials
                            ? "Deixe vazio para manter o valor salvo"
                            : "Cole o Access Token"
                        }
                        disabled={busy || !data}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="gc-secret" className="text-xs font-medium">
                        Secret Access Token
                      </label>
                      <Input
                        ref={secretRef}
                        id="gc-secret"
                        name="gc-secret"
                        type="password"
                        autoComplete="new-password"
                        spellCheck={false}
                        maxLength={4096}
                        required={required}
                        placeholder={
                          data?.has_credentials
                            ? "Deixe vazio para manter o valor salvo"
                            : "Cole o Secret Access Token"
                        }
                        disabled={busy || !data}
                        className="rounded-xl"
                      />
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Os valores salvos não são exibidos novamente. Ao alterar o endereço da API,
                        informe as duas credenciais.
                      </p>
                    </div>
                    <p className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
                      <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
                      Credenciais criptografadas no servidor, separadas por empresa. Apenas
                      administradores podem atualizar ou remover.
                    </p>
                  </section>
                  <section className="space-y-2 rounded-2xl border bg-card p-5">
                    <h3 className="text-sm font-semibold">Onde encontrar os dados</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      No GestãoClick, abra Meus aplicativos → API → Credenciais e crie uma chave
                      para esta integração. O Secret Access Token é mostrado somente na criação.
                    </p>
                  </section>
                  {data && !data.enabled && (
                    <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                      A plataforma precisa ativar o armazenamento seguro antes do salvamento.
                    </p>
                  )}
                </>
              )}
              {error && (
                <div role="alert" className="space-y-3 rounded-xl bg-destructive/5 p-3 text-sm">
                  <p>{error}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      clearSecrets();
                      setRevision((v) => v + 1);
                    }}
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Recarregar
                  </Button>
                </div>
              )}
              {success && (
                <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                  {success}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 border-t bg-card p-5">
              <Button
                type="submit"
                className="flex-1 rounded-full"
                disabled={busy || loading || !data?.enabled}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar credenciais
              </Button>
              {data?.has_credentials && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full text-destructive"
                  disabled={busy}
                  onClick={() => setConfirm(true)}
                >
                  Remover
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={busy}
                onClick={() => changeOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover configuração do GestãoClick?</AlertDialogTitle>
            <AlertDialogDescription>
              As credenciais armazenadas nesta plataforma serão apagadas. Essa ação não revoga a
              chave no GestãoClick.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void remove()}>
              Remover configuração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
