import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Home, Users, Package, FileText, ShoppingCart, Wrench, Boxes, Wallet, Receipt,
  FileSignature, Headphones, BarChart3, Settings, Menu, Bell, LayoutGrid, Eye, EyeOff,
  ArrowUpRight, Plus, CalendarDays, Landmark, ChevronDown, Sparkles, Shield,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Forja ERP" },
      { name: "description", content: "Painel do Forja ERP: resumo financeiro, fluxo de caixa, vendas, contas e agenda." },
      { property: "og:title", content: "Início — Forja ERP" },
      { property: "og:description", content: "Painel administrativo com indicadores financeiros e de vendas." },
    ],
  }),
  component: Dashboard,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const menu = [
  [Home, "Início"], [Users, "Cadastros"], [Package, "Itens"], [FileText, "Orçamentos"],
  [ShoppingCart, "Vendas"], [Wrench, "Ordens de serviços"], [Boxes, "Estoque"], [Wallet, "Financeiro"],
  [Receipt, "Fiscal"], [FileSignature, "Contratos"], [Headphones, "Atendimentos"],
  [BarChart3, "Relatórios"], [Settings, "Configurações"],
] as const;

const fluxo = [
  { m: "Jun", e: 42000, s: 31000 }, { m: "Jul", e: 38500, s: 29800 }, { m: "Ago", e: 51200, s: 36400 },
  { m: "Set", e: 47800, s: 40100 }, { m: "Out", e: 55300, s: 38900 }, { m: "Nov", e: 18400, s: 12600 },
];
const vendas = [
  { m: "Jun", v: 61200 }, { m: "Jul", v: 58400 }, { m: "Ago", v: 72900 },
  { m: "Set", v: 69100 }, { m: "Out", v: 81500 }, { m: "Nov", v: 23700 },
];
const contas = [
  { n: "Conta Principal", b: "Banco do Brasil", s: 48230.55 },
  { n: "Conta Integrada", b: "Asaas", s: 12890.1 },
  { n: "Caixa Interno", b: "Dinheiro", s: 1840 },
];
const agenda = [
  { d: "04/11", h: "14:00", t: "Visita técnica — Metalúrgica Silva" },
  { d: "05/11", h: "09:30", t: "Reunião de orçamento com Construtora Alfa" },
  { d: "07/11", h: "16:00", t: "Entrega de pedido #1482" },
];
const apps = [
  ["Área do Cliente", "Portal para seus clientes"], ["Asaas", "Cobranças e boletos"],
  ["Melhor Envio", "Cotação de fretes"], ["Conta Integrada", "Banco dentro do ERP"],
  ["Criador de Site", "Seu site em minutos"], ["Recursos Humanos", "Gestão de equipe"],
  ["Assinatura Digital", "Contratos assinados online"], ["Agenda Pro", "Agendamentos avançados"],
  ["Indicadores", "KPIs do negócio"], ["MDF-e", "Manifesto eletrônico"], ["Serasa", "Consulta de crédito"],
];
const novidades = [
  { t: "Emissão de NFS-e nacional", d: "Agora compatível com o padrão nacional de notas de serviço.", dt: "01/11/2026" },
  { t: "Novo relatório de margem", d: "Acompanhe a margem de lucro por item e por venda.", dt: "24/10/2026" },
  { t: "Conciliação automática", d: "Extratos bancários conciliados em um clique.", dt: "15/10/2026" },
];

