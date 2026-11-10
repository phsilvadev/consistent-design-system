"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./support-chat.module.css";
import { ArrowUp, Headphones, MessageCircle, Minus, X } from "lucide-react";

import { useTenant } from "@/lib/tenant/provider";
import { supportApi, type SupportTurn, type SupportHistory } from "@/lib/auth/support";
import { ApiError } from "@/lib/auth/client";
const suggestions = ["Conectar meu WhatsApp", "Importar produtos", "Gerenciar minha equipe"];
export function openSupportChat() {
  window.dispatchEvent(new Event("atendehub:open-support"));
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { tenant, user, href } = useTenant();
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<SupportHistory | null>(null);
  const [retry, setRetry] = useState(0);
  const sending = useRef(false);
  const attempt = useRef<{ id: string; text: string } | null>(null);
  const generation = useRef(0);
  const [draft, setDraft] = useState("");
  const [optimistic, setOptimistic] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportTurn[]>([]);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("atendehub:open-support", show);
    return () => window.removeEventListener("atendehub:open-support", show);
  }, []);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const history = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timer = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(timer);
  }, [open]);
  useEffect(() => {
    if (open && mounted && !loading) input.current?.focus();
  }, [open, mounted, loading]);
  useEffect(() => {
    generation.current += 1;
    setMessages([]);
    setOptimistic(null);
    setData(null);
    setDraft("");
    setError("");
    setTyping(false);
    sending.current = false;
    attempt.current = null;
    return () => {
      generation.current += 1;
    };
  }, [tenant.id, user.id]);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const current = generation.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const value = await supportApi.history(tenant.id, user.id);
        if (!alive || current !== generation.current) return;
        if (!sending.current) {
          setData(value);
          setMessages(value.items);
          const recovered =
            attempt.current && value.items.find((item) => item.request_id === attempt.current?.id);
          if (recovered) {
            const original = attempt.current!.text;
            attempt.current = null;
            setDraft((current) => (current === original ? "" : current));
          }
          if (!attempt.current) setError("");
        }
        if (value.items.some((item) => item.status === "processing"))
          timer = setTimeout(() => void load(), 2000);
      } catch (e) {
        if (alive && current === generation.current) {
          setError(e instanceof Error ? e.message : "Não foi possível carregar o suporte.");
          if (e instanceof ApiError && e.status === 401) window.location.replace("/login");
        }
      } finally {
        if (alive && current === generation.current) setLoading(false);
      }
    }
    setLoading(true);
    void load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [open, tenant.id, user.id, retry]);
  useEffect(() => {
    history.current?.scrollTo({
      top: history.current.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [messages, typing, mounted]);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  async function send(text: string, replay = false) {
    const clean = text.trim().slice(0, 1000);
    if (!clean || sending.current || messages.some((item) => item.status === "processing")) return;
    const current = generation.current;
    const request =
      replay && attempt.current ? attempt.current : { id: crypto.randomUUID(), text: clean };
    attempt.current = request;
    sending.current = true;
    setTyping(true);
    setOptimistic(request.text);
    setError("");
    setDraft("");
    try {
      const result = await supportApi.send(request.id, request.text);
      if (current !== generation.current) return;
      setMessages((items) =>
        [...items.filter((item) => item.request_id !== result.request_id), result].slice(-20),
      );
      attempt.current = null;
      if (result.status === "failed") setDraft(request.text);
    } catch (e) {
      if (current === generation.current) {
        setError(e instanceof Error ? e.message : "Não foi possível enviar a mensagem.");
        setDraft(request.text);
        if (e instanceof ApiError && e.status === 401) window.location.replace("/login");
      }
    } finally {
      if (current === generation.current) {
        sending.current = false;
        setTyping(false);
        setOptimistic(null);
        setRetry((v) => v + 1);
      }
      input.current?.focus();
    }
  }
  const currentData = data?.company_id === tenant.id && data?.user_id === user.id ? data : null;
  const visibleMessages = currentData ? messages : [];
  const pending =
    !!currentData && (typing || visibleMessages.some((item) => item.status === "processing"));
  const available = currentData?.available ?? false;
  return (
    <div className="fixed bottom-4 right-4 z-40 font-sans sm:bottom-6 sm:right-6">
      {mounted && (
        <section
          role="dialog"
          data-state={open ? "open" : "closed"}
          aria-hidden={!open}
          inert={!open}
          aria-modal="false"
          aria-label="Chat de suporte"
          id="support-chat"
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
          className={`${styles["panel"]} mb-3 flex h-[min(620px,calc(100dvh-110px))] w-[calc(100vw-32px)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white text-neutral-900 shadow-[0_16px_70px_-15px_rgba(0,0,0,0.3)]`}
        >
          <header className="flex items-center gap-3 bg-[#202329] px-5 py-4 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fb982b] text-neutral-950">
              <Headphones className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">Suporte AtendeHub</h2>
              <p className="mt-1 text-xs text-neutral-300">Assistente virtual · IA</p>
            </div>
            <button
              type="button"
              aria-label="Minimizar chat"
              onClick={close}
              className="rounded-lg p-1.5 text-neutral-300 hover:bg-white/10"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Fechar chat"
              onClick={close}
              className="rounded-lg p-1.5 text-neutral-300 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div
            ref={history}
            className="flex-1 space-y-5 overflow-y-auto bg-[#fafafa] p-5"
            role="log"
            aria-live="polite"
            aria-label="Mensagens do suporte"
          >
            <div className={styles["message"]}>
              <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-400">
                Vamos facilitar seu dia
              </p>
              <div className="rounded-2xl rounded-tl-sm border border-neutral-200/70 bg-white p-4 text-sm leading-relaxed">
                <p className="font-semibold">Olá! Como posso ajudar?</p>
                <p className="mt-2 text-neutral-600">
                  Tire suas dúvidas sobre a plataforma ou escolha um assunto abaixo.
                </p>
              </div>
            </div>
            {!loading && available && visibleMessages.length === 0 && (
              <div className="flex flex-col items-start gap-2">
                {suggestions.map((text, index) => (
                  <button
                    type="button"
                    key={text}
                    onClick={() => void send(text)}
                    style={{ animationDelay: `${90 + index * 55}ms` }}
                    className={`${styles["suggestion"]} rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left text-xs font-medium hover:border-[#fb982b] hover:bg-orange-50`}
                  >
                    {text}
                    <span aria-hidden="true" className="ml-3 text-neutral-400">
                      ↗
                    </span>
                  </button>
                ))}
              </div>
            )}
            {visibleMessages.map((turn) => (
              <div key={turn.id} className="space-y-3">
                <div className={`${styles["message"]} flex justify-end`}>
                  <p className="max-w-[92%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-[#202329] px-4 py-3 text-sm leading-relaxed text-white">
                    {turn.message}
                  </p>
                </div>
                {turn.status === "complete" && (
                  <div
                    className={`${styles["message"]} rounded-2xl rounded-tl-sm border border-neutral-200/70 bg-white p-4 text-sm leading-relaxed text-neutral-700`}
                  >
                    <p className="whitespace-pre-wrap break-words">{turn.answer}</p>
                    {turn.sources.length > 0 && (
                      <div className="mt-3 border-t border-neutral-100 pt-2">
                        <p className="text-[10px] font-medium text-neutral-400">
                          Referências da ajuda
                        </p>
                        {turn.sources.map((source) => (
                          <a
                            key={source.id}
                            href={href("/ajuda")}
                            className="mt-1 block text-xs underline underline-offset-2"
                          >
                            {source.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {turn.status === "failed" && (
                  <p className="rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-600">
                    {turn.error}
                  </p>
                )}
              </div>
            ))}
            {currentData && optimistic && (
              <div className="flex justify-end">
                <p className="max-w-[92%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-[#202329] px-4 py-3 text-sm leading-relaxed text-white">
                  {optimistic}
                </p>
              </div>
            )}
            {loading && (
              <p role="status" className="text-xs text-neutral-500">
                Carregando histórico…
              </p>
            )}
            {!loading && currentData && !available && (
              <p
                role="status"
                className="rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-600"
              >
                O suporte com IA está indisponível no momento. Consulte a Central de ajuda.
              </p>
            )}
            {error && (
              <div
                role="alert"
                className="space-y-2 rounded-xl border border-neutral-300 bg-white p-3 text-xs"
              >
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (attempt.current) void send(attempt.current.text, true);
                    else setRetry((v) => v + 1);
                  }}
                  className="font-medium underline"
                >
                  {attempt.current ? "Consultar ou repetir envio" : "Atualizar histórico"}
                </button>
              </div>
            )}
            {pending && (
              <div
                className={`${styles["message"]} flex items-center gap-2`}
                role="status"
                aria-label="Assistente preparando resposta"
              >
                <div
                  aria-hidden="true"
                  className="flex h-10 items-center gap-1.5 rounded-2xl rounded-tl-sm border border-neutral-200/70 bg-white px-4"
                >
                  <span className={styles["dot"]} />
                  <span className={styles["dot"]} />
                  <span className={styles["dot"]} />
                </div>
                <span className="text-[11px] text-neutral-400">Preparando resposta…</span>
              </div>
            )}
          </div>
          <footer className="border-t border-neutral-100 bg-white p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(draft);
              }}
              className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 focus-within:border-neutral-400"
            >
              <input
                ref={input}
                aria-label="Sua mensagem para o suporte"
                placeholder="Escreva sua dúvida…"
                maxLength={1000}
                disabled={
                  loading ||
                  !available ||
                  pending ||
                  (!!currentData && currentData.used_today >= currentData.daily_limit)
                }
                value={currentData ? draft : ""}
                onChange={(e) => setDraft(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
              />
              <button
                type="submit"
                aria-label="Enviar mensagem"
                disabled={
                  !draft.trim() ||
                  pending ||
                  loading ||
                  !available ||
                  (!!currentData && currentData.used_today >= currentData.daily_limit)
                }
                className={`${styles["send"]} flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fb982b] text-neutral-950 disabled:opacity-35`}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
            {currentData && (
              <p className="mt-2 text-center text-[10px] text-neutral-400">
                {Math.max(0, currentData.daily_limit - currentData.used_today)} envios disponíveis
                hoje · histórico por {currentData.retention_days} dias
              </p>
            )}
            <p className="mt-3 text-center text-[10px] text-neutral-400">
              Não envie senhas, chaves ou dados pessoais.
            </p>
          </footer>
        </section>
      )}
      <div className="flex justify-end">
        <button
          ref={trigger}
          type="button"
          aria-label={open ? "Recolher suporte" : "Abrir suporte"}
          aria-expanded={open}
          aria-controls="support-chat"
          onClick={() => (open ? close() : setOpen(true))}
          className={`${styles["trigger"]} flex h-12 items-center gap-2.5 rounded-full bg-[#202329] px-5 text-sm font-semibold text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400`}
        >
          <span key={open ? "open" : "closed"} className={styles["icon"]}>
            {open ? (
              <X className="h-5 w-5 text-[#fb982b]" />
            ) : (
              <MessageCircle className="h-5 w-5 text-[#fb982b]" />
            )}
          </span>
          Suporte
          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-[#fb982b]" />
        </button>
      </div>
    </div>
  );
}
