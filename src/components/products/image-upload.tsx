"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadProductImage, type CatalogProduct } from "@/lib/auth/products";
import { useTenant } from "@/lib/tenant/provider";
export function ProductImageUpload({
  product,
  enabled,
  onClose,
  onUploaded,
}: {
  product: CatalogProduct;
  enabled: boolean;
  onClose: () => void;
  onUploaded: (value: Awaited<ReturnType<typeof uploadProductImage>>) => void;
}) {
  const { tenant } = useTenant();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function choose(files: File[]) {
    setDragging(false);
    setError("");
    if (files.length !== 1) {
      setError("Selecione apenas uma imagem por produto.");
      return;
    }
    const selected = files[0]!;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setError("Formato não permitido. Use JPG, PNG ou WebP.");
      return;
    }
    if (!selected.size || selected.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter até 5 MB.");
      return;
    }
    setFile(selected);
  }
  async function submit() {
    if (!file || busy || !enabled) return;
    setBusy(true);
    setError("");
    try {
      const result = await uploadProductImage(tenant.id, product, file);
      onUploaded(result);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar a imagem.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        overlayClassName="bg-black/35 backdrop-blur-sm"
        className={`max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-[520px] gap-0 overflow-y-auto rounded-2xl border-neutral-200 bg-white p-0 sm:rounded-2xl ${busy ? "[&>button]:pointer-events-none" : ""}`}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogHeader className="border-b px-6 pb-5 pt-6 text-left">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border bg-neutral-50 text-neutral-600">
            {success ? <Check className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
          </span>
          <DialogTitle className="text-lg font-semibold">
            {success
              ? "Imagem atualizada"
              : product.has_image
                ? "Trocar imagem do produto"
                : "Adicionar imagem ao produto"}
          </DialogTitle>
          <DialogDescription className="pt-1 text-xs leading-relaxed">
            {product.name} · {product.code || `ERP #${product.erp_id}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-6">
          {success ? (
            <div className="space-y-4 text-center">
              {preview && (
                <img
                  src={preview}
                  alt={`Imagem enviada de ${product.name}`}
                  className="mx-auto h-48 w-full rounded-xl border bg-neutral-50 object-contain p-3"
                />
              )}
              <p role="status" className="text-sm font-medium">
                Imagem salva com sucesso.
              </p>
              <p className="text-xs leading-relaxed text-neutral-500">
                A foto já está vinculada ao produto e continuará disponível nas próximas
                sincronizações.
              </p>
            </div>
          ) : (
            <>
              <input
                ref={input}
                type="file"
                aria-label="Selecionar imagem do produto"
                className="sr-only"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(event) => {
                  choose(Array.from(event.target.files || []));
                  event.target.value = "";
                }}
              />
              {file && preview ? (
                <div className="overflow-hidden rounded-xl border">
                  <div className="relative bg-neutral-50 p-4">
                    <img
                      src={preview}
                      alt={`Prévia de ${product.name}`}
                      className="h-52 w-full object-contain"
                      onError={() => {
                        setError("Não foi possível abrir a imagem. Escolha outro arquivo.");
                        setFile(null);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Remover arquivo selecionado"
                      className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white"
                      disabled={busy}
                      onClick={() => {
                        setFile(null);
                        setError("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t p-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{file.name}</p>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        {(file.size / 1024 / 1024).toLocaleString("pt-BR", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      disabled={busy}
                      onClick={() => input.current?.click()}
                    >
                      Escolher outra
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label="Área de upload de imagem"
                  disabled={busy}
                  onClick={() => input.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!busy) setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!busy) choose(Array.from(event.dataTransfer.files));
                  }}
                  className={`flex min-h-56 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${dragging ? "border-orange-400 bg-orange-50/40" : "border-neutral-200 bg-neutral-50/60 hover:border-neutral-400"}`}
                >
                  <Upload className="mb-4 h-7 w-7 text-neutral-500" />
                  <span className="text-sm font-medium">Arraste e solte a imagem aqui</span>
                  <span className="mt-2 text-xs text-neutral-500">
                    ou clique para selecionar no seu computador
                  </span>
                  <span className="mt-5 text-[11px] text-neutral-400">
                    JPG, PNG ou WebP · Até 5 MB
                  </span>
                </button>
              )}
              <p className="text-xs leading-relaxed text-neutral-500">
                Use uma foto nítida do produto, de preferência com fundo neutro. A imagem será usada
                no catálogo da sua empresa.
              </p>
              {!enabled && (
                <p className="rounded-xl border bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600">
                  O envio ainda não está disponível. A plataforma precisa configurar o Firebase
                  Storage.
                </p>
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-destructive/5 p-3 text-xs text-destructive"
                >
                  {error}
                </p>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t bg-neutral-50/50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl text-xs"
            disabled={busy}
            onClick={onClose}
          >
            {success ? "Concluir" : "Cancelar"}
          </Button>
          {!success && (
            <Button
              type="button"
              className="rounded-xl text-xs"
              disabled={!file || busy || !enabled}
              onClick={() => void submit()}
            >
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {busy ? "Enviando imagem…" : "Enviar imagem"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
