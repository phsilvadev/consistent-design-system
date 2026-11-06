import { Dashboard } from "@/components/screens/dashboard";
import { HelpScreen } from "@/components/help/help-screen";
export const metadata = { title: "Ajuda e suporte" };
export default function HelpPage() {
  return (
    <Dashboard activePage="Ajuda e suporte">
      <HelpScreen />
    </Dashboard>
  );
}
