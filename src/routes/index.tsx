import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Home,
  Users,
  Package,
  FileText,
  Headphones,
  BarChart3,
  Settings,
  Menu,
  Bell,
  LayoutGrid,
  ArrowUpRight,
  Plus,
  ChevronDown,
  Shield,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Forja ERP" },
      {
        name: "description",
        content: "Resumo comercial da Aço Moreira: atendimentos, orçamentos, vendas e clientes.",
      },
      { property: "og:title", content: "Início — Forja ERP" },
      {
        property: "og:description",
        content: "Indicadores de atendimento e conversão comercial da Aço Moreira.",
      },
    ],
  }),
  component: Dashboard,
});

const menu = [
  [Home, "Dashboard (início)"],
  [Headphones, "Atendimentos"],
  [FileText, "Orçamentos"],
  [Users, "Clientes"],
  [Package, "Produtos"],
  [BarChart3, "Relatórios"],
  [Settings, "Configurações"],
] as const;

const statuses = [
  { name: "Em atendimento", value: 12, percent: "10%", color: "#3b82f6" },
  { name: "Aguardando cliente", value: 18, percent: "14%", color: "#f59e0b" },
  { name: "Em orçamento", value: 24, percent: "19%", color: "#8b5cf6" },
  { name: "Convertido em venda", value: 28, percent: "22%", color: "#16a34a" },
  { name: "Encerrado", value: 44, percent: "35%", color: "#94a3b8" },
];
const conversion = [
  { date: "27/out", value: 16.8 },
  { date: "28/out", value: 18.2 },
  { date: "29/out", value: 17.6 },
  { date: "30/out", value: 20.1 },
  { date: "31/out", value: 19.4 },
  { date: "01/nov", value: 21 },
  { date: "02/nov", value: 22.2 },
];
const conversations = [
  {
    client: "Construtora Vale",
    message: "Vocês têm vergalhão de 12 mm?",
    status: 2,
    time: "Há 5 min",
  },
  {
    client: "JR Obras",
    message: "Preciso de 20 barras de metalon 30x30...",
    status: 0,
    time: "Há 8 min",
  },
  {
    client: "M&S Estruturas",
    message: "Qual o preço da chapa 3 mm?",
    status: 1,
    time: "Há 16 min",
  },
  {
    client: "Casa do Serralheiro",
    message: "Tem cantoneira 1” x 1/8” em estoque?",
    status: 4,
    time: "Há 28 min",
  },
];
const products = [
  { name: "Metalon 30x30 Chapa 18", count: 26 },
  { name: "Vergalhão CA-50 12 mm", count: 21 },
  { name: "Chapa 3 mm (1,20 x 3,00 m)", count: 18 },
  { name: "Cantoneira 1” x 1/8”", count: 14 },
];
const kpis = [
  { label: "Atendimentos", value: 126, change: "+18%", icon: Headphones },
  { label: "Orçamentos", value: 42, change: "+24%", icon: FileText },
  { label: "Vendas convertidas", value: 28, change: "+21%", icon: ShoppingCart },
  { label: "Novos clientes", value: 7, change: "+40%", icon: Users },
];

