"use client";

import { useState } from "react";
import {
  BookOpen,
  Plug,
  Users,
  CreditCard,
  Search,
  ArrowUpRight,
  Headphones,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { openSupportChat } from "@/components/support/support-chat";
const topics = [
  {
    id: "start",
    title: "Primeiros passos",
    description: "Conheça o painel e organize sua operação.",
    icon: BookOpen,
  },
  {
    id: "integrations",
    title: "Integrações",
    description: "WhatsApp, GestãoClick e seus produtos.",
    icon: Plug,
  },
  {
    id: "team",
    title: "Conta e equipe",
    description: "Acessos, usuários e dados da empresa.",
    icon: Users,
  },
  {
    id: "plans",
    title: "Planos e teste",
    description: "Entenda seu período de teste e assinatura.",
    icon: CreditCard,
  },
];
const questions = [
  {
    topic: "start",
    question: "Por onde começo a configurar minha empresa?",
    answer:
      "Abra Configurações para revisar os dados da empresa e os acessos da equipe. Depois, vá a Integrações para configurar o WhatsApp e o GestãoClick. O que pode ser alterado depende do seu perfil de acesso.",
  },
  {
    topic: "integrations",
    question: "Como conecto o WhatsApp por QR Code?",
    answer:
      "Em Integrações, escolha WhatsApp por QR Code e clique em Conectar. No painel que abrir, clique em Gerar QR Code. No celular da empresa, abra WhatsApp → Dispositivos conectados → Conectar dispositivo e leia o código. Esse canal utiliza uma conexão não oficial.",
  },
  {
    topic: "integrations",
    question: "Preciso copiar um token para conectar o WhatsApp oficial?",
    answer:
      "Quando o Cadastro Incorporado estiver configurado pela plataforma, use Conectar com a Meta e autorize o acesso na janela da Meta. Os tokens são tratados no servidor. A configuração manual continua disponível como alternativa. A autorização é uma etapa: o registro do número e a inscrição nos eventos também precisam ser conferidos.",
  },
  {
    topic: "integrations",
    question: "Como trago meus produtos do GestãoClick?",
    answer:
      "Um administrador deve abrir GestãoClick ERP em Integrações, cadastrar as credenciais e validar o acesso. Depois, pode iniciar a sincronização do catálogo. Os produtos importados ficam vinculados à empresa na página Produtos. Nunca compartilhe suas credenciais pelo chat de suporte.",
  },
  {
    topic: "integrations",
    question: "Posso colocar uma imagem no produto?",
    answer:
      "Na listagem de Produtos, use a ação de imagem do produto para abrir o envio. Selecione uma imagem ou arraste o arquivo para a área de upload. O sistema valida o arquivo antes de salvar, e o acesso à imagem depende da sessão e da empresa.",
  },
  {
    topic: "team",
    question: "Como adiciono alguém à minha equipe?",
    answer:
      "Administradores podem abrir Configurações → Equipe para cadastrar um usuário, escolher seu perfil e gerenciar os acessos. Use contas individuais para cada pessoa. Não compartilhe a senha do administrador.",
  },
  {
    topic: "team",
    question: "Por que não consigo alterar uma configuração?",
    answer:
      "Algumas ações ficam disponíveis somente para administradores da empresa. Confira seu acesso com o responsável pela equipe. Se sua sessão expirou, entre novamente. Usuários de uma empresa não podem acessar os dados de outra.",
  },
  {
    topic: "plans",
    question: "Quanto tempo dura o teste gratuito?",
    answer:
      "O teste começa no cadastro da empresa e dura sete dias. A faixa no topo mostra o prazo restante com base na data de término da empresa. Em Configurações → Planos, você pode conferir o status e as informações disponíveis da assinatura.",
  },
  {
    topic: "plans",
    question: "O que acontece quando o teste acaba?",
    answer:
      "O acesso às áreas operacionais é bloqueado quando o período de teste termina. Consulte as opções em Planos e as orientações da plataforma para continuar. A exibição de um plano no catálogo, por si só, não confirma uma contratação.",
  },
];
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
export function HelpScreen() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const results = questions.filter(
    (item) =>
      (topic === "all" || topic === item.topic) &&
      normalize(`${item.question} ${item.answer}`).includes(normalize(query.trim())),
  );
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 p-4 pb-28 md:p-8 md:pb-28">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Headphones className="h-4 w-4" />
        Central de ajuda
      </div>
      <section className="rounded-3xl border bg-card px-6 py-8 sm:px-9 sm:py-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Ajuda e suporte
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Como podemos ajudar?</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Encontre orientações para usar a plataforma e resolver as dúvidas do dia a dia.
        </p>
        <div className="relative mt-6 max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label="Buscar na central de ajuda"
            placeholder="Busque por WhatsApp, produtos, usuários…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 w-full rounded-2xl border bg-background pl-11 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </section>
      <section aria-label="Assuntos de ajuda" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {topics.map(({ id, title, description, icon: Icon }) => (
          <button
            type="button"
            key={id}
            aria-pressed={topic === id}
            onClick={() => {
              setTopic(topic === id ? "all" : id);
              setQuery("");
            }}
            className={`group rounded-2xl border bg-card p-5 text-left transition-colors hover:border-neutral-400 ${topic === id ? "border-neutral-600 ring-1 ring-neutral-600" : ""}`}
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <Icon className="h-4 w-4" strokeWidth={1.7} />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </button>
        ))}
      </section>
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Perguntas frequentes</h2>
            <button
              type="button"
              onClick={() => {
                setTopic("all");
                setQuery("");
              }}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              Ver todas
            </button>
          </div>
          <p role="status" className="mb-3 text-xs text-muted-foreground">
            {results.length}{" "}
            {results.length === 1 ? "resposta encontrada" : "respostas encontradas"}
          </p>
          <div className="overflow-hidden rounded-2xl border bg-card">
            {results.length ? (
              results.map(({ question, answer }) => (
                <details key={question} className="group border-b last:border-b-0">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                    {question}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {answer}
                  </p>
                </details>
              ))
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium">Não encontramos uma resposta para essa busca.</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Tente outra palavra ou abra o chat de suporte.
                </p>
              </div>
            )}
          </div>
        </div>
        <aside className="rounded-2xl border bg-card p-6">
          <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0dd] text-neutral-800">
            <Headphones className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold">Ainda precisa de ajuda?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Abra uma conversa com o assistente para encontrar uma orientação.
          </p>
          <button
            type="button"
            onClick={openSupportChat}
            className="mt-6 flex h-11 w-full items-center justify-between rounded-xl bg-neutral-900 px-4 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            Abrir chat de suporte
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Não envie senhas, tokens de acesso ou informações de pagamento.
          </p>
        </aside>
      </section>
    </main>
  );
}
