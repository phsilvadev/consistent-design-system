import { currentSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Home() {
  const result = await currentSession();
  if (result.status === "anonymous") redirect("/login");
  if (result.status === "unavailable") redirect("/servico-indisponivel");
  redirect(`/${result.identity.company.id}`);
}
