import { Login } from "@/components/screens/login";
export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";
export default async function LoginPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return <Login tenantSlug={tenant} />;
}
