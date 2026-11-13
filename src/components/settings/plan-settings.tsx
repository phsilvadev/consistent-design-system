"use client";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CreditCard,
  Layers3,
  Sparkles,
  Users,
  Building2,
  Clock3,
} from "lucide-react";
import { useTenant } from "@/lib/tenant/provider";
import {
  getSubscription,
  planPrice,
  type Plan,
  subscriptionDate,
  type Subscription,
} from "@/lib/auth/subscription";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
const icons: Record<string, typeof Layers3> = {
  essential: Layers3,
  professional: Sparkles,
  enterprise: Building2,
};
export function PlansSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando planos"
      aria-busy="true"
      className="max-w-5xl space-y-8"
    >
      <span className="sr-only">Carregando seu plano e opções de upgrade…</span>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div aria-hidden="true" className="space-y-5 rounded-2xl border p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-44" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-2 w-full" />
      </div>
      <div aria-hidden="true" className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-5 rounded-2xl border p-6">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-36" />
            {[1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="h-3 w-full" />
            ))}
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
export function PlanSettings() {
  const { tenant, user } = useTenant();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<Plan | null>(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    getSubscription(tenant.id)
      .then((result) => {
        if (alive) setSubscription(result);
      })
      .catch((e: unknown) => {
        if (alive) {
          setSubscription(null);
          setError(e instanceof Error ? e.message : "Não foi possível carregar a assinatura.");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tenant.id, revision]);
  if (loading) return <PlansSkeleton />;
  if (!subscription)
    return (
      <div role="alert" className="rounded-2xl border p-6">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4 rounded-xl"
          onClick={() => setRevision((v) => v + 1)}
        >
          Tentar novamente
        </Button>
      </div>
    );
  const trial = subscription.plan_code === "trial";
  const expired = subscription.status === "trial_expired";
  const duration =
    trial && subscription.trial_ends_at !== null && subscription.trial_started_at !== null
      ? Math.max(1, subscription.trial_ends_at - subscription.trial_started_at)
      : 1;
  const remaining =
    trial && subscription.trial_ends_at !== null
      ? Math.max(
          0,
          Math.min(100, ((subscription.trial_ends_at - Date.now() / 1000) / duration) * 100),
        )
      : 0;
  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h2 className="text-base font-semibold">Seu plano e assinatura</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Acompanhe seu acesso e conheça as opções para sua empresa.
        </p>
      </div>
      <section
        aria-label="Plano atual"
        className="overflow-hidden rounded-3xl border bg-card p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CreditCard className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Plano atual de {tenant.name}</p>
              <h3 className="mt-1 text-lg font-semibold">{subscription.plan_name}</h3>
              {subscription.current_plan && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {planPrice(subscription.current_plan)} /mês · até{" "}
                  {subscription.current_plan.user_limit} usuários
                </p>
              )}
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${expired ? "bg-destructive/10 text-destructive" : trial ? "bg-[#f0e6e0] text-foreground" : "bg-emerald-50 text-emerald-700"}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${expired ? "bg-destructive" : trial ? "bg-[#9a5135]" : "bg-emerald-500"}`}
            />
            {expired ? "Teste encerrado" : trial ? "Teste em andamento" : "Ativo"}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[20px] border p-4">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {trial ? "Início do teste" : "Assinatura"}
            </p>
            <p className="mt-2 text-sm font-medium">
              {trial && subscription.trial_started_at !== null
                ? subscriptionDate(subscription.trial_started_at)
                : "Plano da empresa"}
            </p>
          </div>
          <div className="rounded-[20px] border p-4">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              {trial ? "Fim do teste" : "Próxima cobrança"}
            </p>
            <p className="mt-2 text-sm font-medium">
              {trial && subscription.trial_ends_at !== null
                ? subscriptionDate(subscription.trial_ends_at)
                : "Não informada"}
            </p>
          </div>
          <div className="rounded-[20px] border p-4">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Usuários da empresa
            </p>
            <p className="mt-2 text-sm font-medium">
              {subscription.total_users}{" "}
              {subscription.total_users === 1 ? "cadastrado" : "cadastrados"}{" "}
              <span className="font-normal text-muted-foreground">
                · {subscription.active_users} {subscription.active_users === 1 ? "ativo" : "ativos"}
              </span>
            </p>
          </div>
        </div>
        {trial && (
          <div className="mt-5 rounded-[20px] bg-[#f7f6f5] p-4 text-foreground">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                {expired
                  ? "Seu período de avaliação terminou."
                  : `${subscription.trial_days_remaining} ${subscription.trial_days_remaining === 1 ? "dia restante" : "dias restantes"} para conhecer a plataforma`}
              </span>
              <span className="text-xs text-muted-foreground">Sem cobrança automática</span>
            </div>
            <div
              role="progressbar"
              aria-label="Tempo restante de teste"
              aria-valuenow={Math.round(remaining)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-[#ed7514]"
                style={{ width: `${remaining}%` }}
              />
            </div>
          </div>
        )}
      </section>
      {subscription.available_plans.some((plan) => plan.is_demo) && (
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs leading-5 text-muted-foreground">
          Catálogo de desenvolvimento: preços, limites e recursos são fictícios para avaliação. Não
          representam uma oferta comercial nem habilitam recursos adicionais.
        </p>
      )}
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Encontre o próximo passo para sua empresa</h3>
            <p className="mt-2 text-sm text-muted-foreground">Compare as opções de plano.</p>
          </div>
          <span className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
            Cobrança mensal
          </span>
        </div>
        {subscription.available_plans.length === 0 && (
          <p className="rounded-2xl border p-6 text-sm text-muted-foreground">
            Nenhum plano disponível para upgrade no momento.
          </p>
        )}
        <div className="grid gap-4 lg:grid-cols-3">
          {subscription.available_plans.map((plan) => {
            const Icon = icons[plan.code] ?? Layers3;
            const current = subscription.plan_code === plan.code;
            return (
              <article
                key={plan.code}
                className={`flex flex-col rounded-2xl border bg-card p-6 ${current ? "border-primary shadow-sm" : ""}`}
              >
                <div className="mb-5 flex items-center justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/30">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </span>
                  {current && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium">
                      Seu plano
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-semibold">{plan.name}</h4>
                <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">
                  {plan.description}
                </p>
                <div className="my-6">
                  <p className="text-2xl font-semibold tracking-tight">
                    {planPrice(plan)}
                    <span className="text-sm font-normal text-muted-foreground"> /mês</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Até {plan.user_limit} usuários
                  </p>
                </div>
                <ul className="mb-6 space-y-3">
                  {plan.features.map((item) => (
                    <li key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={current ? "outline" : "default"}
                  disabled={current || user.role !== "admin"}
                  className="mt-auto w-full rounded-xl"
                  onClick={() => setSelected(plan)}
                >
                  {current ? (
                    <>
                      <BadgeCheck className="h-4 w-4" />
                      Plano atual
                    </>
                  ) : (
                    <>
                      Ver opções de upgrade
                      <ArrowUpRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </article>
            );
          })}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          {user.role !== "admin"
            ? "Somente administradores podem gerenciar o plano da empresa. "
            : ""}
          A contratação ainda não está disponível; nenhum valor será cobrado nesta etapa.
        </p>
      </div>
      <Dialog
        open={selected !== null}
        onOpenChange={(next) => {
          if (!next) setSelected(null);
        }}
      >
        <DialogContent className="rounded-2xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>Plano {selected?.name}</DialogTitle>
            <DialogDescription>Uma opção para a próxima etapa de {tenant.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <p className="text-sm font-medium">Contratação ainda indisponível</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {selected && (
                <>
                  {planPrice(selected)} por mês · até {selected.user_limit} usuários.{" "}
                </>
              )}
              O fluxo de pagamento ainda não está habilitado. Seu plano atual permanece{" "}
              {subscription.plan_name.toLowerCase()}.
            </p>
          </div>
          <DialogFooter>
            <Button className="rounded-xl" onClick={() => setSelected(null)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
