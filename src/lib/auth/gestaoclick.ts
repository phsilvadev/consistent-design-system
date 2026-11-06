import { z } from "zod";
import { apiRequest, ApiError } from "./client";
const schema = z.object({
  company_id: z.string().uuid(),
  enabled: z.boolean(),
  base_url: z.string(),
  has_credentials: z.boolean(),
  status: z.enum(["not_configured", "credentials_saved", "access_validated", "test_failed"]),
  version: z.number().int().nonnegative(),
  updated_at: z.number().int().nullable(),
  stores: z
    .array(z.object({ id: z.string().regex(/^[0-9]{1,40}$/), name: z.string() }))
    .default([]),
  selected_store_id: z.string().nullable().default(null),
  tested_at: z.number().int().nullable().default(null),
  test_error_code: z.string().nullable().default(null),
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
  action?: "save" | "remove" | "test" | "store",
  body?: GestaoClickInput | { version: number } | { version: number; store_id: string },
) {
  const result = schema.safeParse(
    await apiRequest(
      `/integrations/gestaoclick${action && action !== "save" ? `/${action}` : ""}`,
      body,
    ),
  );
  if (!result.success || result.data.company_id !== companyId)
    throw new ApiError(502, "Não foi possível validar a configuração da empresa.");
  return result.data;
}
