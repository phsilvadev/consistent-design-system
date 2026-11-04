import { StaticTableScreen } from "@/components/screens/static-table";
export const metadata = { title: "Orçamentos" };
export default function Page() {
  return (
    <StaticTableScreen
      title="Orçamentos"
      description="Acompanhe os orçamentos da sua equipe."
      columns={["Número", "Cliente", "Valor", "Situação"]}
      rows={[
        ["ORC-1042", "Construtora Vale", "R$ 8.450,00", "Enviado"],
        ["ORC-1041", "JR Obras", "R$ 3.280,00", "Em elaboração"],
        ["ORC-1040", "M&S Estruturas", "R$ 5.190,00", "Aprovado"],
      ]}
    />
  );
}
