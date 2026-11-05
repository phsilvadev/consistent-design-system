import { z } from "zod";
import { apiRequest, ApiError } from "./client";
const schema = z.object({
  company_id: z.string().uuid(),
  enabled: z.boolean(),
  base_url: z.string(),
  has_credentials: z.boolean(),
  status: z.enum(["not_configured", "credentials_saved"]),
  version: z.number().int().nonnegative(),
  updated_at: z.number().int().nullable(),
});
export type GestaoClickConfiguration = z.infer<typeof schema>;
export type GestaoClickInput = {
  base_url: string;
  version: number;
  access_token?: string;
  secret_access_token?: string;
};
export async function gestaoClick(
  companyId: string,
  action?: "save" | "remove",
  body?: GestaoClickInput | { version: number },
) {
  const result = schema.safeParse(
    await apiRequest(`/integrations/gestaoclick${action === "remove" ? "/remove" : ""}`, body),
  );
  if (!result.success || result.data.company_id !== companyId)
    throw new ApiError(502, "Não foi possível validar a configuração da empresa.");
  return result.data;
}
