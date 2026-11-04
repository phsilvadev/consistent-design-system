import { StaticTableScreen } from "@/components/screens/static-table";
export const metadata = { title: "Relatórios" };
export default function Page() {
  return (
    <StaticTableScreen
      title="Relatórios"
      description="Indicadores de atendimento e vendas da equipe."
      columns={["Indicador", "Hoje", "Esta semana", "Este mês"]}
      rows={[
        ["Atendimentos", "126", "642", "2.840"],
        ["Orçamentos enviados", "42", "218", "920"],
        ["Vendas convertidas", "28", "146", "615"],
        ["Taxa de conversão", "22,2%", "22,7%", "21,7%"],
      ]}
    />
  );
}
