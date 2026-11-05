"use client";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type DragEvent,
  type CSSProperties,
} from "react";
import { useVisiblePolling } from "@/hooks/use-visible-polling";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  RefreshCw,
  UserRound,
  Clock3,
  Send,
  Phone,
  ArrowRight,
  Loader2,
  GripVertical,
  Headphones,
} from "lucide-react";
import { useTenant } from "@/lib/tenant/provider";
import { ApiError } from "@/lib/auth/client";
import {
  conversationsApi,
  conversationStatuses,
  statusLabels,
  conversationTime,
  handlingTime,
  type ConversationSummary,
  type Conversation,
  type ConversationMessage,
  type ConversationStatus,
  type Assignee,
} from "@/lib/auth/conversations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DisplayModePicker, type DisplayMode } from "@/components/ui/display-mode-picker";
const conversationLayouts: Record<DisplayMode, CSSProperties> = {
  modal: {
    width: "min(48rem, calc(100vw - 2rem))",
    maxWidth: "none",
    height: "min(56rem, calc(100svh - 2rem))",
  },
  fullscreen: {
    inset: 0,
    transform: "none",
    translate: "none",
    width: "100%",
    maxWidth: "none",
    height: "100svh",
    borderRadius: 0,
  },
  aside: {
    left: "auto",
    right: 0,
    top: 0,
    transform: "none",
    translate: "none",
    width: "min(48rem, 100vw)",
    maxWidth: "none",
    height: "100svh",
    borderRadius: 0,
  },
};
const colors: Record<ConversationStatus, string> = {
  new: "bg-slate-400",
  ai: "bg-violet-500",
  human: "bg-orange-500",
  awaiting_customer: "bg-amber-400",
  quoting: "bg-blue-500",
  converted: "bg-emerald-500",
  closed: "bg-slate-600",
};
const descriptions: Partial<Record<ConversationStatus, string>> = {
  new: "Aguardando um responsável",
  human: "Conversas acompanhadas pela equipe",
  awaiting_customer: "Aguardando o retorno do cliente",
  quoting: "Solicitações em elaboração de proposta",
  converted: "Conversão informada pela equipe",
  closed: "Histórico de atendimentos concluídos",
};
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}
export function AtendimentoScreen() {
  const { tenant, user } = useTenant();
  const router = useRouter();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("modal");
  const displayPreference = `atendehub:${tenant.id}:${user.id}:conversation-mode`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(displayPreference);
      setDisplayMode(saved === "fullscreen" || saved === "aside" ? saved : "modal");
    } catch {
      setDisplayMode("modal");
    }
  }, [displayPreference]);
  const manager = user.role === "admin" || user.role === "supervisor";
  const [items, setItems] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [mine, setMine] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [syncError, setSyncError] = useState("");
  const [lastSync, setLastSync] = useState<number | null>(null);
  const historyContainer = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const previousNewest = useRef(0);
  const [newRecords, setNewRecords] = useState(false);
  const readCursor = useRef<Record<string, number>>({});
  const reading = useRef(false);
  const mutationEpoch = useRef(0);
  const mutating = useRef(false);
  const [revision, setRevision] = useState(0);
  const [pageBusy, setPageBusy] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [rosterError, setRosterError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const createRequest = useRef<{ signature: string; id: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeSelection = useRef<string | null>(null);
  const listGeneration = useRef(0);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailRevision, setDetailRevision] = useState(0);
  const [detailBusy, setDetailBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<"manual_outbound" | "internal_note">("manual_outbound");
  const [historyBusy, setHistoryBusy] = useState(false);
  const messageRequest = useRef<{ signature: string; id: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("atendimento");
    if (id && /^[a-f0-9-]{36}$/.test(id)) {
      activeSelection.current = id;
      setSelectedId(id);
    }
  }, [tenant.id]);
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(query), 250);
    return () => clearTimeout(timeout);
  }, [query]);
  useEffect(() => {
    let alive = true;
    listGeneration.current += 1;
    setLoading(true);
    setError("");
    conversationsApi
      .list(tenant.id, { q: search, mine, unreadOnly })
      .then((result) => {
        if (alive) {
          setItems(result.items);
          setTotal(result.total);
        }
      })
      .catch((e) => {
        if (alive) {
          setItems([]);
          setTotal(0);
          setError(errorText(e));
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tenant.id, search, mine, unreadOnly, revision]);
  useEffect(() => {
    let alive = true;
    setRosterError("");
    conversationsApi
      .assignees()
      .then((result) => {
        if (alive) setAssignees(result);
      })
      .catch((e) => {
        if (alive) setRosterError(errorText(e));
      });
    return () => {
      alive = false;
    };
  }, [tenant.id, revision]);
  useEffect(() => {
    let alive = true;
    if (!selectedId) {
      setSelected(null);
      setMessages([]);
      setDetailError("");
      return;
    }
    setDetailLoading(true);
    Promise.all([
      conversationsApi.get(tenant.id, selectedId),
      conversationsApi.messages(tenant.id, selectedId),
    ])
      .then(([conversation, history]) => {
        if (alive) {
          setSelected(conversation);
          setMessages(history.items);
          setNextBefore(history.next_before);
        }
      })
      .catch((e) => {
        if (alive) {
          setSelected(null);
          setMessages([]);
          setDetailError(errorText(e));
        }
      })
      .finally(() => {
        if (alive) setDetailLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tenant.id, selectedId, detailRevision]);
  function open(id: string | null) {
    mutationEpoch.current += 1;
    activeSelection.current = id;
    followLatest.current = true;
    previousNewest.current = 0;
    setNewRecords(false);
    setDetailError("");
    setSelectedId(id);
    setDraft("");
    messageRequest.current = null;
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("atendimento", id);
    else url.searchParams.delete("atendimento");
    window.history.replaceState(null, "", url.pathname + url.search);
  }
  function failed(e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      router.replace("/login");
      router.refresh();
    }
    if (e instanceof ApiError && e.status === 409) {
      setDetailRevision((v) => v + 1);
    }
    return errorText(e);
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createBusy || mutating.current) return;
    const form = new FormData(event.currentTarget);
    const body = {
      customer_name: String(form.get("name") ?? "").trim(),
      customer_phone: String(form.get("phone") ?? "").trim(),
      customer_business: String(form.get("business") ?? "").trim(),
      subject: String(form.get("subject") ?? "").trim(),
      assigned_user_id: String(form.get("owner") ?? "") || null,
      initial_message: String(form.get("initial") ?? "").trim(),
    };
    const signature = JSON.stringify(body);
    if (createRequest.current?.signature !== signature)
      createRequest.current = { signature, id: crypto.randomUUID() };
    mutationEpoch.current += 1;
    mutating.current = true;
    setCreateBusy(true);
    setCreateError("");
    try {
      const result = await conversationsApi.create(tenant.id, {
        ...body,
        request_id: createRequest.current.id,
      });
      setCreating(false);
      createRequest.current = null;
      setQuery("");
      setMine(false);
      setRevision((v) => v + 1);
      open(result.id);
      setAnnouncement("Atendimento criado com sucesso.");
    } catch (e) {
      setCreateError(failed(e));
    } finally {
      mutating.current = false;
      setCreateBusy(false);
    }
  }
  async function change(
    conversation: Conversation,
    changes: { status?: ConversationStatus; assigned_user_id?: string | null },
  ) {
    if (detailBusy || mutating.current) return;
    mutationEpoch.current += 1;
    mutating.current = true;
    setDetailBusy(true);
    setDetailError("");
    setError("");
    try {
      const saved = await conversationsApi.update(tenant.id, conversation.id, {
        version: conversation.version,
        ...changes,
      });
      setItems((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      if (selectedId === saved.id) {
        setSelected(saved);
        setDetailRevision((v) => v + 1);
      }
      setRevision((v) => v + 1);
      setAnnouncement("Atendimento atualizado.");
    } catch (e) {
      const text = failed(e);
      if (selectedId === conversation.id) setDetailError(text);
      else setError(text);
    } finally {
      mutating.current = false;
      setDetailBusy(false);
    }
  }
  async function record(event: FormEvent) {
    event.preventDefault();
    if (!selected || detailBusy || mutating.current || !draft.trim()) return;
    const body = draft.trim();
    const signature = JSON.stringify({ id: selected.id, body, kind });
    if (messageRequest.current?.signature !== signature)
      messageRequest.current = { signature, id: crypto.randomUUID() };
    mutationEpoch.current += 1;
    mutating.current = true;
    setDetailBusy(true);
    setDetailError("");
    try {
      const result = await conversationsApi.record(tenant.id, selected.id, {
        request_id: messageRequest.current.id,
        version: selected.version,
        kind,
        body,
      });
      setSelected(result.conversation);
      setMessages((current) =>
        current.some((m) => m.id === result.message.id) ? current : [...current, result.message],
      );
      setDraft("");
      messageRequest.current = null;
      setRevision((v) => v + 1);
      setAnnouncement("Mensagem registrada na central.");
    } catch (e) {
      setDetailError(failed(e));
    } finally {
      mutating.current = false;
      setDetailBusy(false);
    }
  }
  async function older() {
    if (!selected || !nextBefore || historyBusy) return;
    setHistoryBusy(true);
    try {
      const result = await conversationsApi.messages(tenant.id, selected.id, nextBefore);
      if (activeSelection.current !== selected.id) return;
      setMessages((current) => [
        ...result.items,
        ...current.filter((m) => !result.items.some((older) => older.id === m.id)),
      ]);
      setNextBefore(result.next_before);
    } catch (e) {
      setDetailError(failed(e));
    } finally {
      setHistoryBusy(false);
    }
  }
  async function more() {
    if (pageBusy) return;
    setPageBusy(true);
    const generation = listGeneration.current;
    try {
      const result = await conversationsApi.list(tenant.id, {
        q: search,
        mine,
        unreadOnly,
        offset: items.length,
      });
      if (generation !== listGeneration.current) return;
      setItems((current) => [
        ...current,
        ...result.items.filter((item) => !current.some((old) => old.id === item.id)),
      ]);
      setTotal(result.total);
    } catch (e) {
      setError(failed(e));
    } finally {
      setPageBusy(false);
    }
  }
  useEffect(() => {
    let alive = true;
    conversationsApi
      .summary(tenant.id)
      .then((result) => {
        if (alive) setSummary(result);
      })
      .catch(() => {
        if (alive) setSyncError("Não foi possível atualizar os contadores.");
      });
    return () => {
      alive = false;
    };
  }, [tenant.id, revision]);
  async function acknowledge() {
    const id = activeSelection.current;
    if (
      !id ||
      !selected ||
      selected.id !== id ||
      detailLoading ||
      reading.current ||
      document.visibilityState !== "visible" ||
      !followLatest.current ||
      !messages.length
    )
      return;
    const latest = Math.max(...messages.map((message) => message.id));
    if ((readCursor.current[id] ?? 0) >= latest) return;
    reading.current = true;
    mutationEpoch.current += 1;
    try {
      const result = await conversationsApi.read(tenant.id, id, latest);
      if (activeSelection.current !== id) return;
      readCursor.current[id] = result.last_message_id;
      setSelected((current) =>
        current?.id === id ? { ...current, unread_count: result.unread_count } : current,
      );
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, unread_count: result.unread_count } : item,
        ),
      );
      const counters = await conversationsApi.summary(tenant.id);
      if (activeSelection.current === id) setSummary(counters);
    } catch (e) {
      if (activeSelection.current === id) setSyncError(errorText(e));
    } finally {
      reading.current = false;
    }
  }
  useEffect(() => {
    const container = historyContainer.current;
    if (!container || detailLoading) return;
    const newest = Math.max(0, ...messages.map((message) => message.id));
    const appended = newest > previousNewest.current;
    previousNewest.current = newest;
    if (followLatest.current) {
      container.scrollTop = container.scrollHeight;
      void acknowledge();
    } else if (appended) setNewRecords(true);
    // The read cursor follows the messages actually displayed, never a server-side future cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, detailLoading, selectedId]);
  useVisiblePolling(async (isActive) => {
    if (loading || mutating.current || detailLoading) return;
    const epoch = mutationEpoch.current;
    const generation = listGeneration.current;
    const id = activeSelection.current;
    try {
      const [first, counters, updates] = await Promise.all([
        conversationsApi.list(tenant.id, { q: search, mine, unreadOnly }),
        conversationsApi.summary(tenant.id),
        id && selected
          ? conversationsApi
              .updates(tenant.id, id, Math.max(0, ...messages.map((message) => message.id)))
              .catch((e) => {
                if (e instanceof ApiError && (e.status === 404 || e.status === 403))
                  return { denied: true as const };
                throw e;
              })
          : Promise.resolve(null),
      ]);
      const refreshed = [...first.items];
      while (refreshed.length < Math.min(items.length, first.total)) {
        const page = await conversationsApi.list(tenant.id, {
          q: search,
          mine,
          unreadOnly,
          offset: refreshed.length,
        });
        if (!page.items.length) break;
        refreshed.push(...page.items);
      }
      if (
        !isActive() ||
        mutating.current ||
        epoch !== mutationEpoch.current ||
        generation !== listGeneration.current ||
        id !== activeSelection.current
      )
        return;
      setItems([...new Map(refreshed.map((item) => [item.id, item])).values()]);
      setTotal(first.total);
      setSummary(counters);
      setSyncError("");
      setLastSync(Date.now());
      if (updates && "denied" in updates) {
        setSelected(null);
        setMessages([]);
        setDetailError(
          "Este atendimento foi transferido ou não está mais disponível para seu perfil.",
        );
      } else if (updates) {
        setSelected(updates.conversation);
        if (updates.messages.length)
          setMessages((current) =>
            [
              ...new Map(
                [...current, ...updates.messages].map((message) => [message.id, message]),
              ).values(),
            ].sort((a, b) => a.id - b.id),
          );
        else void acknowledge();
      }
    } catch (e) {
      if (!isActive()) return;
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setItems([]);
        setTotal(0);
        setSummary(null);
        setSelected(null);
        setMessages([]);
        setDetailError("Seu acesso à central foi interrompido. Atualize sua sessão.");
        if (e.status === 401) router.replace("/login");
        router.refresh();
      }
      setSyncError("A atualização automática falhou. Tentaremos novamente em instantes.");
    }
  });
  const canManageSelected = !!selected && (manager || selected.assigned_user?.id === user.id);
  const canRecord =
    canManageSelected && selected && !["closed", "converted", "ai"].includes(selected.status);
  const stages = conversationStatuses.filter(
    (status) => status !== "ai" || items.some((item) => item.status === "ai"),
  );
  function drop(event: DragEvent, status: ConversationStatus) {
    event.preventDefault();
    const conv = items.find((item) => item.id === event.dataTransfer.getData("text/plain"));
    if (conv && status !== "ai" && status !== conv.status) void change(conv, { status });
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
            Organize as solicitações e acompanhe o histórico de cada cliente.
          </p>
        </div>
        <Button
          className="rounded-full px-5"
          disabled={!!rosterError}
          onClick={() => {
            setCreating(true);
            setCreateError("");
            createRequest.current = null;
          }}
        >
          <Plus className="h-4 w-4" />
          Novo atendimento
        </Button>
      </header>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <section aria-label="Resumo da central" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Em andamento", value: summary?.active },
          { label: "Sem responsável", value: summary?.unassigned },
          { label: "Com registros não lidos", value: summary?.unread_conversations },
          { label: "Registros não lidos", value: summary?.unread_messages },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border bg-card px-5 py-4">
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            {metric.value === undefined ? (
              <Skeleton className="mt-2 h-7 w-12" />
            ) : (
              <p
                className="mt-2 text-2xl font-semibold"
                aria-label={`${metric.label}: ${metric.value}`}
              >
                {metric.value}
              </p>
            )}
          </div>
        ))}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p role="status">{syncError || "Atualização automática a cada 5 segundos"}</p>
        {lastSync && (
          <span>
            Última atualização:{" "}
            {new Date(lastSync).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              timeZone: "America/Sao_Paulo",
            })}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Buscar atendimento"
            placeholder="Buscar cliente, telefone ou assunto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-xl pl-9"
            maxLength={100}
          />
        </div>
        <select
          aria-label="Filtrar responsável"
          value={mine ? "mine" : "all"}
          onChange={(e) => setMine(e.target.value === "mine")}
          className="h-10 rounded-xl border bg-background px-3 text-sm"
        >
          <option value="all">Todos os disponíveis</option>
          <option value="mine">Meus atendimentos</option>
        </select>
        <Button
          variant={unreadOnly ? "default" : "outline"}
          className="rounded-xl"
          aria-pressed={unreadOnly}
          onClick={() => setUnreadOnly((current) => !current)}
        >
          Não lidos{summary ? ` (${summary.unread_conversations})` : ""}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl"
          aria-label="Atualizar atendimentos"
          disabled={loading}
          onClick={() => {
            setRevision((v) => v + 1);
            if (selectedId) setDetailRevision((v) => v + 1);
          }}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <span className="text-xs text-muted-foreground">
          {loading ? "Carregando…" : `${items.length} de ${total} atendimentos`}
        </span>
      </div>
      {(error || rosterError) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 p-4 text-sm"
        >
          <p className="text-destructive">{error || rosterError}</p>
          <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
        </div>
      )}
      {loading ? (
        <div
          role="status"
          aria-label="Carregando atendimentos"
          className="grid gap-4 sm:grid-cols-3"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 && !error ? (
        <section className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <Headphones className="mx-auto mb-4 h-9 w-9 text-muted-foreground" />
          <h2 className="text-base font-semibold">
            {search || mine || unreadOnly
              ? "Nenhum atendimento encontrado"
              : "Sua central está pronta para começar"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {search || mine || unreadOnly
              ? "Tente outro filtro ou busca."
              : "Crie o primeiro atendimento para registrar uma solicitação."}
          </p>
        </section>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max items-start gap-4">
            {stages.map((stage) => (
              <section
                role="region"
                aria-label={statusLabels[stage]}
                key={stage}
                className="w-[286px] rounded-2xl border bg-muted/20 p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => drop(e, stage)}
              >
                <div className="mb-4 px-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${colors[stage]}`} />
                    <h2 className="flex-1 text-sm font-semibold">{statusLabels[stage]}</h2>
                    <span className="rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
                      {items.filter((item) => item.status === stage).length}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">{descriptions[stage]}</p>
                </div>
                <div className="space-y-3">
                  {items
                    .filter((item) => item.status === stage)
                    .map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        draggable={!detailBusy && (manager || item.assigned_user?.id === user.id)}
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                        onClick={() => open(item.id)}
                        aria-label={`Abrir atendimento de ${item.customer.name}: ${item.subject}`}
                        className="w-full rounded-xl border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold">
                            {initials(item.customer.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold">{item.customer.name}</p>
                              {item.unread_count > 0 && (
                                <span
                                  aria-label={`${item.unread_count} registros não lidos`}
                                  className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground"
                                >
                                  {item.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {item.customer.business_name || item.customer.phone}
                            </p>
                          </div>
                          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                        <p className="my-4 line-clamp-2 text-sm leading-5">{item.subject}</p>
                        <div className="flex items-center justify-between gap-2 border-t pt-3 text-[10px] text-muted-foreground">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <UserRound className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {item.assigned_user?.name ?? "Sem responsável"}
                            </span>
                          </span>
                          <span className="shrink-0">Manual</span>
                        </div>
                        <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock3 className="h-3 w-3" />
                          {conversationTime(item.updated_at)}
                        </p>
                      </button>
                    ))}
                  {!items.some((item) => item.status === stage) && (
                    <p className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                      Nenhum atendimento nesta etapa
                    </p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
      {items.length < total && !loading && (
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={pageBusy}
          onClick={() => void more()}
        >
          {pageBusy ? "Carregando…" : "Carregar mais atendimentos"}
        </Button>
      )}
      <Dialog
        open={creating}
        onOpenChange={(next) => {
          if (!createBusy) setCreating(next);
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto rounded-2xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>Novo atendimento</DialogTitle>
            <DialogDescription>Registre uma solicitação no canal manual.</DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <fieldset disabled={createBusy} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="conversation-name" className="text-sm font-medium">
                  Nome do cliente
                </label>
                <Input
                  id="conversation-name"
                  name="name"
                  minLength={2}
                  maxLength={120}
                  required
                  className="h-11 rounded-xl"
                  placeholder="Nome completo ou contato"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="conversation-phone" className="text-sm font-medium">
                    Telefone
                  </label>
                  <Input
                    id="conversation-phone"
                    name="phone"
                    type="tel"
                    minLength={10}
                    maxLength={24}
                    required
                    className="h-11 rounded-xl"
                    placeholder="(11) 99999-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="conversation-business" className="text-sm font-medium">
                    Empresa do cliente
                  </label>
                  <Input
                    id="conversation-business"
                    name="business"
                    maxLength={160}
                    className="h-11 rounded-xl"
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="conversation-subject" className="text-sm font-medium">
                  Assunto
                </label>
                <Input
                  id="conversation-subject"
                  name="subject"
                  required
                  minLength={2}
                  maxLength={200}
                  className="h-11 rounded-xl"
                  placeholder="Produto ou solicitação do cliente"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="conversation-owner" className="text-sm font-medium">
                  Responsável
                </label>
                <select
                  id="conversation-owner"
                  name="owner"
                  defaultValue={user.id}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
                >
                  {manager && <option value="">Sem responsável</option>}
                  {assignees
                    .filter((member) => manager || member.id === user.id)
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                        {member.id === user.id ? " (você)" : ""}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="conversation-initial" className="text-sm font-medium">
                  Relato do cliente
                </label>
                <textarea
                  id="conversation-initial"
                  name="initial"
                  maxLength={4000}
                  rows={3}
                  className="w-full resize-y rounded-xl border bg-background p-3 text-sm"
                  placeholder="Registre o que o cliente solicitou (opcional)"
                />
              </div>
            </fieldset>
            {createError && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/20 p-3 text-sm text-destructive"
              >
                {createError}
              </p>
            )}
            <p className="text-xs leading-5 text-muted-foreground">
              O telefone identifica o cliente nesta empresa. Se já existir, o cadastro será
              reutilizado. Nenhuma mensagem será enviada pelo WhatsApp.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={createBusy}
                onClick={() => setCreating(false)}
              >
                Cancelar
              </Button>
              <Button className="rounded-xl" type="submit" disabled={createBusy}>
                {createBusy ? "Criando…" : "Criar atendimento"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={selectedId !== null}
        onOpenChange={(next) => {
          if (!next && !detailBusy) open(null);
        }}
      >
        <DialogContent
          data-display-mode={displayMode}
          style={conversationLayouts[displayMode]}
          className={`flex flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl ${displayMode !== "modal" ? "translate-x-0 translate-y-0 data-[state=open]:animate-none data-[state=closed]:animate-none" : ""}`}
        >
          <DialogHeader className="border-b p-6 pr-24 text-left sm:text-left">
            <DialogTitle>{selected?.customer.name ?? "Atendimento"}</DialogTitle>
            <DialogDescription>
              {selected?.subject ?? "Histórico e detalhes do atendimento"}
            </DialogDescription>
          </DialogHeader>
          <DisplayModePicker
            value={displayMode}
            title="Abrir conversa como"
            groupLabel="Formato da conversa"
            onChange={(mode) => {
              setDisplayMode(mode);
              try {
                localStorage.setItem(displayPreference, mode);
              } catch {
                /* Preference is optional. */
              }
            }}
          />
          {detailLoading ? (
            <div role="status" aria-label="Carregando histórico" className="space-y-5 p-6">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ) : selected ? (
            <>
              <div className="space-y-4 border-b bg-muted/10 p-5">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full border bg-background px-2.5 py-1">
                    {selected.channel === "whatsapp_qr"
                      ? "WhatsApp · QR Code"
                      : selected.channel === "whatsapp"
                        ? "WhatsApp"
                        : "Canal manual"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />+{selected.customer.phone}
                  </span>
                  {selected.customer.business_name && (
                    <span>{selected.customer.business_name}</span>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="detail-status" className="text-xs font-medium">
                      Status do atendimento
                    </label>
                    <select
                      id="detail-status"
                      value={selected.status}
                      disabled={detailBusy || !canManageSelected}
                      onChange={(e) =>
                        void change(selected, { status: e.target.value as ConversationStatus })
                      }
                      className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                    >
                      {conversationStatuses.map((status) => (
                        <option
                          key={status}
                          value={status}
                          disabled={
                            status === "ai" ||
                            (selected.status === "closed" && !["closed", "human"].includes(status))
                          }
                        >
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="detail-owner" className="text-xs font-medium">
                      Responsável do atendimento
                    </label>
                    <select
                      id="detail-owner"
                      value={selected.assigned_user?.id ?? ""}
                      disabled={detailBusy || !manager || !!rosterError}
                      onChange={(e) =>
                        void change(selected, { assigned_user_id: e.target.value || null })
                      }
                      className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                    >
                      <option value="">Sem responsável</option>
                      {selected.assigned_user &&
                        !assignees.some((member) => member.id === selected.assigned_user?.id) && (
                          <option value={selected.assigned_user.id}>
                            {selected.assigned_user.name} (indisponível)
                          </option>
                        )}
                      {assignees.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!selected.assigned_user && (
                    <Button
                      size="sm"
                      className="rounded-lg"
                      disabled={detailBusy}
                      onClick={() =>
                        void change(selected, { assigned_user_id: user.id, status: "human" })
                      }
                    >
                      <UserRound className="h-3.5 w-3.5" />
                      Assumir atendimento
                    </Button>
                  )}
                  {canManageSelected && ["closed", "converted"].includes(selected.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      disabled={detailBusy}
                      onClick={() => void change(selected, { status: "human" })}
                    >
                      Reabrir atendimento
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg"
                    disabled={detailBusy}
                    onClick={() => setDetailRevision((v) => v + 1)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Atualizar histórico
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 border-b px-5 py-3 text-xs text-muted-foreground">
                <p>
                  Primeira resposta manual:{" "}
                  <strong className="font-medium text-foreground">
                    {handlingTime(selected.first_response_seconds)}
                  </strong>
                </p>
                <p>
                  Tempo em atendimento:{" "}
                  <strong className="font-medium text-foreground">
                    {handlingTime(selected.handling_seconds)}
                  </strong>
                </p>
              </div>
              {newRecords && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mx-auto my-2 rounded-full"
                  onClick={() => {
                    followLatest.current = true;
                    setNewRecords(false);
                    const container = historyContainer.current;
                    if (container) container.scrollTop = container.scrollHeight;
                    void acknowledge();
                  }}
                >
                  Ir para os novos registros
                </Button>
              )}
              <div
                ref={historyContainer}
                onScroll={() => {
                  const container = historyContainer.current;
                  if (!container) return;
                  followLatest.current =
                    container.scrollHeight - container.scrollTop - container.clientHeight < 60;
                  if (followLatest.current) {
                    setNewRecords(false);
                    void acknowledge();
                  }
                }}
                className="min-h-0 flex-1 overflow-y-auto bg-muted/15 p-5"
              >
                <div role="log" aria-label="Histórico de mensagens" className="space-y-4">
                  {nextBefore && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mx-auto flex rounded-xl"
                      disabled={historyBusy}
                      onClick={() => void older()}
                    >
                      {historyBusy ? "Carregando…" : "Mensagens anteriores"}
                    </Button>
                  )}
                  {messages.map((message) =>
                    message.kind === "system" ? (
                      <p
                        key={message.id}
                        className="py-1 text-center text-[11px] leading-5 text-muted-foreground"
                      >
                        {message.body}
                        <span className="ml-2 opacity-70">
                          {conversationTime(message.created_at)}
                        </span>
                      </p>
                    ) : (
                      <div
                        key={message.id}
                        className={`flex ${["customer_record", "whatsapp_inbound"].includes(message.kind) ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[90%] rounded-2xl border p-4 sm:max-w-[80%] ${["customer_record", "whatsapp_inbound"].includes(message.kind) ? "bg-card" : message.kind === "internal_note" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-primary/15 bg-primary/10"}`}
                        >
                          <p className="mb-2 text-[10px] font-semibold text-muted-foreground">
                            {message.kind === "whatsapp_inbound"
                              ? "Cliente · WhatsApp"
                              : message.kind === "customer_record"
                                ? "Relato do cliente · registro manual"
                                : message.kind === "internal_note"
                                  ? "Nota interna"
                                  : "Mensagem manual"}{" "}
                            ·{" "}
                            {message.actor?.name ??
                              (message.kind === "whatsapp_inbound"
                                ? selected?.customer.name
                                : "Equipe")}
                          </p>
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">
                            {message.body}
                          </p>
                          <p className="mt-2 text-right text-[10px] text-muted-foreground">
                            {conversationTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
              {detailError && (
                <p
                  role="alert"
                  className="mx-5 mb-3 rounded-xl border border-destructive/20 p-3 text-xs text-destructive"
                >
                  {detailError}
                </p>
              )}
              <form onSubmit={record} className="space-y-3 border-t p-5">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="manual-message" className="text-xs font-medium">
                    Registrar no histórico
                  </label>
                  <select
                    aria-label="Tipo de registro"
                    value={kind}
                    onChange={(e) => setKind(e.target.value as typeof kind)}
                    disabled={detailBusy || !canRecord}
                    className="rounded-lg border bg-background px-2 py-1 text-xs"
                  >
                    <option value="manual_outbound">Mensagem manual</option>
                    <option value="internal_note">Nota interna</option>
                  </select>
                </div>
                <textarea
                  id="manual-message"
                  aria-label="Mensagem do atendimento"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={4000}
                  rows={3}
                  disabled={detailBusy || !canRecord}
                  placeholder={
                    canRecord
                      ? "Escreva o registro deste atendimento…"
                      : "Assuma ou reabra o atendimento para registrar mensagens."
                  }
                  className="w-full resize-none rounded-xl border bg-background p-3 text-sm disabled:opacity-50"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-sm text-[11px] leading-5 text-muted-foreground">
                    Salvo somente nesta central. O registro não envia mensagens ao cliente.
                  </p>
                  <Button
                    type="submit"
                    className="rounded-xl"
                    disabled={detailBusy || !canRecord || !draft.trim()}
                  >
                    {detailBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Registrar
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="p-6">
              <p role="alert" className="text-sm text-destructive">
                {detailError || "Atendimento indisponível."}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setDetailRevision((v) => v + 1)}
              >
                Tentar novamente
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
