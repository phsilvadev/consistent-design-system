import { PasswordRecovery } from "@/components/auth/password-recovery";
export const metadata = { title: "Redefinir senha", referrer: "no-referrer" as const };
export default function ResetPage() {
  return <PasswordRecovery reset />;
}
