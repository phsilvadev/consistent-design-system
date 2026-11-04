import { Login } from "@/components/screens/login";
export const metadata = { title: "Criar conta" };
export default async function RegisterPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return <Login mode="register" tenantSlug={tenant} />;
}
