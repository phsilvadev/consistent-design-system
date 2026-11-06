"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Settings, Plug, LogOut, CircleHelp } from "lucide-react";
import { useTenant } from "@/lib/tenant/provider";
import { auth, ApiError } from "@/lib/auth/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function ProfileMenu() {
  const { user, tenant, href } = useTenant();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
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
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Menu da conta"
          className="ml-2 flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 hover:bg-muted"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="hidden text-sm font-semibold sm:inline">{user.name}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-2xl p-2">
        <DropdownMenuLabel className="px-2 py-3">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="mt-1 truncate text-xs font-normal text-muted-foreground">{tenant.name}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={href("/configuracoes")}>
            <Settings />
            Configurações da conta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={href("/integracoes")}>
            <Plug />
            Integrações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={href("/ajuda")}>
            <CircleHelp />
            Ajuda e suporte
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={busy}
          onSelect={(e) => {
            e.preventDefault();
            void logout();
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut />
          {busy ? "Saindo…" : "Sair da conta"}
        </DropdownMenuItem>
        {error && (
          <p role="alert" className="px-2 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
