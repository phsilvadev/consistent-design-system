import { Dashboard } from "@/components/screens/dashboard";
import { IntegrationsScreen } from "@/components/integrations/integrations-screen";
export const metadata = { title: "Integrações" };
export default function IntegrationsPage() {
  return (
    <Dashboard activePage="Integrações">
      <IntegrationsScreen />
    </Dashboard>
  );
}
