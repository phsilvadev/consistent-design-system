"use client";
import { useState, type FormEvent, type CSSProperties } from "react";
import { PanelsTopLeft, Maximize2, PanelRight, Check, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teamApi, roleLabels, type TeamUser, type TeamRole } from "@/lib/auth/team";
import { ApiError } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

type Mode = "modal" | "fullscreen" | "aside";
const modes = [
  { id: "modal", label: "Modal", icon: PanelsTopLeft },
  { id: "fullscreen", label: "Tela cheia", icon: Maximize2 },
  { id: "aside", label: "Barra lateral", icon: PanelRight },
] as const;
const layouts: Record<Mode, CSSProperties> = {
  modal: { maxWidth: "min(36rem, calc(100vw - 2rem))", maxHeight: "calc(100svh - 2rem)" },
  fullscreen: {
    inset: 0,
    transform: "none",
    translate: "none",
    width: "100%",
    maxWidth: "none",
    height: "100svh",
    borderRadius: 0,
  },
  aside: {
    left: "auto",
    right: 0,
    top: 0,
    transform: "none",
    translate: "none",
    width: "min(32rem, 100vw)",
    maxWidth: "none",
    height: "100svh",
    borderRadius: 0,
  },
};
export function EditTeamUser({
  member,
  currentUserId,
  onSaved,
}: {
  member: TeamUser;
  currentUserId: string;
  onSaved: (user: TeamUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("modal");
  const [chooser, setChooser] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [role, setRole] = useState<TeamRole>(member.role);
  const [active, setActive] = useState(member.active);
  const router = useRouter();
  const self = member.id === currentUserId;
  function launch() {
    setName(member.name);
    setEmail(member.email);
    setRole(member.role);
    setActive(member.active);
    setError("");
    try {
      const saved = localStorage.getItem("atendehub:user-editor-mode");
      setMode(saved === "fullscreen" || saved === "aside" ? saved : "modal");
    } catch {
      setMode("modal");
    }
    setOpen(true);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const updated = await teamApi.update(member.company_id, member.id, {
        name: name.trim(),
        email: email.trim(),
        role,
        active,
      });
      setOpen(false);
      onSaved(updated);
      if (self) router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace("/login");
        router.refresh();
      } else setError(e instanceof Error ? e.message : "Não foi possível salvar as alterações.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        id={`edit-user-${member.id}`}
        variant="ghost"
        size="sm"
        className="rounded-lg"
        aria-label={`Editar ${member.name}`}
        onClick={launch}
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!busy) {
            setOpen(next);
            setChooser(false);
          }
        }}
      >
        <DialogContent
          data-display-mode={mode}
          style={layouts[mode]}
          className={`flex flex-col gap-0 overflow-y-auto rounded-2xl p-0 sm:rounded-2xl ${mode !== "modal" ? "translate-x-0 translate-y-0 data-[state=open]:animate-none data-[state=closed]:animate-none" : ""}`}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById(`edit-user-${member.id}`)?.focus();
          }}
        >
          <div className="flex items-start gap-4 border-b px-6 py-5 pr-24">
            <DialogHeader className="flex-1 text-left">
              <DialogTitle>Editar usuário</DialogTitle>
              <DialogDescription className="pt-1">
                Atualize os dados e as permissões de acesso.
              </DialogDescription>
            </DialogHeader>
            <Popover open={chooser} onOpenChange={setChooser}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-10 top-2 h-8 w-8 rounded-lg"
                  aria-label="Modo de exibição"
                  title="Modo de exibição"
                >
                  <PanelsTopLeft className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[282px] rounded-2xl p-2">
                <p className="px-2 pb-2 pt-1 text-xs font-medium text-muted-foreground">
                  Abrir formulário como
                </p>
                <div
                  className="grid grid-cols-3 gap-1"
                  role="group"
                  aria-label="Formato do formulário"
                >
                  {modes.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      aria-pressed={mode === option.id}
                      onClick={() => {
                        setMode(option.id);
                        setChooser(false);
                        try {
                          localStorage.setItem("atendehub:user-editor-mode", option.id);
                        } catch {
                          /* Preference is optional. */
                        }
                      }}
                      className={`relative flex flex-col items-center gap-2 rounded-xl px-1 py-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === option.id ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      <span className="flex h-11 w-16 items-center justify-center rounded-md border bg-background shadow-sm">
                        <option.icon className="h-6 w-6" />
                      </span>
                      {option.label}
                      {mode === option.id && (
                        <Check className="absolute right-1 top-1 h-3 w-3 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <form onSubmit={submit} className="mx-auto flex w-full max-w-3xl flex-1 flex-col p-6">
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-muted/40 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border bg-background text-sm font-semibold">
                {member.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div>
                <p className="text-sm font-semibold">{member.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {self ? "Sua conta" : "Membro da equipe"}
                </p>
              </div>
            </div>
            <fieldset disabled={busy} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor={`edit-name-${member.id}`} className="text-sm font-medium">
                  Nome completo
                </label>
                <Input
                  id={`edit-name-${member.id}`}
                  required
                  minLength={2}
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor={`edit-email-${member.id}`} className="text-sm font-medium">
                  E-mail
                </label>
                <Input
                  id={`edit-email-${member.id}`}
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor={`edit-role-${member.id}`} className="text-sm font-medium">
                  Perfil de acesso
                </label>
                <select
                  id={`edit-role-${member.id}`}
                  disabled={self}
                  value={role}
                  onChange={(e) => setRole(e.target.value as TeamRole)}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm disabled:opacity-60"
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <label htmlFor={`edit-active-${member.id}`} className="text-sm font-medium">
                    Acesso ao sistema
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {self
                      ? "Seu próprio acesso deve permanecer ativo."
                      : "Ao desativar, as sessões deste usuário serão encerradas."}
                  </p>
                </div>
                <input
                  id={`edit-active-${member.id}`}
                  aria-label="Usuário ativo"
                  type="checkbox"
                  checked={active}
                  disabled={self}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-primary"
                />
              </div>
            </fieldset>
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <DialogFooter className="mt-auto gap-2 pt-7">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                className="rounded-xl"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy} className="rounded-xl">
                {busy ? "Salvando…" : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
