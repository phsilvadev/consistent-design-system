"use client";
import { MetaConnect } from "./meta-connect";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  MessageCircle,
  KeyRound,
  ListChecks,
  Radio,
  ShieldCheck,
  CircleHelp,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Unplug,
} from "lucide-react";
import { useTenant } from "@/lib/tenant/provider";
import { officialWhatsApp, type OfficialConnection } from "@/lib/auth/whatsapp-official";
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
const labels = {
  disconnected: "Não configurado",
  validated: "Credenciais validadas",
  receiving: "Recebendo mensagens",
};
export function OfficialWhatsApp() {
  const { tenant, user } = useTenant();
  const admin = user.role === "admin";
  const [open, setOpen] = useState(false),
    [help, setHelp] = useState(false),
    [confirm, setConfirm] = useState(false);
  const [data, setData] = useState<OfficialConnection | null>(null),
    [loading, setLoading] = useState(admin),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [revision, setRevision] = useState(0);
  const [phone, setPhone] = useState(""),
    [waba, setWaba] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const tokenRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const [setupAction, setSetupAction] = useState<"subscribe" | "register" | null>(null);
  useEffect(() => {
    if (!admin) return;
    let alive = true;
    officialWhatsApp(tenant.id)
      .then((result) => {
        if (alive) {
          setData(result);
          setPhone(result.phone_number_id);
          setWaba(result.waba_id);
          setError("");
        }
      })
      .catch((e: unknown) => {
        if (alive) {
          setData(null);
          setError(e instanceof Error ? e.message : "Não foi possível consultar a conexão.");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tenant.id, admin, revision]);
  function changeOpen(value: boolean) {
    if (!value && tokenRef.current) tokenRef.current.value = "";
    if (!value && pinRef.current) pinRef.current.value = "";
    setOpen(value);
    setSuccess("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !data) return;
    const token = tokenRef.current?.value.trim() || "";
    if (tokenRef.current) tokenRef.current.value = "";
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await officialWhatsApp(tenant.id, "connect", {
        phone_number_id: phone.trim(),
        waba_id: waba.trim(),
        version: data.version,
        ...(token ? { access_token: token } : {}),
      });
      setData(result);
      setSuccess("Credenciais validadas na Meta e salvas com segurança.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  async function disconnect() {
    if (!data || busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await officialWhatsApp(tenant.id, "disconnect", { version: data.version });
      setData(result);
      setSuccess("Conexão removida. O token armazenado foi apagado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível desconectar.");
    } finally {
      setBusy(false);
    }
  }
  async function performSetup() {
    if (!data || busy || !setupAction) return;
    const action = setupAction;
    const pin = pinRef.current?.value || "";
    if (pinRef.current) pinRef.current.value = "";
    setSetupAction(null);
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await officialWhatsApp(tenant.id, "setup", {
        version: data.version,
        action,
        confirm: true,
        ...(action === "register" ? { pin } : {}),
      });
      setData(result);
      setSuccess(
        action === "subscribe"
          ? "Inscrição do aplicativo verificada na Meta."
          : "Registro solicitado e situação atualizada na Meta.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir a etapa.");
    } finally {
      setBusy(false);
    }
  }
  async function refreshStatus() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setData(await officialWhatsApp(tenant.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível atualizar.");
    } finally {
      setBusy(false);
    }
  }
  const changed = !!data && (phone !== data.phone_number_id || waba !== data.waba_id);
  return (
    <>
      <article className="flex min-h-72 flex-col rounded-[32px] bg-card p-6 shadow-[0_4px_24px_-4px_rgba(24,32,55,0.07)]">
        <div className="mb-5 flex items-start justify-between gap-2">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
            <MessageCircle className="h-6 w-6" />
          </span>
          {loading ? (
            <Skeleton className="h-6 w-28 rounded-xl" />
          ) : (
            <span
              className={`mt-0.5 rounded-xl px-2.5 py-1 text-[11px] font-medium ${data?.status === "receiving" ? "bg-neutral-100 text-neutral-700" : "bg-muted text-muted-foreground"}`}
            >
              {!admin
                ? "Acesso administrativo"
                : data
                  ? labels[data.status]
                  : "Status indisponível"}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold tracking-tight">WhatsApp Business</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Receba mensagens pela integração oficial com a Cloud API da Meta.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">Conexão oficial · número comercial</p>
        <div className="mt-auto pt-6">
          <Button
            variant="outline"
            className="h-10 w-full rounded-xl font-normal"
            disabled={!admin}
            onClick={() => changeOpen(true)}
          >
            {data?.has_token ? "Configurar" : "Conectar"}
          </Button>
        </div>
      </article>
      <Sheet open={open && admin} onOpenChange={changeOpen}>
        <SheetContent
          side="left"
          className={`flex h-dvh w-full flex-col gap-0 overflow-hidden bg-white p-0 transition-[max-width] duration-300 ${data?.has_token ? "sm:max-w-[960px]" : "sm:max-w-[640px]"} [&>button]:right-6 [&>button]:top-7`}
        >
          <SheetHeader className="border-b bg-white px-6 py-6 pr-14 text-left sm:px-7 sm:pr-16">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-400">
              <MessageCircle className="h-4 w-4 text-neutral-600" strokeWidth={1.7} />
              Conexão oficial
            </p>
            <SheetTitle className="text-xl font-bold tracking-tight">
              WhatsApp Business oficial
            </SheetTitle>
            <SheetDescription className="mt-1 text-xs text-neutral-500">
              Autorize sua conta Meta para conectar o WhatsApp da sua empresa.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
            <div className="flex-1 space-y-4 overflow-y-auto bg-[#f6f6f7] p-5 sm:px-6">
              {loading ? (
                <Skeleton className="h-64 rounded-2xl" />
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Empresa</p>
                      <p className="mt-1 text-sm font-semibold">{tenant.name}</p>
                    </div>
                    <span className="rounded-xl bg-muted px-3 py-1 text-xs text-muted-foreground">
                      {data ? labels[data.status] : "Indisponível"}
                    </span>
                  </div>
                  {data?.has_token && (
                    <section
                      aria-label="Ativação do canal"
                      className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
                            <ListChecks
                              className="h-4 w-4 shrink-0 text-neutral-600"
                              strokeWidth={1.7}
                            />
                            Etapas para colocar o canal em operação
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            A autorização é a primeira etapa. Acompanhe as confirmações abaixo.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => void refreshStatus()}
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Atualizar situação
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          [
                            "Aplicativo autorizado",
                            data.diagnostics.app_confirmed
                              ? "Confirmado na Meta"
                              : "Depende da configuração do aplicativo pela plataforma",
                            !!data.diagnostics.app_confirmed,
                          ],
                          [
                            "Número na Cloud API",
                            data.diagnostics.phone_status === "CONNECTED"
                              ? "Registrado na Meta"
                              : `Situação na Meta: ${data.diagnostics.phone_status || "não confirmada"}`,
                            data.diagnostics.phone_status === "CONNECTED",
                          ],
                          [
                            "Inscrição da conta WABA",
                            data.diagnostics.app_subscribed
                              ? "Aplicativo inscrito na conta"
                              : "Inscrição não confirmada",
                            !!data.diagnostics.app_subscribed,
                          ],
                          [
                            "Recebimento de mensagens",
                            data.last_received_at
                              ? "Última mensagem: " +
                                new Date(data.last_received_at * 1000).toLocaleString("pt-BR")
                              : "Aguardando mensagem real pelo webhook",
                            !!data.last_received_at,
                          ],
                        ].map(([title, text, ok]) => (
                          <div key={String(title)} className="rounded-xl border p-4">
                            <p className="flex items-center gap-2 text-xs font-medium">
                              <span
                                className={`h-2 w-2 shrink-0 rounded-xl ${ok ? "bg-neutral-500" : "bg-neutral-300"}`}
                              />
                              {title}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                              {text}
                            </p>
                          </div>
                        ))}
                      </div>
                      {data.diagnostics.expires_at && (
                        <p className="text-xs text-muted-foreground">
                          Validade informada pela Meta:{" "}
                          {new Date(data.diagnostics.expires_at * 1000).toLocaleString("pt-BR")}.
                        </p>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-3 rounded-xl bg-muted/40 p-4">
                          <h4 className="text-xs font-semibold">Registrar o número</h4>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            Se ainda não estiver registrado, use o PIN de verificação em duas
                            etapas. Ele será usado somente nesta operação e não será salvo.
                          </p>
                          <label
                            className="block text-xs font-medium"
                            htmlFor="official-register-pin"
                          >
                            PIN de seis dígitos
                          </label>
                          <Input
                            id="official-register-pin"
                            ref={pinRef}
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            autoComplete="new-password"
                            placeholder="PIN do número"
                            disabled={busy || data.diagnostics.phone_status === "CONNECTED"}
                            className="rounded-xl"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full rounded-xl"
                            disabled={
                              busy ||
                              !data.diagnostics.app_confirmed ||
                              data.diagnostics.phone_status === "CONNECTED" ||
                              !data.diagnostics.scopes?.includes("whatsapp_business_messaging")
                            }
                            onClick={() => {
                              if (!/^\d{6}$/.test(pinRef.current?.value || "")) {
                                setError("Informe o PIN de seis dígitos.");
                                return;
                              }
                              setSetupAction("register");
                            }}
                          >
                            Registrar na Cloud API
                          </Button>
                        </div>
                        <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4">
                          <h4 className="text-xs font-semibold">Inscrever o aplicativo</h4>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            Autorize o aplicativo da plataforma a receber os eventos desta conta
                            WABA. O webhook público e o campo messages precisam estar configurados
                            na Meta.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-auto w-full rounded-xl"
                            disabled={
                              busy ||
                              !data.diagnostics.app_confirmed ||
                              !data.webhook_configured ||
                              !data.webhook_url ||
                              !!data.diagnostics.app_subscribed
                            }
                            onClick={() => setSetupAction("subscribe")}
                          >
                            Ativar recebimento de eventos
                          </Button>
                        </div>
                      </div>
                      {!data.platform_app_configured && (
                        <p className="text-xs leading-relaxed text-neutral-500">
                          O suporte precisa configurar App ID e App Secret da plataforma para
                          confirmar o aplicativo e liberar as ações de ativação.
                        </p>
                      )}
                      {!data.diagnostics.scopes?.includes("whatsapp_business_messaging") && (
                        <p className="text-xs text-muted-foreground">
                          A permissão whatsapp_business_messaging precisa ser confirmada para
                          registrar o número.
                        </p>
                      )}
                    </section>
                  )}
                  {data && (
                    <MetaConnect
                      companyId={tenant.id}
                      version={data.version}
                      disabled={busy}
                      onBusyChange={setBusy}
                      onConnected={(result) => {
                        setData(result);
                        setPhone(result.phone_number_id);
                        setWaba(result.waba_id);
                        setError("");
                        setSuccess(
                          "Conta autorizada na Meta e credencial protegida no servidor. Confira as etapas de ativação.",
                        );
                      }}
                    />
                  )}
                  <details
                    onToggle={(event) => setManualOpen(event.currentTarget.open)}
                    className="rounded-2xl border border-neutral-200 bg-white p-5"
                  >
                    <summary className="cursor-pointer text-sm font-semibold">
                      Configuração manual (alternativa)
                    </summary>
                    <section className="mt-5 space-y-5" aria-label="Credenciais da Meta">
                      <div>
                        <h3 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
                          <KeyRound className="h-4 w-4 text-neutral-600" strokeWidth={1.7} />
                          Dados da conexão
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          Encontre os identificadores e o token na configuração da API do seu
                          aplicativo na Meta.
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="official-phone-id" className="text-xs font-medium">
                            Phone Number ID
                          </label>
                          <Input
                            id="official-phone-id"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ex.: 123456789012345"
                            inputMode="numeric"
                            pattern="[0-9]{1,40}"
                            maxLength={40}
                            required
                            disabled={busy || !data}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="official-waba-id" className="text-xs font-medium">
                            WhatsApp Business Account ID (WABA)
                          </label>
                          <Input
                            id="official-waba-id"
                            value={waba}
                            onChange={(e) => setWaba(e.target.value)}
                            placeholder="Ex.: 987654321098765"
                            inputMode="numeric"
                            pattern="[0-9]{1,40}"
                            maxLength={40}
                            required
                            disabled={busy || !data}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="official-access-token" className="text-xs font-medium">
                          Token de acesso
                        </label>
                        <Input
                          ref={tokenRef}
                          id="official-access-token"
                          type="password"
                          autoComplete="new-password"
                          name="meta-credential"
                          placeholder={
                            data?.has_token
                              ? "Deixe vazio para manter o token salvo"
                              : "Cole o token de acesso da Meta"
                          }
                          minLength={20}
                          maxLength={4096}
                          required={!data?.has_token || changed}
                          disabled={busy || !data}
                          spellCheck={false}
                          className="rounded-xl"
                          aria-describedby="official-token-help"
                        />
                        <p
                          id="official-token-help"
                          className="text-[11px] leading-relaxed text-muted-foreground"
                        >
                          {data?.has_token
                            ? "Um token protegido já está cadastrado e nunca é exibido novamente."
                            : "Seu token será criptografado no servidor."}{" "}
                          Ao alterar os identificadores, informe um novo token.
                        </p>
                      </div>
                      <div className="flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600">
                        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />O token fica protegido
                        por criptografia e não será exibido novamente. Apenas administradores desta
                        empresa podem atualizar a conexão.
                      </div>
                    </section>
                  </details>
                  {data?.display_phone_number && (
                    <div className="grid gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 text-xs sm:grid-cols-2">
                      <div>
                        <p className="text-muted-foreground">Número validado</p>
                        <p className="mt-1 font-medium">{data.display_phone_number}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Nome na Meta</p>
                        <p className="mt-1 font-medium">{data.verified_name || "Não informado"}</p>
                      </div>
                    </div>
                  )}
                  <section className="space-y-3 rounded-2xl border border-neutral-200/80 bg-white p-5">
                    <h3 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
                      <Radio className="h-4 w-4 text-neutral-600" strokeWidth={1.7} />
                      Recebimento de mensagens
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Depois de validar as credenciais, o aplicativo da Meta precisa estar inscrito
                      no webhook da plataforma. Validar o token não ativa essa inscrição
                      automaticamente.
                    </p>
                    <label htmlFor="official-webhook" className="block text-xs font-medium">
                      URL de callback
                    </label>
                    <Input
                      id="official-webhook"
                      readOnly
                      value={data?.webhook_url || ""}
                      placeholder="A plataforma ainda não informou a URL pública"
                      className="rounded-xl text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {data?.webhook_configured
                        ? "Validação de assinatura configurada no servidor."
                        : "A configuração do webhook no servidor ainda precisa ser concluída pelo suporte."}
                    </p>
                  </section>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl"
                    aria-expanded={help}
                    aria-controls="official-connect-help"
                    onClick={() => setHelp((v) => !v)}
                  >
                    <CircleHelp className="mr-2 h-4 w-4" />
                    Como conectar
                  </Button>
                  {help && (
                    <ol
                      id="official-connect-help"
                      className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-5"
                    >
                      {[
                        [
                          "Autorize pela Meta",
                          "Clique em Conectar com a Meta, entre na sua conta e escolha a empresa e o número WhatsApp. Permita a abertura da janela de autorização.",
                        ],
                        [
                          "Confirme as permissões",
                          "Conclua a autorização. O servidor valida o número e guarda o token criptografado sem exibi-lo no navegador.",
                        ],
                        [
                          "Revise as etapas de ativação",
                          "Confira o registro do número e a inscrição do aplicativo nos eventos. Envie uma mensagem de teste após concluir as etapas.",
                        ],
                        [
                          "Alternativa manual",
                          "Se o Cadastro Incorporado ainda não estiver disponível, expanda Configuração manual e informe os identificadores e o token autorizado.",
                        ],
                      ].map(([title, text], i) => (
                        <li key={title} className="flex gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-600">
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {text}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                  {data && !data.enabled && (
                    <p
                      role="status"
                      className="rounded-xl bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600"
                    >
                      O armazenamento seguro de tokens ainda precisa ser ativado pela plataforma. O
                      salvamento ficará bloqueado até essa configuração.
                    </p>
                  )}
                </>
              )}
              {error && (
                <div
                  role="alert"
                  className="space-y-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm"
                >
                  <p>{error}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      if (tokenRef.current) tokenRef.current.value = "";
                      setRevision((v) => v + 1);
                    }}
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Recarregar configuração
                  </Button>
                </div>
              )}
              {success && (
                <p role="status" className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
                  {success}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 border-t bg-white p-4 sm:px-6">
              {manualOpen && (
                <Button
                  type="submit"
                  className="min-w-40 flex-1 rounded-xl bg-[#fb982b] font-semibold text-neutral-950 shadow-none hover:bg-[#ed8c20]"
                  disabled={busy || loading || !data?.enabled}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Validar e salvar
                </Button>
              )}
              {data?.has_token && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl text-destructive"
                  disabled={busy}
                  onClick={() => setConfirm(true)}
                >
                  <Unplug className="mr-2 h-4 w-4" />
                  Remover conexão
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
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
            <AlertDialogTitle>Remover conexão oficial?</AlertDialogTitle>
            <AlertDialogDescription>
              O token salvo será apagado e novas mensagens por este número deixarão de ser
              importadas. O histórico será preservado. Isso não revoga o token na Meta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void disconnect()}>Remover conexão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!setupAction}
        onOpenChange={(value) => {
          if (!value) setSetupAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {setupAction === "register"
                ? "Registrar número na Cloud API?"
                : "Ativar eventos da conta WABA?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {setupAction === "register"
                ? "Esta ação registra o número na Cloud API usando o PIN informado. Confirme que o número está autorizado para esta integração. O PIN não será armazenado."
                : "Esta ação inscreve o aplicativo da plataforma nos eventos desta conta WhatsApp Business na Meta. A configuração do webhook do aplicativo deve estar concluída."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void performSetup()}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
