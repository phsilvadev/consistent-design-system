import { Dashboard } from "@/components/screens/dashboard";
export const metadata = { title: "Integrações" };
export default function IntegrationsPage() {
  return (
    <Dashboard activePage="Integrações">
      <main className="space-y-6 p-4 md:p-8">
        <h1 className="text-2xl font-semibold">Integrações</h1>
        <p className="text-muted-foreground">Sistemas e canais de atendimento da sua empresa.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["WhatsApp", "Canal de atendimento", "Conectado"],
            ["Sistema de gestão", "Produtos, estoque e preços", "Conectado"],
            ["API personalizada", "Outros sistemas e serviços", "Pendente"],
          ].map(([name, description, status]) => (
            <article key={name} className="space-y-3 rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${status === "Conectado" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
              >
                {status}
              </span>
            </article>
          ))}
        </div>
      </main>
    </Dashboard>
  );
}
