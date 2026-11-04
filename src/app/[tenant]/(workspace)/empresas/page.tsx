import Link from "next/link";
import { tenantHref } from "@/lib/tenant/shared";
export const metadata = { title: "Empresas" };
export default async function CompaniesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const companies = [
    { slug: tenant, name: tenant.replace(/[-_]/g, " ") },
    { slug: "aco-moreira", name: "Aço Moreira" },
    { slug: "distribuidora-central", name: "Distribuidora Central" },
  ];
  return (
    <main className="mx-auto max-w-xl space-y-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">Empresas</h1>
      <p className="text-muted-foreground">Escolha um ambiente para acessar as telas.</p>
      <ul className="space-y-3">
        {companies.map((company, index) => (
          <li key={`${company.slug}-${index}`}>
            <Link
              href={tenantHref(company.slug)}
              className="block rounded-xl border bg-card p-5 font-semibold hover:bg-muted"
            >
              {company.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
