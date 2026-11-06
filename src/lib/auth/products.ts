import { z } from "zod";
import { apiRequest, ApiError } from "./client";
const syncSchema = z.object({
  company_id: z.string().uuid(),
  run_id: z.string().uuid().nullable(),
  status: z.enum(["idle", "running", "completed", "failed"]),
  processed: z.number().int().nonnegative(),
  pages_done: z.number().int().nonnegative(),
  total_pages: z.number().int().nullable(),
  started_at: z.number().int().nullable(),
  completed_at: z.number().int().nullable(),
  last_success_at: z.number().int().nullable(),
  error_code: z.string().nullable(),
});
export type ProductSync = z.infer<typeof syncSchema>;
export async function productSync(
  companyId: string,
  action?: "start" | "next",
  body?: { version: number } | { run_id: string },
) {
  const parsed = syncSchema.safeParse(
    await apiRequest(`/integrations/gestaoclick/products-sync${action ? `/${action}` : ""}`, body),
  );
  if (!parsed.success || parsed.data.company_id !== companyId)
    throw new ApiError(502, "Não foi possível validar o progresso desta empresa.");
  return parsed.data;
}
const catalogSchema = z.object({
  company_id: z.string().uuid(),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      erp_id: z.string(),
      code: z.string(),
      name: z.string(),
      description: z.string(),
      category: z.string(),
      active: z.boolean(),
      has_variations: z.boolean(),
      synced_at: z.number().int(),
    }),
  ),
});
export type Catalog = z.infer<typeof catalogSchema>;
export async function products(companyId: string, q: string, page: number) {
  const parsed = catalogSchema.safeParse(
    await apiRequest(`/products?${new URLSearchParams({ q, page: String(page) })}`),
  );
  if (!parsed.success || parsed.data.company_id !== companyId)
    throw new ApiError(502, "Não foi possível validar o catálogo desta empresa.");
  return parsed.data;
}
