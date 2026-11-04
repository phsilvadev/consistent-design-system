import Link from "next/link";
export default function AccessDenied() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <p className="text-sm text-muted-foreground">403 · Acesso restrito</p>
      <h1 className="text-2xl font-semibold">Você não tem acesso a esta empresa</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Entre com uma conta vinculada a esta empresa ou retorne ao seu espaço de trabalho.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        Ir para minha empresa
      </Link>
      <Link href="/login" className="text-sm underline">
        Entrar com outra conta
      </Link>
    </main>
  );
}
