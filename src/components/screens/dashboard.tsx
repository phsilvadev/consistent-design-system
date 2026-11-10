"use client";

import { ConversationOverview } from "@/components/atendimentos/conversation-overview";
import { ProfileMenu } from "@/components/auth/profile-menu";
import { TrialBanner } from "@/components/auth/trial-banner";
import { PlanSettings } from "@/components/settings/plan-settings";
import { CompanySettings } from "@/components/settings/company-settings";
import { TeamSettings } from "@/components/settings/team-settings";
import { SupportChat } from "@/components/support/support-chat";
import { CustomAppearanceEditor } from "@/components/appearance/custom-appearance-editor";
import { type Appearance } from "@/hooks/use-interface-appearance";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import Link from "next/link";
import { useTenant, useTenantAppearance } from "@/lib/tenant/provider";
import { useState, type ReactNode } from "react";
import {
  CircleHelp,
  CreditCard,
  Building2,
  ArrowUpRight,
  Plus,
  ShoppingCart,
  Home,
  Plug,
  Users,
  Package,
  FileText,
  Headphones,
  BarChart3,
  Settings,
  Menu,
  Bell,
  LayoutGrid,
  MessageCircle,
  Palette,
  Check,
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

import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const menu = [
  [Home, "Dashboard (início)"],
  [Headphones, "Atendimentos"],
  [FileText, "Orçamentos"],
  [Users, "Clientes"],
  [Package, "Produtos"],
  [BarChart3, "Relatórios"],
  [Plug, "Integrações"],
  [Settings, "Configurações"],
] as const;

const statuses = [
  { name: "Em atendimento", value: 12, percent: "10%", color: "var(--custom-chart-1, #3b82f6)" },
  {
    name: "Aguardando cliente",
    value: 18,
    percent: "14%",
    color: "var(--custom-chart-2, #f59e0b)",
  },
  { name: "Em orçamento", value: 24, percent: "19%", color: "var(--custom-chart-3, #8b5cf6)" },
  {
    name: "Convertido em venda",
    value: 28,
    percent: "22%",
    color: "var(--custom-chart-4, #16a34a)",
  },
  { name: "Encerrado", value: 44, percent: "35%", color: "var(--custom-chart-5, #94a3b8)" },
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

export function Dashboard({
  settings = false,
  children,
  activePage,
}: {
  settings?: boolean;
  children?: ReactNode;
  activePage?: string;
}) {
  const { tenant, user, href, trialEndsAt } = useTenant();
  const [open, setOpen] = useState(true);
  const [teamCount, setTeamCount] = useState<number | null>(null);
  const {
    appearance,
    custom,
    changeAppearance,
    changeCustom,
    resetCustom,
    storageState,
    style,
    logoWhite,
  } = useTenantAppearance();
  const clean = appearance === "clean";

  return (
    <div
      data-appearance={appearance}
      style={style}
      className="flex min-h-screen bg-background font-sans text-foreground"
    >
      <aside
        data-app-sidebar
        data-expanded={open}
        className={`${open ? "w-64" : "w-16"} sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all md:flex`}
      >
        <div className={`flex h-16 items-center ${open ? "px-4" : "justify-center"}`}>
          <Link
            href={href()}
            className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            aria-label="AtendeHUB — início"
          >
            {open ? <BrandLogo white={logoWhite} /> : <BrandMark white={logoWhite} />}
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {menu.map(([Icon, label], i) => (
            <Link
              key={label}
              data-sidebar-item
              href={href(
                label === "Integrações"
                  ? "/integracoes"
                  : label === "Configurações"
                    ? "/configuracoes"
                    : label === "Atendimentos"
                      ? "/atendimentos"
                      : label === "Orçamentos"
                        ? "/orcamentos"
                        : label === "Clientes"
                          ? "/clientes"
                          : label === "Produtos"
                            ? "/produtos"
                            : label === "Relatórios"
                              ? "/relatorios"
                              : "/",
              )}
              aria-current={
                (activePage ? label === activePage : settings ? label === "Configurações" : i === 0)
                  ? "page"
                  : undefined
              }
              title={label}
              className={`flex items-center text-sm font-semibold transition-colors ${open ? "w-full gap-3 rounded-full px-3 py-2 text-left" : "mx-auto h-10 w-10 justify-center rounded-xl p-0"} ${(activePage ? label === activePage : settings ? label === "Configurações" : i === 0) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {open && label}
            </Link>
          ))}
        </nav>
        <div className="shrink-0 border-t border-sidebar-border px-2 py-4">
          <Link
            data-sidebar-item
            href={href("/ajuda")}
            title="Ajuda e suporte"
            aria-label="Ajuda e suporte"
            aria-current={activePage === "Ajuda e suporte" ? "page" : undefined}
            className={`flex items-center text-sm font-semibold transition-colors ${open ? "gap-3 rounded-full px-3 py-2" : "mx-auto h-10 w-10 justify-center rounded-xl"} ${activePage === "Ajuda e suporte" ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
          >
            <CircleHelp className="h-4 w-4 shrink-0" />
            {open && "Ajuda e suporte"}
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TrialBanner endsAt={trialEndsAt} plansHref={href("/configuracoes")} />
        <header
          data-app-header
          className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card px-4 md:px-8"
        >
          <button
            onClick={() => setOpen(!open)}
            aria-label="Expandir ou recolher menu"
            className="rounded-full p-2 hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="display text-base md:hidden">AtendeHUB</span>
          <div className="ml-auto flex items-center gap-1">
            <button aria-label="Aplicativos" className="rounded-full p-2 hover:bg-muted">
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button aria-label="Notificações" className="relative rounded-full p-2 hover:bg-muted">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            </button>
            <Link
              href={href("/configuracoes")}
              aria-label="Configurações da conta"
              className="rounded-full p-2 hover:bg-muted"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <ProfileMenu />
          </div>
        </header>

        {children ? (
          children
        ) : settings ? (
          <main className="space-y-6 p-4 md:p-8">
            <div>
              <h1 className="text-2xl font-semibold">Configurações</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Gerencie sua empresa, os acessos da equipe e a aparência do sistema.
              </p>
            </div>
            <Tabs defaultValue="team" className="w-full">
              <TabsList
                aria-label="Categorias de configurações"
                className="h-auto w-full flex-wrap justify-start gap-y-2 rounded-none border-b bg-transparent p-0"
              >
                <TabsTrigger
                  value="team"
                  className="mr-6 gap-2 rounded-none border-b-2 border-transparent px-1 pb-4 pt-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Users className="h-4 w-4" />
                  Equipe
                  {user.role === "admin" && (
                    <span
                      aria-label={`Quantidade de usuários: ${teamCount === null ? "indisponível" : teamCount}`}
                      className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
                    >
                      {teamCount === null ? "—" : teamCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="company"
                  className="mr-6 gap-2 rounded-none border-b-2 border-transparent px-1 pb-4 pt-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Building2 className="h-4 w-4" />
                  Empresa
                </TabsTrigger>
                <TabsTrigger
                  value="plans"
                  className="mr-6 gap-2 rounded-none border-b-2 border-transparent px-1 pb-4 pt-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <CreditCard className="h-4 w-4" />
                  Planos
                </TabsTrigger>
                <TabsTrigger
                  value="appearance"
                  className="gap-2 rounded-none border-b-2 border-transparent px-1 pb-4 pt-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Palette className="h-4 w-4" /> Aparência
                </TabsTrigger>
              </TabsList>
              <TabsContent value="team" className="mt-0 pt-7">
                <TeamSettings onCountChange={setTeamCount} />
              </TabsContent>
              <TabsContent value="company" className="mt-0 pt-7">
                <CompanySettings />
              </TabsContent>
              <TabsContent value="plans" className="mt-0 pt-7">
                <PlanSettings />
              </TabsContent>
              <TabsContent value="appearance" className="mt-0 pt-8">
                <section className="max-w-[960px] space-y-6">
                  <div>
                    <h2 className="text-base font-semibold">Estilo da interface</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Escolha o visual que combina com sua rotina de trabalho.
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-2xl border bg-card">
                    <div className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
                      {(["normal", "clean", "custom"] as Appearance[]).map((mode) => {
                        const isClean = mode === "clean";
                        const isCustom = mode === "custom";
                        return (
                          <button
                            key={mode}
                            data-appearance-option
                            type="button"
                            aria-pressed={appearance === mode}
                            onClick={() => changeAppearance(mode)}
                            className={`group rounded-xl border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${appearance === mode ? "border-primary" : "border-border hover:border-muted-foreground/40"}`}
                          >
                            <div
                              aria-hidden="true"
                              className="flex h-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                            >
                              <div
                                className={`w-1/4 space-y-2 border-r p-2 ${isClean ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-800"}`}
                                style={
                                  isCustom
                                    ? {
                                        backgroundColor: custom.sidebar,
                                        borderColor: custom.sidebar,
                                      }
                                    : undefined
                                }
                              >
                                <div
                                  className={`mb-4 h-2 w-4 rounded ${isClean ? "bg-slate-400" : "bg-amber-400"}`}
                                />
                                {[0, 1, 2, 3].map((item) => (
                                  <div
                                    key={item}
                                    className={`h-1.5 rounded ${item === 0 ? (isClean ? "bg-slate-300" : "bg-amber-400") : isClean ? "bg-slate-100" : "bg-slate-600"}`}
                                  />
                                ))}
                              </div>
                              <div
                                className="flex-1 space-y-3 p-3"
                                style={
                                  isCustom ? { backgroundColor: custom.background } : undefined
                                }
                              >
                                <div className="h-2 w-2/3 rounded bg-slate-300" />
                                <div className="grid grid-cols-3 gap-1.5">
                                  {[0, 1, 2].map((item) => (
                                    <div
                                      key={item}
                                      className="h-6 rounded border border-slate-200 bg-white"
                                      style={
                                        isCustom
                                          ? {
                                              backgroundColor: custom.card,
                                              borderColor: custom.border,
                                              borderRadius: `${custom.radius / 3}px`,
                                            }
                                          : undefined
                                      }
                                    />
                                  ))}
                                </div>
                                <div className="flex h-10 items-end gap-1 rounded border border-slate-200 bg-white px-2 pb-1.5">
                                  {[35, 60, 45, 80, 65, 100].map((height, index) => (
                                    <span
                                      key={index}
                                      className={`flex-1 rounded-t-sm ${isClean ? "bg-slate-300" : "bg-amber-300"}`}
                                      style={{
                                        height: `${height}%`,
                                        ...(isCustom ? { backgroundColor: custom.primary } : {}),
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold">
                                {isCustom ? "Personalizado" : isClean ? "Clean" : "Normal"}
                              </span>
                              <span
                                className={`flex h-4 w-4 items-center justify-center rounded-full border ${appearance === mode ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}
                              >
                                {appearance === mode && <Check className="h-3 w-3" />}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {isCustom
                                ? "Suas cores e seu estilo"
                                : isClean
                                  ? "Claro, suave e minimalista"
                                  : "Menu escuro e cores marcantes"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    {appearance === "custom" && (
                      <CustomAppearanceEditor
                        value={custom}
                        onChange={changeCustom}
                        onReset={resetCustom}
                        storageState={storageState}
                      />
                    )}
                    <div className="flex items-center justify-between gap-6 border-t px-5 py-5 sm:px-6">
                      <div>
                        <label
                          htmlFor="clean-appearance"
                          className="cursor-pointer text-sm font-semibold"
                        >
                          Modo clean
                        </label>
                        <p
                          id="clean-description"
                          className="mt-1 text-xs leading-relaxed text-muted-foreground"
                        >
                          A alteração é aplicada na hora e salva neste navegador.
                        </p>
                      </div>
                      <Switch
                        id="clean-appearance"
                        aria-describedby="clean-description"
                        checked={clean}
                        onCheckedChange={(checked) =>
                          changeAppearance(checked ? "clean" : "normal")
                        }
                      />
                    </div>
                  </div>
                </section>
              </TabsContent>
            </Tabs>
          </main>
        ) : (
          <main className="space-y-6 p-4 md:p-8">
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-6">
              <div>
                <p className="eyebrow text-primary">Visão geral comercial</p>
                <h1 className="display mt-2 text-2xl md:text-3xl">Olá, {user.name}!</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Aqui está o resumo do atendimento de {tenant.name} hoje.
                </p>
              </div>
              <Pill href={href("/atendimentos")} icon={<Plus className="h-4 w-4" />}>
                Novo atendimento
              </Pill>
            </section>

            <section
              aria-label="Indicadores principais"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              {kpis.map(({ label, value, change, icon: Icon }) => (
                <div data-ui-panel key={label} className="rounded-2xl border bg-card p-5">
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

            <ConversationOverview />

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
                  aria-label="Evolução da conversão de 27 de outubro a 2 de novembro, terminando em 22,2%"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={conversion} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="conversion-green" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0"
                            stopColor="var(--custom-success, #16a34a)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="1"
                            stopColor="var(--custom-success, #16a34a)"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--border)"
                        strokeDasharray="4 4"
                      />
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
                        stroke="var(--custom-success, #16a34a)"
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
                action={
                  <Pill href={href("/atendimentos")} small>
                    Ver todos
                  </Pill>
                }
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
          </main>
        )}
      </div>
      <SupportChat key={`${tenant.id}:${user.id}`} />
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
    <div data-ui-panel className="rounded-2xl border bg-card p-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{eyebrow}</p>
          <h2 className="display mt-2 text-xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Pill({
  href,
  children,
  small,
  icon,
}: {
  href: string;
  children: ReactNode;
  small?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full bg-primary font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5 ${small ? "px-4 py-2 text-[0.68rem]" : "px-5 py-2.5 text-xs"}`}
    >
      {icon}
      {children}
      {!icon && <ArrowUpRight className="h-3.5 w-3.5" />}
    </Link>
  );
}
