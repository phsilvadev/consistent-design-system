import type { ReactNode } from "react";
import { MessageCircle, Package, Users, ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
const features = [
  { icon: MessageCircle, title: "Atendimentos", text: "Organize as conversas da sua equipe." },
  { icon: Package, title: "Produtos", text: "Seu catálogo junto da operação." },
  { icon: Users, title: "Relacionamento", text: "Cada cliente com sua história." },
];
export function ClientAuthShell({
  children,
  registering = false,
}: {
  children: ReactNode;
  registering?: boolean;
}) {
  return (
    <main className="min-h-svh bg-card font-sans text-foreground">
      <div className="grid min-h-svh w-full overflow-hidden bg-card lg:grid-cols-[1.12fr_1fr]">
        <aside
          className="relative hidden flex-col justify-between overflow-hidden rounded-[26px] bg-sidebar p-9 text-sidebar-foreground lg:flex xl:p-12"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 55% 25%, color-mix(in oklch, var(--primary) 40%, transparent), transparent 64%), radial-gradient(ellipse at 100% 70%, color-mix(in oklch, var(--accent) 24%, transparent), transparent 65%), radial-gradient(ellipse at 0% 100%, color-mix(in oklch, var(--primary) 40%, transparent), transparent 65%)",
          }}
        >
          <div className="relative z-10 flex items-center justify-between gap-3">
            <BrandLogo white className="h-auto w-44 -translate-x-[8%]" />
            <span className="rounded-full border border-sidebar-foreground/20 px-3 py-1.5 text-[10px] text-sidebar-foreground/80">
              {registering ? "7 dias para conhecer" : "Sua operação conectada"}
            </span>
          </div>
          <div className="relative z-10 mt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-sidebar-foreground/15 bg-sidebar-foreground/10 px-3 py-1.5 text-xs">
              <span className="size-1.5 rounded-full bg-primary" />
              Boas conversas. Novos negócios.
            </span>
            <h2 className="mt-5 text-[clamp(2.5rem,3.6vw,3.75rem)] font-medium leading-[1.08] tracking-[-0.045em]">
              Mais perto do cliente.
              <br />
              Mais simples para você.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-sidebar-foreground/70">
              Atendimento e gestão no mesmo lugar.
              <br />
              Uma rotina mais organizada para sua distribuidora.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-3">
              {features.map(({ icon: Icon, title, text }, index) => (
                <div
                  key={title}
                  className={`flex min-h-40 flex-col justify-between rounded-2xl border p-4 ${index === 0 ? "border-card bg-card text-card-foreground" : "border-sidebar-foreground/10 bg-sidebar-foreground/10"}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`grid size-7 place-items-center rounded-full ${index === 0 ? "bg-primary text-primary-foreground" : "bg-sidebar-foreground/10"}`}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <ArrowUpRight className="size-3.5 opacity-40" />
                  </div>
                  <div>
                    <h3 className="mt-6 text-xs font-semibold">{title}</h3>
                    <p
                      className={`mt-1.5 text-[11px] leading-4 ${index === 0 ? "text-muted-foreground" : "text-sidebar-foreground/65"}`}
                    >
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-7 text-[10px] text-sidebar-foreground/45">
              AtendeHub · Feito para construir relações.
            </p>
          </div>
        </aside>
        <section className="flex min-w-0 flex-col justify-between rounded-[24px] px-5 py-6 sm:px-10 sm:py-8 xl:px-16">
          <div className="flex items-center justify-between lg:hidden">
            <BrandLogo className="h-auto w-36 -translate-x-[8%]" />
            <span className="text-[10px] text-muted-foreground">IA Atendimento</span>
          </div>
          <div className="my-auto py-8 sm:py-10">{children}</div>
          <p className="pt-4 text-center text-[11px] text-muted-foreground">
            AtendeHub · Sua equipe, conectada.
          </p>
        </section>
      </div>
    </main>
  );
}
