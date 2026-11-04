"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, RefreshCw, LockKeyhole, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useTenant } from "@/lib/tenant/provider";
import { teamApi, roleLabels, type TeamUser, type TeamRole } from "@/lib/auth/team";
import { ApiError } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
const roles = Object.entries(roleLabels) as [TeamRole, string][];
export function TeamSettings({ onCountChange }: { onCountChange: (count: number | null) => void }) {
  const { tenant, user } = useTenant();
  const router = useRouter();
  const admin = user.role === "admin";
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    let alive = true;
    onCountChange(null);
    setError("");
    setLoading(true);
    if (!admin) {
      setUsers([]);
      setLoading(false);
      return () => {
        alive = false;
      };
    }
    teamApi
      .list(tenant.id)
      .then((result) => {
        if (alive) {
          setUsers(result);
          onCountChange(result.length);
        }
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setUsers([]);
        onCountChange(null);
        if (e instanceof ApiError && e.status === 401) {
          router.replace("/login");
          router.refresh();
        } else setError(e instanceof Error ? e.message : "Não foi possível carregar a equipe.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tenant.id, admin, revision, onCountChange, router]);
  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !admin) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setFormError("");
    try {
      await teamApi.create(tenant.id, {
        name: String(form.get("name") || "").trim(),
        email: String(form.get("email") || "").trim(),
        password: String(form.get("password") || ""),
        role: String(form.get("role")) as TeamRole,
      });
      setOpen(false);
      setNotice("Usuário cadastrado. O acesso já está disponível; nenhum e-mail foi enviado.");
      setRevision((value) => value + 1);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace("/login");
        router.refresh();
      } else setFormError(e instanceof Error ? e.message : "Não foi possível cadastrar o usuário.");
    } finally {
      setBusy(false);
    }
  }
  if (!admin)
    return (
      <section className="rounded-2xl border bg-card px-6 py-12 text-center">
        <LockKeyhole className="mx-auto mb-4 h-7 w-7 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Acesso restrito ao administrador</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Seu perfil é {roleLabels[user.role].toLowerCase()}. Somente administradores podem
          consultar e cadastrar usuários da empresa.
        </p>
      </section>
    );
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Usuários da empresa</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerencie os acessos de {tenant.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            disabled={loading}
            onClick={() => setRevision((value) => value + 1)}
            aria-label="Atualizar equipe"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog
            open={open}
            onOpenChange={(next) => {
              if (busy) return;
              setOpen(next);
              if (next) {
                setFormError("");
                setShowPassword(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="rounded-full px-5 font-semibold">
                <Plus className="h-4 w-4" />
                Adicionar usuário
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-h-[90svh] overflow-y-auto rounded-2xl"
              style={{ maxWidth: "min(32rem, calc(100vw - 2rem))" }}
            >
              <DialogHeader>
                <DialogTitle>Adicionar usuário</DialogTitle>
                <DialogDescription>Crie um acesso para {tenant.name}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={createUser} className="space-y-4">
                <fieldset disabled={busy} className="space-y-4">
                  <div>
                    <label htmlFor="team-name" className="text-sm font-medium">
                      Nome completo
                    </label>
                    <Input
                      id="team-name"
                      name="name"
                      minLength={2}
                      maxLength={120}
                      required
                      autoComplete="off"
                      placeholder="Nome do usuário"
                      className="mt-2 h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label htmlFor="team-email" className="text-sm font-medium">
                      E-mail
                    </label>
                    <Input
                      id="team-email"
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="off"
                      placeholder="nome@empresa.com.br"
                      className="mt-2 h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label htmlFor="team-role" className="text-sm font-medium">
                      Perfil de acesso
                    </label>
                    <select
                      id="team-role"
                      name="role"
                      defaultValue="seller"
                      className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {roles.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Administradores também podem cadastrar outros usuários.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="team-password" className="text-sm font-medium">
                      Senha inicial
                    </label>
                    <div className="relative mt-2">
                      <Input
                        id="team-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        minLength={8}
                        maxLength={128}
                        required
                        autoComplete="new-password"
                        placeholder="Pelo menos 8 caracteres"
                        className="h-11 rounded-xl pr-11"
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Ocultar senha inicial" : "Mostrar senha inicial"
                        }
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-1 rounded-lg p-2.5 text-muted-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Compartilhe as credenciais de forma segura. Não será enviado um convite por
                      e-mail.
                    </p>
                  </div>
                </fieldset>
                {formError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    {formError}
                  </p>
                )}
                <DialogFooter className="gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setOpen(false)}
                    className="rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={busy} className="rounded-xl">
                    {busy ? "Cadastrando…" : "Cadastrar usuário"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {notice && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {notice}
        </p>
      )}
      {error ? (
        <div role="alert" className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={() => setRevision((value) => value + 1)}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b bg-muted/30 text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Usuário</th>
                  <th className="px-6 py-4 font-medium">Perfil de acesso</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                      <span role="status">Carregando equipe…</span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  users.map((member) => (
                    <tr key={member.id} className="hover:bg-muted/15">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted/40 text-xs font-semibold text-muted-foreground">
                            {member.name
                              .split(" ")
                              .filter(Boolean)
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="font-semibold">{member.name}</strong>
                              {member.id === user.id && (
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  Você
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs ${member.role === "admin" ? "border-primary/20 bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}
                        >
                          {roleLabels[member.role]}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${member.active ? "bg-emerald-500" : "bg-slate-400"}`}
                          />
                          {member.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 border-t px-6 py-4 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {loading
              ? "Consultando usuários…"
              : `${users.length} ${users.length === 1 ? "usuário cadastrado" : "usuários cadastrados"}`}
          </div>
        </div>
      )}
      <p className="text-xs leading-6 text-muted-foreground">
        Os usuários cadastrados pertencem somente a esta empresa. A edição de perfis e a desativação
        de acessos ainda não estão disponíveis.
      </p>
    </section>
  );
}
