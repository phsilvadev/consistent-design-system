import Link from "next/link";
export default function Unavailable() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Não foi possível verificar seu acesso</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        O serviço está temporariamente indisponível. O conteúdo da empresa não foi carregado.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        Tentar novamente
      </Link>
    </main>
  );
}
