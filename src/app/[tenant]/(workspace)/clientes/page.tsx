import { StaticTableScreen } from "@/components/screens/static-table";
export const metadata = { title: "Clientes" };
export default function Page() {
  return (
    <StaticTableScreen
      title="Clientes"
      description="Clientes e contatos da sua empresa."
      columns={["Cliente", "Contato", "Telefone", "Último atendimento"]}
      rows={[
        ["Construtora Vale", "Carlos Mendes", "(11) 99999-0101", "Hoje, 09:43"],
        ["JR Obras", "Juliana Ribeiro", "(11) 99999-0102", "Hoje, 09:38"],
        ["M&S Estruturas", "Marcos Silva", "(11) 99999-0103", "Hoje, 09:22"],
      ]}
    />
  );
}
