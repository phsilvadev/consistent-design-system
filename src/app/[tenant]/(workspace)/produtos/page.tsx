import { StaticTableScreen } from "@/components/screens/static-table";
export const metadata = { title: "Produtos" };
export default function Page() {
  return (
    <StaticTableScreen
      title="Produtos"
      description="Consulte os produtos, preços e quantidades em estoque."
      columns={["Produto", "Unidade", "Estoque", "Preço"]}
      rows={[
        ["Vergalhão CA-50 12 mm", "Barra de 12 m", "320", "R$ 89,90"],
        ["Metalon 30x30 chapa 18", "Barra de 6 m", "180", "R$ 74,50"],
        ["Chapa de aço 3 mm", "Unidade", "45", "R$ 485,00"],
      ]}
    />
  );
}
