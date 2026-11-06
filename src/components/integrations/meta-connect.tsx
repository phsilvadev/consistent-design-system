"use client";

import { useEffect, useRef, useState } from "react";
import { LockKeyhole, Loader2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  metaConfig,
  loadMetaSDK,
  launchMetaSignup,
  beginMeta,
  type MetaConfig,
  type MetaSDK,
} from "@/lib/auth/meta-signup";
import { completeMetaSignup, type OfficialConnection } from "@/lib/auth/whatsapp-official";

export function MetaConnect({
  companyId,
  version,
  disabled,
  onConnected,
  onBusyChange,
}: {
  companyId: string;
  version: number;
  disabled: boolean;
  onConnected: (data: OfficialConnection) => void;
  onBusyChange: (value: boolean) => void;
}) {
  const [config, setConfig] = useState<MetaConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"idle" | "authorizing" | "saving">("idle");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const prepared = useRef<{
    sdk: MetaSDK;
    config: MetaConfig;
    state: string;
    expires: number;
  } | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setReady(false);
    setError("");
    prepared.current = null;
    async function prepare() {
      try {
        const conf = await metaConfig(companyId);
        if (!alive) return;
        setConfig(conf);
        if (!conf.enabled) return;
        const sdk = await loadMetaSDK(conf);
        if (!alive) return;
        const attempt = await beginMeta(companyId, version);
        if (!alive) return;
        prepared.current = { sdk, config: conf, state: attempt.state, expires: attempt.expires_at };
        setReady(true);
      } catch (e) {
        if (alive)
          setError(e instanceof Error ? e.message : "Não foi possível preparar a conexão.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    void prepare();
    return () => {
      alive = false;
      prepared.current = null;
      controller.current?.abort();
    };
  }, [companyId, version, revision]);
  function connect() {
    const value = prepared.current;
    if (!value || disabled || phase !== "idle") return;
    if (value.expires * 1000 <= Date.now()) {
      setRevision((r) => r + 1);
      return;
    }
    const aborter = new AbortController();
    controller.current = aborter;
    setPhase("authorizing");
    setError("");
    onBusyChange(true);
    // Must remain in the click event: FB.login opens the provider popup synchronously.
    void launchMetaSignup(value.sdk, value.config.config_id!, aborter.signal)
      .then(async (result) => {
        if (aborter.signal.aborted) return;
        setPhase("saving");
        const data = await completeMetaSignup(companyId, { state: value.state, ...result });
        if (!aborter.signal.aborted) onConnected(data);
      })
      .catch((e: unknown) => {
        if (!aborter.signal.aborted)
          setError(e instanceof Error ? e.message : "Não foi possível concluir a autorização.");
      })
      .finally(() => {
        if (controller.current !== aborter) return;
        controller.current = null;
        onBusyChange(false);
        setPhase("idle");
        setReady(false);
        prepared.current = null;
      });
  }
  return (
    <section
      aria-label="Conectar com a Meta"
      className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold">Conecte pela sua conta Meta</h3>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">
            Autorize o WhatsApp da sua empresa em uma janela segura da Meta. Não é necessário copiar
            tokens ou identificadores.
          </p>
        </div>
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" />
      </div>
      <ol className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-600">
        <li>1. Entre na Meta</li>
        <li>2. Escolha o número</li>
        <li>3. Autorize o acesso</li>
      </ol>
      <Button
        type="button"
        onClick={connect}
        disabled={disabled || loading || !ready || phase !== "idle"}
        className="h-11 w-full rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
      >
        {loading || phase !== "idle" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ArrowUpRight className="mr-2 h-4 w-4" />
        )}
        {loading
          ? "Preparando conexão…"
          : phase === "authorizing"
            ? "Aguardando autorização na Meta…"
            : phase === "saving"
              ? "Validando conta com segurança…"
              : "Conectar com a Meta"}
      </Button>
      {!loading && config && !config.enabled && (
        <p className="text-xs leading-relaxed text-neutral-500">{config.reason}</p>
      )}
      {phase === "authorizing" && (
        <button
          type="button"
          onClick={() => controller.current?.abort()}
          className="text-xs underline underline-offset-4"
        >
          Cancelar autorização
        </button>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
      {!loading && phase === "idle" && !ready && (error || config?.enabled) && (
        <button
          type="button"
          className="text-xs font-medium underline underline-offset-4"
          onClick={() => setRevision((r) => r + 1)}
        >
          Preparar nova autorização
        </button>
      )}
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-neutral-500">
        <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />O token é obtido e criptografado no
        servidor. Você poderá revisar o registro do número e o recebimento de eventos após
        autorizar.
      </p>
    </section>
  );
}