function Dashboard() {
  const [open, setOpen] = useState(true);
  const [show, setShow] = useState(true);
  const [periodo, setPeriodo] = useState("6m");
  const money = (v: number) => (show ? brl(v) : "R$ •••••");
  const totalContas = contas.reduce((a, c) => a + c.s, 0);
  const rec = fluxo.reduce((a, f) => a + f.e, 0);
  const desp = fluxo.reduce((a, f) => a + f.s, 0);
  const totalVendas = vendas.reduce((a, v) => a + v.v, 0);

  const kpis = [
    ["Saldo disponível hoje", totalContas, true],
    ["A receber hoje", 3450.0, false],
    ["A pagar hoje", 1920.4, false],
    ["Recebido no mês", 18400, false],
    ["Pago no mês", 12600, false],
  ] as const;

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <aside className={`${open ? "w-64" : "w-16"} sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all md:flex`}>
        <div className="flex h-16 items-center gap-2 px-4">
          <Shield className="h-7 w-7 shrink-0 text-sidebar-primary" />
          {open && <span className="display text-lg text-sidebar-accent-foreground">Forja ERP</span>}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {menu.map(([Icon, label], i) => (
            <a key={label} href="#" title={label}
              className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${i === 0 ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
              <Icon className="h-4 w-4 shrink-0" />{open && label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card px-4 md:px-8">
          <button onClick={() => setOpen(!open)} aria-label="Expandir ou recolher menu" className="rounded-full p-2 hover:bg-muted"><Menu className="h-5 w-5" /></button>
          <span className="display text-base md:hidden">Forja ERP</span>
          <div className="ml-auto flex items-center gap-1">
            <button aria-label="Aplicativos" className="rounded-full p-2 hover:bg-muted"><LayoutGrid className="h-5 w-5" /></button>
            <button aria-label="Notificações" className="relative rounded-full p-2 hover:bg-muted">
              <Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            </button>
            <button aria-label="Configurações da conta" className="rounded-full p-2 hover:bg-muted"><Settings className="h-5 w-5" /></button>
            <button className="ml-2 flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 hover:bg-muted">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">MS</span>
              <span className="hidden text-sm font-semibold sm:inline">Marina</span><ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="space-y-8 p-4 md:p-8">
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-6">
            <div>
              <p className="eyebrow text-primary">Bom dia</p>
              <h1 className="mt-2 text-sm font-semibold md:text-lg">Olá, Marina. Tudo em ordem por aqui.</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Pill>Nova venda</Pill>
              <button onClick={() => setShow(!show)} className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{show ? "Ocultar valores" : "Mostrar valores"}
              </button>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {kpis.map(([l, v, hl]) => (
              <div key={l} className={`rounded-2xl border p-5 ${hl ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
                <p className={`eyebrow ${hl ? "" : "text-muted-foreground"}`}>{l}</p>
                <p className="display mt-3 text-2xl normal-case">{money(v)}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Panel eyebrow="Financeiro" title="Fluxo de caixa" action={<Periodo v={periodo} on={setPeriodo} />}>
              <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
                <Stat l="Receitas" v={money(rec)} cls="text-success" />
                <Stat l="Despesas" v={money(desp)} cls="text-destructive" />
                <Stat l="Saldo" v={money(rec - desp)} />
              </div>
              <div className="h-60">
                <ResponsiveContainer>
                  <BarChart data={fluxo}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="m" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis hide />
                    <Tooltip formatter={(v: number) => brl(v)} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="e" name="Entradas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="s" name="Saídas" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel eyebrow="Comercial" title="Vendas" action={<Periodo v={periodo} on={setPeriodo} />}>
              <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                <Stat l="Total no período" v={money(totalVendas)} />
                <Stat l="Out vs Set" v="+17,9%" cls="text-success" />
              </div>
              <div className="h-60">
                <ResponsiveContainer>
                  <AreaChart data={vendas}>
                    <defs>
                      <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="var(--chart-1)" stopOpacity={0.5} />
                        <stop offset="1" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="m" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis hide />
                    <Tooltip formatter={(v: number) => brl(v)} />
                    <Area dataKey="v" name="Vendas" stroke="var(--chart-1)" strokeWidth={3} fill="url(#gv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <Panel eyebrow="Bancos" title="Contas bancárias" action={<Pill small>Ver todas</Pill>}>
              <ul className="divide-y">
                {contas.map((c) => (
                  <li key={c.n} className="flex items-center gap-3 py-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"><Landmark className="h-4 w-4" /></span>
                    <div className="flex-1"><p className="font-semibold">{c.n}</p><p className="text-xs text-muted-foreground">{c.b}</p></div>
                    <p className="font-bold">{money(c.s)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between rounded-xl bg-secondary px-4 py-3 text-secondary-foreground">
                <span className="eyebrow self-center">Total</span><span className="font-bold">{money(totalContas)}</span>
              </div>
            </Panel>

            <Panel eyebrow="Agenda" title="Próximos compromissos" action={<Pill small icon={<Plus className="h-3.5 w-3.5" />}>Novo</Pill>}>
              <ul className="space-y-3">
                {agenda.map((a) => (
                  <li key={a.t} className="flex gap-4 rounded-xl border p-3">
                    <div className="w-14 shrink-0 text-center">
                      <p className="display text-lg normal-case">{a.d}</p><p className="text-xs text-muted-foreground">{a.h}</p>
                    </div>
                    <p className="self-center text-sm">{a.t}</p>
                  </li>
                ))}
              </ul>
              <button className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide hover:text-primary">
                <CalendarDays className="h-4 w-4" />Abrir agenda completa
              </button>
            </Panel>

            <Panel eyebrow="Atualizações" title="Novidades" action={<Pill small>Ver todas</Pill>}>
              <ul className="space-y-4">
                {novidades.map((n) => (
                  <li key={n.t} className="border-l-2 border-primary pl-4">
                    <p className="text-xs text-muted-foreground">{n.dt}</p>
                    <p className="font-semibold">{n.t}</p>
                    <p className="text-sm text-muted-foreground">{n.d}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          </section>

          <Panel eyebrow="Integrações" title="Aplicativos">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              {apps.map(([n, d]) => (
                <a key={n} href="#" className="group rounded-xl border p-4 transition-colors hover:border-primary hover:bg-accent">
                  <div className="flex items-start justify-between">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-3 text-sm font-bold">{n}</p>
                  <p className="text-xs text-muted-foreground">{d}</p>
                </a>
              ))}
            </div>
          </Panel>
        </main>
      </div>
    </div>
  );
}

function Panel({ eyebrow, title, action, children }: { eyebrow: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div><p className="eyebrow text-muted-foreground">{eyebrow}</p><h2 className="display mt-2 text-xl">{title}</h2></div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Pill({ children, small, icon }: { children: ReactNode; small?: boolean; icon?: ReactNode }) {
  return (
    <button className={`inline-flex items-center gap-2 rounded-full bg-primary font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5 ${small ? "px-4 py-2 text-[0.68rem]" : "px-5 py-2.5 text-xs"}`}>
      {icon}{children}{!icon && <ArrowUpRight className="h-3.5 w-3.5" />}
    </button>
  );
}

function Stat({ l, v, cls = "" }: { l: string; v: string; cls?: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-xs text-muted-foreground">{l}</p><p className={`font-bold ${cls}`}>{v}</p>
    </div>
  );
}

function Periodo({ v, on }: { v: string; on: (s: string) => void }) {
  return (
    <select value={v} onChange={(e) => on(e.target.value)} className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold">
      <option value="1m">Este mês</option><option value="3m">3 meses</option><option value="6m">6 meses</option><option value="12m">12 meses</option>
    </select>
  );
}
