import Link from "next/link";
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Página indisponível</h1>
      <p>A página não existe ou você não tem acesso a esta empresa.</p>
      <Link className="underline" href="/login">
        Voltar ao login
      </Link>
    </main>
  );
}
