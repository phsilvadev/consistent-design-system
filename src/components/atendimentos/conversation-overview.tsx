"use client";
import { useEffect, useState } from "react";
import { Activity, UserRound, MessagesSquare, Mail } from "lucide-react";
import { conversationsApi, type ConversationSummary } from "@/lib/auth/conversations";
import { useTenant } from "@/lib/tenant/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/auth/client";
const metrics = [
  { key: "active", label: "Em andamento", icon: Activity },
  { key: "unassigned", label: "Sem responsável", icon: UserRound },
  { key: "unread_conversations", label: "Com registros não lidos", icon: MessagesSquare },
  { key: "unread_messages", label: "Registros não lidos", icon: Mail },
] as const;
export function ConversationOverview() {
  const { tenant } = useTenant();
  const [state, setState] = useState<{
    company: string;
    summary: ConversationSummary | null;
    error: boolean;
  }>({ company: tenant.id, summary: null, error: false });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function refresh() {
      if (!alive || running || document.visibilityState === "hidden") return;
      clearTimeout(timer);
      running = true;
      try {
        const summary = await conversationsApi.summary(tenant.id);
        if (alive) setState({ company: tenant.id, summary, error: false });
      } catch (e) {
        if (alive) {
          setState({ company: tenant.id, summary: null, error: true });
          if (e instanceof ApiError && e.status === 401) window.location.replace("/login");
        }
      } finally {
        running = false;
        if (alive) timer = setTimeout(() => void refresh(), 5000);
      }
    }
    void refresh();
    const visible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [tenant.id, revision]);
  const summary = state.company === tenant.id ? state.summary : null;
  const error = state.company === tenant.id && state.error;
  return (
    <section aria-label="Resumo da central" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Central de atendimentos</h2>
        <p className="text-xs text-muted-foreground">Situação atual · atualização automática</p>
      </div>
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm"
        >
          <p>Não foi possível atualizar os indicadores da central.</p>
          <Button size="sm" variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ key, label, icon: Icon }) => (
          <div data-ui-panel key={key} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{label}</p>
              <span className="rounded-xl bg-accent p-2.5 text-primary">
                <Icon className="h-5 w-5" />
              </span>
            </div>
            {summary ? (
              <p
                className="display mt-3 text-4xl tabular-nums"
                aria-label={`${label}: ${summary[key]}`}
              >
                {summary[key]}
              </p>
            ) : error ? (
              <p className="mt-3 text-4xl text-muted-foreground">—</p>
            ) : (
              <Skeleton
                aria-label={`Carregando ${label.toLowerCase()}`}
                className="mt-3 h-10 w-16"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
