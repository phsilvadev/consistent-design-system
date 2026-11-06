"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function TrialBanner({
  endsAt,
  plansHref,
}: {
  endsAt?: number | undefined;
  plansHref: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  if (endsAt === undefined || endsAt * 1000 <= now) return null;
  const days = Math.ceil((endsAt * 1000 - now) / 86400000);
  return (
    <div
      role="status"
      aria-label="Período de teste"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-red-600 px-4 py-2 text-center text-xs text-white sm:text-sm"
    >
      <p>
        <strong>Você está no teste gratuito de 7 dias.</strong>{" "}
        {days === 1 ? "Resta 1 dia" : `Restam ${days} dias`} para aproveitar a plataforma.
      </p>
      <Link
        href={plansHref}
        className="font-semibold underline underline-offset-4 hover:no-underline"
      >
        Conhecer os planos
      </Link>
    </div>
  );
}
