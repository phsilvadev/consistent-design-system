"use client";
import { useEffect } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportLovableError(error, { boundary: "next_app" });
  }, [error]);
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Não foi possível carregar a página</h1>
      <button onClick={reset} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
        Tentar novamente
      </button>
    </main>
  );
}
