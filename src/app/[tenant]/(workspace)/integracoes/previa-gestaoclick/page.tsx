import { Dashboard } from "@/components/screens/dashboard";
import { GestaoClickPreview } from "@/components/integrations/gestaoclick-preview";
export const metadata = { title: "Prévia GestãoClick" };
export default function PreviewPage() {
  return (
    <Dashboard activePage="Integrações">
      <GestaoClickPreview />
    </Dashboard>
  );
}
