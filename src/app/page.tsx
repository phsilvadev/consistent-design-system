import { tenantHref } from "@/lib/tenant/shared";
import { redirect } from "next/navigation";
export default function Home() {
  redirect(tenantHref("empresa-exemplo"));
}
