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
  image_upload_enabled: z.boolean().default(false),
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
      has_image: z.boolean().default(false),
      image_version: z.number().int().nonnegative().default(0),
      image_updated_at: z.number().int().nullable().default(null),
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

export type CatalogProduct = Catalog["items"][number];
const imageResultSchema = z.object({
  company_id: z.string().uuid(),
  product_id: z.string().uuid(),
  has_image: z.literal(true),
  image_version: z.number().int().positive(),
  image_updated_at: z.number().int(),
});
export async function uploadProductImage(companyId: string, product: CatalogProduct, file: File) {
  let response: Response;
  try {
    response = await fetch(
      `/api/v1/products/${product.id}/image?version=${product.image_version}`,
      {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": file.type },
        body: file,
      },
    );
  } catch {
    throw new ApiError(0, "Não foi possível enviar a imagem. Tente novamente.");
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data && typeof data === "object" && "detail" in data ? data.detail : null;
    throw new ApiError(
      response.status,
      typeof detail === "string" ? detail : "Não foi possível enviar a imagem.",
    );
  }
  const parsed = imageResultSchema.safeParse(data);
  if (
    !parsed.success ||
    parsed.data.company_id !== companyId ||
    parsed.data.product_id !== product.id
  )
    throw new ApiError(
      502,
      "Não foi possível validar a imagem deste produto. Recarregue a listagem.",
    );
  return parsed.data;
}
