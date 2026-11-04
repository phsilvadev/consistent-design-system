"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, ApiError } from "@/lib/auth/client";
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        className="font-semibold hover:underline disabled:opacity-50"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await auth.logout();
            router.replace("/login");
            router.refresh();
          } catch (e) {
            if (e instanceof ApiError && e.status === 401) {
              router.replace("/login");
              router.refresh();
            } else setError("Não foi possível sair. Tente novamente.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Saindo…" : "Sair da conta"}
      </button>
      {error && <span role="alert">{error}</span>}
    </span>
  );
}
