import { LogoutButton } from "./logout-button";
export function TrialExpired() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Seu período de teste terminou</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Os 7 dias de avaliação terminaram. Entre em contato com a equipe para continuar.
      </p>
      <LogoutButton />
    </main>
  );
}