function Dashboard() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <aside
        className={`${open ? "w-64" : "w-16"} sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all md:flex`}
      >
        <div className="flex h-16 items-center gap-2 px-4">
          <Shield className="h-7 w-7 shrink-0 text-sidebar-primary" />
          {open && (
            <span className="display text-lg text-sidebar-accent-foreground">Forja ERP</span>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {menu.map(([Icon, label], i) => (
            <a
              key={label}
              href="#"
              title={label}
              className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${i === 0 ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {open && label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card px-4 md:px-8">
          <button
            onClick={() => setOpen(!open)}
            aria-label="Expandir ou recolher menu"
            className="rounded-full p-2 hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="display text-base md:hidden">Forja ERP</span>
          <div className="ml-auto flex items-center gap-1">
            <button aria-label="Aplicativos" className="rounded-full p-2 hover:bg-muted">
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button aria-label="Notificações" className="relative rounded-full p-2 hover:bg-muted">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            </button>
            <button aria-label="Configurações da conta" className="rounded-full p-2 hover:bg-muted">
              <Settings className="h-5 w-5" />
            </button>
            <button className="ml-2 flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 hover:bg-muted">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                MS
              </span>
              <span className="hidden text-sm font-semibold sm:inline">Marina</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="space-y-6 p-4 md:p-8">
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-6">
            <div>
              <p className="eyebrow text-primary">Visão geral comercial</p>
              <h1 className="display mt-2 text-2xl md:text-3xl">Olá, Pedro!</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Aqui está o resumo do atendimento da Aço Moreira hoje.
              </p>
            </div>
            <Pill icon={<Plus className="h-4 w-4" />}>Novo atendimento</Pill>
          </section>

          <section
            aria-label="Indicadores principais"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {kpis.map(({ label, value, change, icon: Icon }) => (
              <div key={label} className="rounded-2xl border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{label}</p>
                  <span className="rounded-xl bg-accent p-2.5 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="display mt-3 text-4xl tabular-nums">{value}</p>
                <p className="mt-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center font-bold text-success">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {change}
                  </span>{" "}
                  em relação a ontem
                </p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Panel eyebrow="Atendimentos" title="Atendimentos por status">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div
                  className="relative h-56 w-56 shrink-0"
                  role="img"
                  aria-label="126 atendimentos: 12 em atendimento, 18 aguardando cliente, 24 em orçamento, 28 convertidos em venda e 44 encerrados"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statuses}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={76}
                        outerRadius={100}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {statuses.map((status) => (
                          <Cell key={status.name} fill={status.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="display text-4xl">126</span>
                    <span className="text-xs text-muted-foreground">atendimentos</span>
                  </div>
                </div>
                <ul className="w-full space-y-4 text-sm">
                  {statuses.map((status) => (
                    <li key={status.name} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="flex-1">{status.name}</span>
                      <span className="font-bold tabular-nums">{status.value}</span>
                      <span className="w-9 text-right text-xs text-muted-foreground">
                        {status.percent}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>

            <Panel eyebrow="Desempenho comercial" title="Conversão de atendimentos">
              <div className="mb-5 flex flex-wrap items-baseline gap-3">
                <span className="display text-4xl">22,2%</span>
                <span className="inline-flex items-center text-sm font-bold text-success">
                  <ArrowUpRight className="h-4 w-4" />
                  +3,1 pontos percentuais
                </span>
              </div>
              <div
                className="h-48"
                role="img"
                aria-label="Evolução demonstrativa da conversão de 27 de outubro a 2 de novembro, terminando em 22,2%"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={conversion} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="conversion-green" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#16a34a" stopOpacity={0.3} />
                        <stop offset="1" stopColor="#16a34a" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      fontSize={11}
                      tickMargin={10}
                      minTickGap={12}
                    />
                    <YAxis hide domain={[0, 30]} />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString("pt-BR")}%`} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Conversão"
                      stroke="#16a34a"
                      strokeWidth={3}
                      fill="url(#conversion-green)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">27/out a 02/nov</p>
            </Panel>
          </section>

          <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Panel
              eyebrow="WhatsApp"
              title="Últimos atendimentos"
              action={<Pill small>Ver todos</Pill>}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="border-b text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="pb-3 pr-4 font-semibold">
                        Cliente / Última mensagem
                      </th>
                      <th scope="col" className="pb-3 pr-4 font-semibold">
                        Status
                      </th>
                      <th scope="col" className="pb-3 font-semibold">
                        Tempo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {conversations.map((conversation) => {
                      const status = statuses[conversation.status]!;
                      return (
                        <tr key={conversation.client}>
                          <td className="py-4 pr-4">
                            <div className="flex items-start gap-3">
                              <span className="rounded-full bg-success/10 p-2 text-success">
                                <MessageCircle className="h-4 w-4" aria-label="WhatsApp" />
                              </span>
                              <div>
                                <p className="font-bold">{conversation.client}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {conversation.message}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                              {status.name}
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-4 text-xs text-muted-foreground">
                            {conversation.time}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel eyebrow="Interesse dos clientes" title="Produtos mais consultados">
              <ol className="divide-y">
                {products.map((product, index) => (
                  <li
                    key={product.name}
                    className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{product.name}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(product.count / 26) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums">{product.count}</p>
                      <p className="text-xs text-muted-foreground">consultas</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          </section>
          <p className="text-xs text-muted-foreground">
            Dados demonstrativos. Na aplicação real, os dados serão atualizados pelas integrações e
            registros do sistema.
          </p>
        </main>
      </div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-muted-foreground">{eyebrow}</p>
          <h2 className="display mt-2 text-xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Pill({
  children,
  small,
  icon,
}: {
  children: ReactNode;
  small?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-full bg-primary font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5 ${small ? "px-4 py-2 text-[0.68rem]" : "px-5 py-2.5 text-xs"}`}
    >
      {icon}
      {children}
      {!icon && <ArrowUpRight className="h-3.5 w-3.5" />}
    </button>
  );
}
