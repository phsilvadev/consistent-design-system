import { PasswordRecovery } from "@/components/auth/password-recovery";
export const metadata = { title: "Recuperar senha", referrer: "no-referrer" as const };
export default function ForgotPage() {
  return <PasswordRecovery />;
}
