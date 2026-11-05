import { z } from "zod";
import { apiRequest, ApiError } from "./client";
const schema = z.object({
  company_id: z.string().uuid(),
  enabled: z.boolean(),
  status: z.enum(["disconnected", "validated", "receiving"]),
  phone_number_id: z.string(),
  waba_id: z.string(),
  display_phone_number: z.string(),
  verified_name: z.string(),
  has_token: z.boolean(),
  verified_at: z.number().int().nullable(),
  last_received_at: z.number().int().nullable(),
  version: z.number().int().nonnegative(),
  webhook_url: z.string().url().nullable(),
  webhook_configured: z.boolean(),
  platform_app_configured: z.boolean(),
  diagnostics: z.object({
    app_confirmed: z.boolean().optional(),
    scopes: z.array(z.string()).optional(),
    expires_at: z.number().nullable().optional(),
    app_subscribed: z.boolean().nullable().optional(),
    phone_status: z.string().nullable().optional(),
    code_verification_status: z.string().nullable().optional(),
    platform_type: z.string().nullable().optional(),
  }),
});
export type OfficialConnection = z.infer<typeof schema>;
export type OfficialCredentials = {
  phone_number_id: string;
  waba_id: string;
  version: number;
  access_token?: string;
};
export async function officialWhatsApp(
  companyId: string,
  action?: "connect" | "disconnect" | "setup",
  body?:
    | OfficialCredentials
    | { version: number }
    | { version: number; action: "subscribe" | "register"; confirm: true; pin?: string },
) {
  const result = schema.safeParse(
    await apiRequest(`/integrations/whatsapp-official${action ? `/${action}` : ""}`, body),
  );
  if (!result.success || result.data.company_id !== companyId)
    throw new ApiError(502, "Não foi possível validar a configuração da empresa.");
  return result.data;
}
