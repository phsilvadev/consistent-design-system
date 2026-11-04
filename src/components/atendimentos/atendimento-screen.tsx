"use client";
import { useState, type DragEvent, type FormEvent } from "react";
import {
  Bot,
  CheckCheck,
  ChevronRight,
  Clock3,
  GripVertical,
  Headphones,
  MessageCircle,
  Plus,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTenant } from "@/lib/tenant/provider";
import { initialAtendimentos, stages, type Atendimento, type StageId } from "./atendimento-data";

const currency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const now = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
export function AtendimentoScreen() {
  const { user } = useTenant();
  const [items, setItems] = useState(initialAtendimentos);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [handler, setHandler] = useState("all");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [dragOver, setDragOver] = useState<StageId | null>(null);
  const [creating, setCreating] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const selected = items.find((item) => item.id === selectedId);
  const selectedStage = stages.find((stage) => stage.id === selected?.stage);
  const visible = items.filter(
    (item) =>
      `${item.name} ${item.company} ${item.product}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")) &&
      (handler === "all" ||
        (handler === "mine"
          ? item.handler === "human" && item.owner === user.name
          : item.handler === "ai")),
  );
  const active = items.filter((item) => item.stage !== "finalizado");
  const draft = selected ? (drafts[selected.id] ?? "") : "";
  const canSend = selected?.handler === "human" && selected.stage !== "finalizado";

  function openConversation(item: Atendimento) {
    setSelectedId(item.id);
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, unread: 0 } : entry)),
    );
  }
  function move(id: number, stage: StageId) {
    const target = stages.find((entry) => entry.id === stage);
    const item = items.find((entry) => entry.id === id);
    if (!target || !item || item.stage === stage) return;
    const time = now();
    setItems((current) =>
      current.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              stage,
              ...(stage === "vendedor"
                ? { handler: "human" as const, owner: user.name }
                : stage === "ia"
                  ? { handler: "ai" as const, owner: "Assistente IA" }
                  : {}),
              messages: [
                ...entry.messages,
                {
                  author: "system",
                  text:
                    stage === "vendedor"
                      ? `${user.name} assumiu o atendimento. A IA está pausada nesta conversa.`
                      : stage === "ia"
                        ? `${user.name} devolveu o atendimento à IA.`
                        : `Atendimento movido para ${target.name}.`,
                  time,
                },
              ],
            }
          : entry,
      ),
    );
    setAnnouncement(`${item.name}: atendimento movido para ${target.name}.`);
  }
  function assume() {
    if (!selected || selected.stage === "finalizado") return;
    move(selected.id, "vendedor");
  }
  function resumeAI() {
    if (selected) move(selected.id, "ia");
  }
  function drop(event: DragEvent, stage: StageId) {
    event.preventDefault();
    const id = Number(event.dataTransfer.getData("text/plain"));
    move(id, stage);
    setDragOver(null);
  }
  function send(event: FormEvent) {
    event.preventDefault();
    if (!selected || !canSend || !draft.trim()) return;
    const text = draft.trim();
    const time = now();
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? { ...item, time, messages: [...item.messages, { author: "human", text, time }] }
          : item,
      ),
    );
    setDrafts((current) => ({ ...current, [selected.id]: "" }));
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) return;
    const id = Math.max(0, ...items.map((item) => item.id)) + 1;
    const time = now();
    const item: Atendimento = {
      id,
      name,
      company: String(data.get("company") ?? "").trim() || "Novo cliente",
      phone: String(data.get("phone") ?? "").trim() || "Não informado",
      stage: "ia",
      handler: "ai",
      owner: "Assistente IA",
      product: "A identificar",
      quantity: "A confirmar",
      delivery: "A confirmar",
      value: 0,
      time,
      unread: 0,
      messages: [
        {
          author: "ai",
          text: `Olá, ${name}! Como posso ajudar? Conte qual produto você procura e a quantidade de que precisa.`,
          time,
        },
      ],
    };
    setItems((current) => [...current, item]);
    setCreating(false);
    setSearch("");
    setHandler("all");
    setSelectedId(id);
    setAnnouncement(`Atendimento de ${name} iniciado na etapa de IA.`);
  }

  return (
    <main className="min-w-0 space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Relacionamento e vendas
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Atendimentos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            A IA faz o primeiro contato. Acompanhe cada oportunidade e assuma a conversa quando
            precisar.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Novo atendimento
        </button>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do funil">
        {[
          {
            label: "Em andamento",
            value: active.length,
            icon: MessageCircle,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Conduzidos pela IA",
            value: active.filter((item) => item.handler === "ai").length,
            icon: Bot,
            color: "bg-violet-50 text-violet-600",
          },
          {
            label: "Com a equipe",
            value: active.filter((item) => item.handler === "human").length,
            icon: Headphones,
            color: "bg-orange-50 text-orange-600",
          },
          {
            label: "Finalizados",
            value: items.filter((item) => item.stage === "finalizado").length,
            icon: CheckCheck,
            color: "bg-emerald-50 text-emerald-600",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <article
            key={label}
            className="flex items-center justify-between rounded-2xl border bg-card p-5"
          >
            <div>
              <h2 className="text-xs font-medium text-muted-foreground">{label}</h2>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
            </div>
            <span className={`rounded-xl p-3 ${color}`}>
              <Icon className="h-5 w-5" />
            </span>
          </article>
        ))}
      </section>
      <section className="space-y-4" aria-label="Funil de atendimento">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Funil de atendimento</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Arraste os cards entre as etapas ou abra uma conversa para acompanhar o histórico.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                aria-label="Buscar atendimento"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cliente, empresa ou produto"
                className="h-10 w-full rounded-xl border bg-card pl-9 pr-3 text-xs sm:w-64"
              />
            </div>
            <select
              aria-label="Filtrar responsável"
              value={handler}
              onChange={(event) => setHandler(event.target.value)}
              className="h-10 rounded-xl border bg-card px-3 text-xs"
            >
              <option value="all">Todos os responsáveis</option>
              <option value="ai">Assistente IA</option>
              <option value="mine">Meus atendimentos</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto pb-4">
          <div className="grid min-w-[1380px] grid-cols-5 gap-4">
            {stages.map((stage) => {
              const cards = visible.filter((item) => item.stage === stage.id);
              return (
                <section
                  key={stage.id}
                  aria-label={stage.name}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(stage.id);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                      setDragOver(null);
                  }}
                  onDrop={(event) => drop(event, stage.id)}
                  className={`min-h-[420px] rounded-2xl border bg-muted/35 transition-colors ${dragOver === stage.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"}`}
                >
                  <div className="space-y-2 border-b p-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                      <h3 className="flex-1 text-xs font-bold">{stage.name}</h3>
                      <span className="rounded-md bg-background px-2 py-1 text-xs font-semibold tabular-nums">
                        {cards.length}
                      </span>
                    </div>
                    <p className="min-h-8 text-[11px] leading-4 text-muted-foreground">
                      {stage.description}
                    </p>
                    <p className="text-xs font-semibold tabular-nums">
                      {currency(cards.reduce((sum, item) => sum + item.value, 0))}
                    </p>
                  </div>
                  <div className="space-y-3 p-3">
                    {cards.map((item) => (
                      <article
                        key={item.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", String(item.id));
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => setDragOver(null)}
                        className="rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
                      >
                        <button
                          onClick={() => openConversation(item)}
                          aria-label={`Abrir atendimento de ${item.name}`}
                          className="w-full rounded-xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <div className="mb-3 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ${item.handler === "ai" ? "bg-violet-50 text-violet-700" : "bg-orange-50 text-orange-700"}`}
                            >
                              {item.handler === "ai" ? (
                                <Bot className="h-3 w-3" />
                              ) : (
                                <UserRound className="h-3 w-3" />
                              )}
                              {item.handler === "ai" ? "Assistente IA" : "Equipe comercial"}
                            </span>
                            <GripVertical className="ml-auto h-3.5 w-3.5 text-muted-foreground/60" />
                          </div>
                          <h4 className="text-sm font-semibold">{item.name}</h4>
                          <p className="mt-1 text-[11px] text-muted-foreground">{item.company}</p>
                          <div className="my-3 rounded-lg bg-muted/50 p-2.5">
                            <p className="text-xs font-medium">{item.product}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {item.quantity}
                            </p>
                          </div>
                          <p className="line-clamp-2 min-h-8 text-[11px] leading-4 text-muted-foreground">
                            {
                              item.messages.filter((message) => message.author !== "system").at(-1)
                                ?.text
                            }
                          </p>
                          <div className="mt-3 flex items-center justify-between border-t pt-3">
                            <span className="text-xs font-semibold">
                              {item.value ? currency(item.value) : "Valor a definir"}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock3 className="h-3 w-3" />
                              {item.time}
                              {item.unread > 0 && (
                                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 font-bold text-primary-foreground">
                                  {item.unread}
                                </span>
                              )}
                            </span>
                          </div>
                        </button>
                      </article>
                    ))}
                    {!cards.length && (
                      <p className="rounded-xl border border-dashed p-5 text-center text-xs leading-5 text-muted-foreground">
                        {search || handler !== "all"
                          ? "Nenhum atendimento com esses filtros."
                          : "Nenhum atendimento nesta etapa."}
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          {selected && (
            <>
              <SheetHeader className="border-b p-5 pr-12 text-left">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  WhatsApp
                  <ChevronRight className="h-3 w-3" />
                  {selectedStage?.name}
                </div>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {selected.company} · {selected.phone}
                </SheetDescription>
              </SheetHeader>
              <div className="shrink-0 space-y-4 border-b bg-muted/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${selected.handler === "ai" ? "bg-violet-100 text-violet-700" : "bg-orange-100 text-orange-700"}`}
                  >
                    {selected.handler === "ai" ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <UserRound className="h-4 w-4" />
                    )}
                    {selected.stage === "finalizado"
                      ? "Atendimento finalizado"
                      : selected.handler === "ai"
                        ? "IA conduzindo a conversa"
                        : `${selected.owner} · IA pausada`}
                  </span>
                  {selected.stage !== "finalizado" &&
                    (selected.handler === "ai" ? (
                      <button
                        onClick={assume}
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                      >
                        Assumir atendimento
                      </button>
                    ) : (
                      <button
                        onClick={resumeAI}
                        className="rounded-lg border bg-card px-3 py-2 text-xs font-semibold"
                      >
                        Devolver à IA
                      </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Produto identificado</p>
                    <p className="mt-1 font-medium">{selected.product}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quantidade</p>
                    <p className="mt-1 font-medium">{selected.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Recebimento</p>
                    <p className="mt-1 font-medium">{selected.delivery}</p>
                  </div>
                  <div>
                    <label htmlFor="conversation-stage" className="text-muted-foreground">
                      Etapa do atendimento
                    </label>
                    <select
                      id="conversation-stage"
                      value={selected.stage}
                      onChange={(event) => move(selected.id, event.target.value as StageId)}
                      className="mt-1 block w-full rounded-md border bg-card p-1.5 text-xs"
                    >
                      {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div
                className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-muted/30 p-5"
                role="log"
                aria-label="Histórico da conversa"
              >
                {selected.messages.map((message, index) =>
                  message.author === "system" ? (
                    <p
                      key={index}
                      className="px-4 text-center text-[10px] leading-5 text-muted-foreground"
                    >
                      {message.text}
                    </p>
                  ) : (
                    <div
                      key={index}
                      className={`max-w-[88%] rounded-2xl border px-4 py-3 ${message.author === "client" ? "bg-card" : message.author === "ai" ? "ml-auto border-violet-200 bg-violet-50" : "ml-auto border-primary/20 bg-primary/10"}`}
                    >
                      <p
                        className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold ${message.author === "ai" ? "text-violet-700" : "text-muted-foreground"}`}
                      >
                        {message.author === "ai" && <Bot className="h-3 w-3" />}
                        {message.author === "client"
                          ? selected.name
                          : message.author === "ai"
                            ? "Assistente IA"
                            : selected.owner}
                      </p>
                      <p className="text-sm leading-6">{message.text}</p>
                      <p className="mt-1.5 text-right text-[10px] text-muted-foreground">
                        {message.time}
                      </p>
                    </div>
                  ),
                )}
              </div>
              <div className="shrink-0 border-t bg-card p-4">
                {selected.stage === "finalizado" ? (
                  <p className="text-center text-xs text-muted-foreground">
                    Este atendimento foi finalizado. Altere a etapa para reabrir a conversa.
                  </p>
                ) : (
                  <>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {selected.handler === "ai"
                        ? "Acompanhe a IA ou assuma o atendimento para responder ao cliente."
                        : "Você está conduzindo esta conversa. A IA permanece pausada."}
                    </p>
                    <form onSubmit={send} className="flex gap-2">
                      <input
                        aria-label="Mensagem para o cliente"
                        value={draft}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [selected.id]: event.target.value,
                          }))
                        }
                        disabled={!canSend}
                        placeholder={
                          canSend ? "Digite sua mensagem…" : "Assuma o atendimento para responder"
                        }
                        className="h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm disabled:opacity-60"
                      />
                      <button
                        type="submit"
                        aria-label="Enviar mensagem"
                        disabled={!canSend || !draft.trim()}
                        className="rounded-xl bg-primary px-4 text-primary-foreground disabled:opacity-40"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo atendimento</DialogTitle>
            <DialogDescription>
              A conversa começa com a IA identificando o produto e a necessidade do cliente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <div>
              <label htmlFor="new-name" className="text-sm font-medium">
                Nome do cliente
              </label>
              <input
                id="new-name"
                name="name"
                required
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="new-company" className="text-sm font-medium">
                Empresa
              </label>
              <input
                id="new-company"
                name="company"
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="new-phone" className="text-sm font-medium">
                WhatsApp
              </label>
              <input
                id="new-phone"
                name="phone"
                type="tel"
                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              Iniciar com IA
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
