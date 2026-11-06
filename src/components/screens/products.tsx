"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch, Search } from "lucide-react";
import { Dashboard } from "./dashboard";
import { useTenant } from "@/lib/tenant/provider";
import { products, type Catalog } from "@/lib/auth/products";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
export function ProductsScreen() {
  const { tenant, user } = useTenant();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      products(tenant.id, query, page)
        .then((result) => {
          if (alive) setData(result);
        })
        .catch((e: unknown) => {
          if (alive) {
            setData(null);
            setError(e instanceof Error ? e.message : "Não foi possível carregar o catálogo.");
          }
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [tenant.id, query, page, revision]);
  return (
    <Dashboard activePage="Produtos">
      <main className="space-y-6 p-4 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Produtos</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              O catálogo da sua empresa, sincronizado com o GestãoClick.
            </p>
          </div>
          {user.role === "admin" && (
            <Button variant="outline" className="rounded-xl" asChild>
              <Link href={`/${tenant.id}/integracoes`}>Configurar sincronização</Link>
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
            <Input
              aria-label="Buscar produto"
              placeholder="Buscar por nome ou código…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="rounded-xl pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {loading ? "Carregando…" : `${data?.total ?? 0} produtos`}
          </p>
        </div>
        {error ? (
          <div role="alert" className="rounded-2xl border bg-white p-6">
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => setRevision((value) => value + 1)}
            >
              Tentar novamente
            </Button>
          </div>
        ) : loading ? (
          <div
            aria-label="Carregando produtos"
            className="space-y-3 rounded-2xl border bg-white p-5"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : data?.items.length ? (
          <div className="overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-neutral-50">
                <tr>
                  {["Produto", "Código", "Categoria", "Status"].map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="whitespace-nowrap px-5 py-4 font-semibold"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className="min-w-64 px-5 py-4">
                      <p className="font-medium">{item.name}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        ERP #{item.erp_id}
                        {item.has_variations ? " · Possui variações no ERP" : ""}
                      </p>
                    </td>
                    <td className="px-5 py-4">{item.code || "—"}</td>
                    <td className="px-5 py-4">{item.category || "—"}</td>
                    <td className="px-5 py-4">
                      <span className="whitespace-nowrap rounded-full bg-neutral-100 px-3 py-1 text-xs">
                        {item.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white px-6 py-14 text-center">
            <PackageSearch className="mx-auto mb-4 h-8 w-8 text-neutral-400" />
            <h2 className="font-semibold">
              {query ? "Nenhum produto encontrado" : "Seu catálogo começa aqui"}
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              {query
                ? "Tente outro nome ou código."
                : "Sincronize os produtos em Configurações → Integrações → GestãoClick."}
            </p>
          </div>
        )}
        {!loading && data && data.total > 20 && (
          <div className="flex items-center justify-end gap-4">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <span className="text-xs">
              Página {page} de {Math.ceil(data.total / 20)}
            </span>
            <Button
              variant="outline"
              disabled={page * 20 >= data.total}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
        <p className="text-xs text-neutral-500">
          Preços, estoque e unidades comerciais serão disponibilizados em uma próxima etapa. Os
          dados exibidos refletem a última sincronização.
        </p>
      </main>
    </Dashboard>
  );
}
