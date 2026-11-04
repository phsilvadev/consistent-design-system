import { Dashboard } from "@/components/screens/dashboard";
import { AtendimentoScreen } from "@/components/atendimentos/atendimento-screen";
export const metadata = { title: "Atendimentos" };
export default function ConversationsPage() {
  return (
    <Dashboard activePage="Atendimentos">
      <AtendimentoScreen />
    </Dashboard>
  );
}
