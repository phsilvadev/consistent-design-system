"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./support-chat.module.css";
import { ArrowUp, Headphones, MessageCircle, Minus, X } from "lucide-react";

type Message = { author: "assistant" | "user"; text: string };
const suggestions = ["Conectar meu WhatsApp", "Importar produtos", "Gerenciar minha equipe"];
function previewReply(text: string) {
  if (/whats|qr|conect/i.test(text))
    return "Para conectar seu WhatsApp, abra Integrações e escolha o canal. Na opção por QR Code, clique em Conectar e depois em Gerar QR Code. No celular, acesse Dispositivos conectados para fazer a leitura.";
  if (/produt|erp|gestão|gestao|import/i.test(text))
    return "Em Integrações, abra o GestãoClick ERP para configurar o acesso. Depois, use a sincronização de produtos. O catálogo fica disponível na página Produtos.";
  if (/equipe|usuári|usuari|vendedor/i.test(text))
    return "Abra Configurações → Equipe. Administradores podem cadastrar usuários e editar os acessos. Cada pessoa deve ter sua própria conta.";
  return "Posso ajudar com WhatsApp, produtos e acessos da equipe. Esta é uma prévia do chat: as respostas são exemplos e a IA ainda não está conectada.";
}
export function openSupportChat() {
  window.dispatchEvent(new Event("atendehub:open-support"));
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [typing, setTyping] = useState(false);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
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
    if (open && mounted) input.current?.focus();
  }, [open, mounted]);
  useEffect(
    () => () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    },
    [],
  );
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
  function send(text: string) {
    const clean = text.trim().slice(0, 1000);
    if (!clean || replyTimer.current) return;
    setMessages((items) => [...items, { author: "user", text: clean }]);
    setDraft("");
    setTyping(true);
    // Visual preview only; this delay does not call an AI service.
    replyTimer.current = setTimeout(() => {
      setMessages((items) => [...items, { author: "assistant", text: previewReply(clean) }]);
      setTyping(false);
      replyTimer.current = null;
    }, 850);
    input.current?.focus();
  }
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
              <p className="mt-1 text-xs text-neutral-300">Assistente virtual · prévia</p>
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
            {messages.length === 0 && (
              <div className="flex flex-col items-start gap-2">
                {suggestions.map((text, index) => (
                  <button
                    type="button"
                    key={text}
                    onClick={() => send(text)}
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
            {messages.map((message, i) => (
              <div
                key={i}
                className={`${styles["message"]} flex ${message.author === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[92%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.author === "user" ? "rounded-br-sm bg-[#202329] text-white" : "rounded-tl-sm border border-neutral-200/70 bg-white text-neutral-700"}`}
                >
                  {message.text}
                </p>
              </div>
            ))}
            {typing && (
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
                send(draft);
              }}
              className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 focus-within:border-neutral-400"
            >
              <input
                ref={input}
                aria-label="Sua mensagem para o suporte"
                placeholder="Escreva sua dúvida…"
                maxLength={1000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
              />
              <button
                type="submit"
                aria-label="Enviar mensagem"
                disabled={!draft.trim() || typing}
                className={`${styles["send"]} flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fb982b] text-neutral-950 disabled:opacity-35`}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-3 text-center text-[10px] text-neutral-400">
              Prévia visual · respostas de exemplo, sem IA conectada
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
