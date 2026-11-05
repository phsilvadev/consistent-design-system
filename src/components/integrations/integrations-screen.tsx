"use client";
import { useEffect, useState } from "react";
import {
  MessageCircle,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Unplug,
  LockKeyhole,
  Loader2,
  Boxes,
  Braces,
  CircleHelp,
} from "lucide-react";
import { useTenant } from "@/lib/tenant/provider";
import { whatsappQR, type QRConnection } from "@/lib/auth/whatsapp-qr";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  disconnected: "Não conectado",
  connecting: "Conectando",
  qr: "Aguardando leitura",
  connected: "Conectado",
  error: "Conexão interrompida",
};
export function IntegrationsScreen() {
  const { tenant, user } = useTenant();
  const admin = user.role === "admin";
  const [data, setData] = useState<QRConnection | null>(null);
  const [loading, setLoading] = useState(admin);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [officialInfo, setOfficialInfo] = useState(false);
  const [revision, setRevision] = useState(0);
  const [clock, setClock] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    if (!admin) return;
    let alive = true,
      timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const result = await whatsappQR(tenant.id);
        if (alive) {
          setData(result);
          setError("");
        }
      } catch (e) {
        if (alive) {
          setData(null);
          setError(e instanceof Error ? e.message : "Não foi possível consultar a conexão.");
        }
      } finally {
        if (alive) {
          setLoading(false);
          timer = setTimeout(() => {
            if (document.visibilityState === "visible") void poll();
            else timer = setTimeout(poll, 5000);
          }, 5000);
        }
      }
    };
    void poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [tenant.id, admin, revision]);
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => setClock(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, [open]);
  async function act(action: "connect" | "disconnect") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await whatsappQR(tenant.id, action);
      setData(result);
      setOpen(action === "connect");
      setClock(Math.floor(Date.now() / 1000));
      setRevision((v) => v + 1);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Não foi possível concluir a operação.");
    } finally {
      setBusy(false);
    }
  }
  const fresh = !!data?.qr_data_url && !!data.qr_expires_at && data.qr_expires_at > clock;
  return (
    <main className="mx-auto max-w-7xl space-y-9 p-5 md:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gerencie os canais e sistemas conectados à {tenant.name}.
        </p>
      </header>
      {!admin && (
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 text-sm">
          <LockKeyhole className="h-4 w-4" />
          Somente o administrador pode gerenciar as conexões da empresa.
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
        </div>
      )}
      <section className="space-y-5">
        <h2 className="flex items-center gap-2.5 text-lg font-bold">
          <MessageCircle className="h-5 w-5 text-[#ff6848]" />
          Canais de atendimento
        </h2>
        <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
          <article className="flex min-h-72 flex-col rounded-[32px] bg-card p-6 shadow-[0_4px_24px_-4px_rgba(24,32,55,0.07)]">
            <div className="mb-5 flex items-start justify-between gap-2">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <QrCode className="h-6 w-6" />
              </span>
              {loading ? (
                <Skeleton className="h-6 w-28 rounded-full" />
              ) : (
                <span
                  className={`mt-0.5 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${data?.status === "connected" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}
                >
                  {data?.status === "connected" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                  {!admin
                    ? "Acesso administrativo"
                    : data
                      ? labels[data.status]
                      : "Status indisponível"}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold tracking-tight">WhatsApp por QR Code</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Conecte pelo celular e receba mensagens na central. Sem credenciais da Meta.
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Conexão não oficial · dispositivo vinculado
            </p>
            <div className="mt-auto pt-6">
              {loading ? (
                <Skeleton className="h-10 w-full rounded-full" />
              ) : data?.status === "connected" ? (
                <>
                  <p className="mb-3 text-xs text-muted-foreground">
                    {data.phone ? `+${data.phone}` : "Celular conectado"}
                  </p>
                  <Button
                    className="h-10 w-full rounded-full bg-[#ff6848] text-white hover:bg-[#f15d3d]"
                    disabled={busy || !admin}
                    onClick={() => setOpen(true)}
                  >
                    Configurar
                  </Button>
                </>
              ) : (
                <Button
                  className="h-10 w-full rounded-full bg-[#ff6848] text-white shadow-[0_5px_15px_rgba(255,104,72,0.18)] hover:bg-[#f15d3d]"
                  disabled={!admin || !data?.enabled || busy}
                  onClick={() => {
                    setOpen(true);
                    void act("connect");
                  }}
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {data?.status === "qr" ? "Visualizar QR Code" : "Conectar WhatsApp"}
                </Button>
              )}
            </div>
          </article>
          <article className="flex min-h-72 flex-col rounded-[32px] bg-card p-6 shadow-[0_4px_24px_-4px_rgba(24,32,55,0.07)]">
            <div className="mb-5 flex items-start justify-between gap-2">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                <MessageCircle className="h-6 w-6" />
              </span>
              <span className="mt-0.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Configuração assistida
              </span>
            </div>
            <h3 className="text-lg font-bold tracking-tight">WhatsApp Business</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Receba mensagens pela integração oficial com a Cloud API da Meta.
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Conexão oficial · número comercial
            </p>
            <div className="mt-auto pt-6">
              <Button
                variant="outline"
                className="h-10 w-full rounded-full font-normal"
                onClick={() => setOfficialInfo(true)}
              >
                Como conectar
              </Button>
            </div>
          </article>
        </div>
        {admin && data && !data.enabled && (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />
            Conexão por QR Code aguardando ativação pela plataforma.
          </p>
        )}
      </section>
      <section className="space-y-5">
        <h2 className="flex items-center gap-2.5 text-lg font-bold">
          <Boxes className="h-5 w-5 text-[#ff6848]" />
          Gestão e automações
        </h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              icon: Boxes,
              name: "GestãoClick ERP",
              text: "Produtos, clientes, preços e estoque conectados à sua operação.",
              color: "bg-violet-100 text-violet-500",
            },
            {
              icon: Braces,
              name: "API e automações",
              text: "Integre outros sistemas e automatize as rotinas da sua empresa.",
              color: "bg-orange-100 text-orange-500",
            },
          ].map(({ icon: Icon, name, text, color }) => (
            <article
              key={name}
              className="flex min-h-64 flex-col rounded-[32px] bg-card p-6 shadow-[0_4px_24px_-4px_rgba(24,32,55,0.07)]"
            >
              <div className="mb-5 flex items-start justify-between gap-2">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-0.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  Em breve
                </span>
              </div>
              <h3 className="text-lg font-bold tracking-tight">{name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              <div className="mt-auto pt-6">
                <Button variant="outline" disabled className="h-10 w-full rounded-full font-normal">
                  Em breve
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <p className="flex max-w-2xl items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        Cada conexão pertence à sua empresa. Nesta etapa, o WhatsApp recebe mensagens de texto; o
        envio de respostas ainda está em preparação.
      </p>
      <Dialog open={officialInfo} onOpenChange={setOfficialInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WhatsApp Business oficial</DialogTitle>
            <DialogDescription>
              A ativação da conexão oficial é realizada com o suporte da plataforma. O cadastro
              simplificado da Meta ainda está em preparação.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <Sheet open={open && admin} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="flex h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[480px] [&>button]:right-5 [&>button]:top-6"
        >
          <SheetHeader className="border-b bg-card p-6 pr-12 text-left">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <MessageCircle className="h-5 w-5" />
            </span>
            <SheetTitle>Configurações do WhatsApp</SheetTitle>
            <SheetDescription>Gerencie a conexão e o dispositivo da sua empresa.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <section
              className="space-y-4 rounded-2xl border bg-card p-5"
              aria-label="Dados da conexão"
            >
              <h3 className="text-sm font-semibold">Detalhes da conexão</h3>
              <dl className="space-y-4 text-sm">
                {[
                  ["Empresa", tenant.name],
                  ["Tipo de conexão", "QR Code · não oficial"],
                  ["Status", data ? labels[data.status] : "Indisponível"],
                  [
                    "Número conectado",
                    data?.phone ? `+${data.phone}` : "Nenhum dispositivo conectado",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-1">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="break-words font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            {error && (
              <p role="alert" className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            {data?.status !== "connected" && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Conectar dispositivo</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Abra o WhatsApp no celular e acesse Dispositivos conectados → Conectar
                  dispositivo. Aponte a câmera para o código abaixo.
                </p>
              </div>
            )}
            {data?.status === "connected" ? (
              <div className="space-y-3 py-8 text-center">
                <ShieldCheck className="mx-auto h-12 w-12 text-emerald-600" />
                <p className="font-semibold">WhatsApp conectado!</p>
                <p className="text-sm text-muted-foreground">
                  As novas mensagens de texto chegarão à central.
                </p>
              </div>
            ) : (
              <>
                <div className="flex min-h-72 items-center justify-center rounded-2xl border bg-white p-4">
                  {fresh ? (
                    <img
                      src={data!.qr_data_url!}
                      alt="QR Code para conectar o WhatsApp da empresa"
                      width={280}
                      height={280}
                    />
                  ) : (
                    <div
                      role="status"
                      className="space-y-3 text-center text-sm text-muted-foreground"
                    >
                      <RefreshCw
                        className={`mx-auto h-8 w-8 ${data?.status === "connecting" ? "animate-spin" : ""}`}
                      />
                      <p>
                        {error
                          ? "Conexão indisponível."
                          : data?.status === "error"
                            ? "Não foi possível gerar o código."
                            : "Aguardando um novo QR Code…"}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {fresh
                    ? `O código expira em ${Math.max(0, data!.qr_expires_at! - clock)} segundos.`
                    : "O código será atualizado automaticamente enquanto a conexão estiver ativa."}
                </p>
                <Button variant="outline" disabled={busy} onClick={() => void act("connect")}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar conexão
                </Button>
              </>
            )}
            <p className="text-[11px] text-muted-foreground">
              Somente administradores podem visualizar este código. Não compartilhe seu QR Code.
            </p>
          </div>
          <div className="border-t bg-card p-5">
            {data?.status === "connected" ? (
              <Button
                variant="outline"
                className="w-full rounded-full text-destructive"
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                <Unplug className="mr-2 h-4 w-4" />
                Desconectar
              </Button>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                A conexão será atualizada automaticamente.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription>
              Novas mensagens deixarão de chegar por esta conexão. O histórico já registrado será
              preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void act("disconnect")}>
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
