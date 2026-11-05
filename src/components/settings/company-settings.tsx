"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Clock3, Loader2, Save, CheckCircle2, LockKeyhole } from "lucide-react";
import { useTenant } from "@/lib/tenant/provider";
import { companyApi, days, dayLabels, type CompanySettingsData } from "@/lib/auth/company";
import { ApiError } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
const states =
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
export function CompanySettings() {
  const { tenant, user } = useTenant();
  const router = useRouter();
  const admin = user.role === "admin";
  const [data, setData] = useState<CompanySettingsData | null>(null);
  const [baseline, setBaseline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    companyApi
      .get(tenant.id)
      .then((result) => {
        if (alive) {
          setData(result);
          setBaseline(JSON.stringify(result));
        }
      })
      .catch((e: unknown) => {
        if (alive) {
          setData(null);
          setError(e instanceof Error ? e.message : "Não foi possível carregar os dados.");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tenant.id, revision]);
  function change(key: keyof CompanySettingsData, value: string) {
    setData((current) => (current ? { ...current, [key]: value } : current));
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!data || busy || !admin) return;
    setBusy(true);
    setError("");
    try {
      const saved = await companyApi.save(tenant.id, data);
      setData(saved);
      setBaseline(JSON.stringify(saved));
      setSuccess(true);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace("/login");
        router.refresh();
      } else setError(e instanceof Error ? e.message : "Não foi possível salvar os dados.");
    } finally {
      setBusy(false);
    }
  }
  function field(
    key: keyof Omit<CompanySettingsData, "business_hours" | "company_id">,
    label: string,
    options: { type?: string; maxLength?: number; placeholder?: string; required?: boolean } = {},
  ) {
    return (
      <div className="space-y-2">
        <label htmlFor={`company-${key}`} className="text-sm font-medium">
          {label}
          {options.required && <span className="text-muted-foreground"> *</span>}
        </label>
        <Input
          id={`company-${key}`}
          value={data?.[key] ?? ""}
          onChange={(e) => change(key, e.target.value)}
          className="h-11 rounded-xl"
          {...options}
        />
      </div>
    );
  }
  const dirty = data && JSON.stringify(data) !== baseline;
  if (loading)
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-2xl border p-8 text-sm text-muted-foreground"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando dados da empresa…
      </div>
    );
  if (!data)
    return (
      <div role="alert" className="rounded-2xl border p-6">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4 rounded-xl"
          onClick={() => setRevision((n) => n + 1)}
        >
          Tentar novamente
        </Button>
      </div>
    );
  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Dados da empresa</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Mantenha as informações da sua distribuidora atualizadas.
          </p>
        </div>
        <span className="rounded-full border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
          {admin ? "Acesso de administrador" : "Somente leitura"}
        </span>
      </div>
      {!admin && (
        <p className="flex items-center gap-2 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          <LockKeyhole className="h-4 w-4 shrink-0" />
          Somente administradores podem alterar os dados da empresa.
        </p>
      )}
      <form onSubmit={save} className="space-y-5">
        <fieldset disabled={busy || !admin} className="space-y-5 disabled:opacity-80">
          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center gap-3 border-b px-5 py-4">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Identificação e contato</h3>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              {field("name", "Nome fantasia", {
                required: true,
                maxLength: 160,
                placeholder: "Nome da distribuidora",
              })}
              {field("legal_name", "Razão social", {
                maxLength: 160,
                placeholder: "Razão social da empresa",
              })}
              {field("tax_id", "CNPJ", { maxLength: 18, placeholder: "00.000.000/0000-00" })}
              {field("phone", "Telefone comercial", {
                type: "tel",
                maxLength: 24,
                placeholder: "(11) 3333-4444",
              })}
              <div className="sm:col-span-2">
                {field("email", "E-mail comercial", {
                  type: "email",
                  maxLength: 254,
                  placeholder: "contato@empresa.com.br",
                })}
              </div>
            </div>
          </section>
          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center gap-3 border-b px-5 py-4">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Endereço comercial</h3>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-6">
              <div className="sm:col-span-2">
                {field("postal_code", "CEP", { maxLength: 9, placeholder: "00000-000" })}
              </div>
              <div className="sm:col-span-4">
                {field("street", "Logradouro", { maxLength: 160, placeholder: "Rua ou avenida" })}
              </div>
              <div className="sm:col-span-2">
                {field("number", "Número", { maxLength: 20, placeholder: "Nº ou s/n" })}
              </div>
              <div className="sm:col-span-4">
                {field("complement", "Complemento", {
                  maxLength: 100,
                  placeholder: "Sala, galpão, bloco…",
                })}
              </div>
              <div className="sm:col-span-2">{field("district", "Bairro", { maxLength: 100 })}</div>
              <div className="sm:col-span-3">{field("city", "Cidade", { maxLength: 100 })}</div>
              <div className="space-y-2">
                <label htmlFor="company-state" className="text-sm font-medium">
                  UF
                </label>
                <select
                  id="company-state"
                  value={data.state}
                  onChange={(e) => change("state", e.target.value)}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
                >
                  <option value="">Selecionar</option>
                  {states.map((uf) => (
                    <option key={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center gap-3 border-b px-5 py-4">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Horário de atendimento</h3>
            </div>
            <div className="p-5">
              <div className="mb-5 max-w-sm space-y-2">
                <label htmlFor="company-timezone" className="text-sm font-medium">
                  Fuso horário
                </label>
                <select
                  id="company-timezone"
                  value={data.timezone}
                  onChange={(e) => change("timezone", e.target.value)}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
                >
                  {Array.from(
                    new Set([
                      "America/Sao_Paulo",
                      "America/Manaus",
                      "America/Rio_Branco",
                      "America/Noronha",
                      data.timezone,
                    ]),
                  ).map((zone) => (
                    <option key={zone} value={zone}>
                      {(
                        {
                          "America/Sao_Paulo": "Brasília (UTC−3)",
                          "America/Manaus": "Manaus (UTC−4)",
                          "America/Rio_Branco": "Rio Branco (UTC−5)",
                          "America/Noronha": "Fernando de Noronha (UTC−2)",
                        } as Record<string, string>
                      )[zone] ?? zone}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mb-4 text-xs leading-5 text-muted-foreground">
                Ative os dias de atendimento e informe a abertura e o encerramento no mesmo dia.
              </p>
              <div className="divide-y">
                {days.map((day, index) => {
                  const hours = data.business_hours[day];
                  const updateHours = (changes: Partial<typeof hours>) =>
                    setData((current) =>
                      current
                        ? {
                            ...current,
                            business_hours: {
                              ...current.business_hours,
                              [day]: { ...current.business_hours[day], ...changes },
                            },
                          }
                        : current,
                    );
                  return (
                    <div
                      key={day}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="flex min-w-40 items-center gap-3">
                        <Switch
                          id={`company-day-${day}`}
                          aria-label={`Atendimento ${dayLabels[index]}`}
                          checked={hours.enabled}
                          onCheckedChange={(enabled) =>
                            updateHours({ enabled, opens: null, closes: null })
                          }
                        />
                        <label htmlFor={`company-day-${day}`} className="text-sm">
                          {dayLabels[index]}
                        </label>
                      </div>
                      {hours.enabled ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            aria-label={`Abertura ${dayLabels[index]}`}
                            value={hours.opens ?? ""}
                            onChange={(e) => updateHours({ opens: e.target.value })}
                            required
                            className="h-10 w-32 rounded-xl"
                          />
                          <span className="text-xs text-muted-foreground">às</span>
                          <Input
                            type="time"
                            aria-label={`Encerramento ${dayLabels[index]}`}
                            value={hours.closes ?? ""}
                            min={hours.opens ?? undefined}
                            onChange={(e) => updateHours({ closes: e.target.value })}
                            required
                            className="h-10 w-32 rounded-xl"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem atendimento</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </fieldset>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        {admin && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5">
            <p className="text-xs text-muted-foreground">
              {dirty ? "Você tem alterações não salvas." : "Os dados exibidos estão salvos."}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={busy || !dirty}
                onClick={() => {
                  setData(JSON.parse(baseline) as CompanySettingsData);
                  setError("");
                }}
              >
                Descartar
              </Button>
              <Button type="submit" className="rounded-xl" disabled={busy || !dirty}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {busy ? "Salvando…" : "Salvar alterações"}
              </Button>
            </div>
          </div>
        )}
      </form>
      <AlertDialog open={success} onOpenChange={setSuccess}>
        <AlertDialogContent
          overlayClassName="bg-slate-950/40 backdrop-blur-sm"
          className="max-w-sm rounded-2xl p-7 sm:rounded-2xl"
        >
          <AlertDialogHeader className="items-center text-center sm:text-center">
            <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-600" />
            <AlertDialogTitle>Dados da empresa atualizados</AlertDialogTitle>
            <AlertDialogDescription>
              As informações foram salvas com sucesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="mt-3 w-full rounded-xl">
              Voltar para configurações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
