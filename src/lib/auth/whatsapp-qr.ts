import { z } from "zod";
import { apiRequest, ApiError } from "./client";
const schema = z.object({
  company_id: z.string().uuid(),
  enabled: z.boolean(),
  status: z.enum(["disconnected", "connecting", "qr", "connected", "error"]),
  qr_data_url: z
    .string()
    .max(100000)
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
    .nullable(),
  qr_expires_at: z.number().int().nullable(),
  phone: z
    .string()
    .regex(/^\d{10,15}$/)
    .nullable(),
});
export type QRConnection = z.infer<typeof schema>;
export async function whatsappQR(companyId: string, action?: "connect" | "disconnect") {
  const data = schema.safeParse(
    await apiRequest(
      `/integrations/whatsapp-qr${action ? `/${action}` : ""}`,
      action ? {} : undefined,
    ),
  );
  if (!data.success || data.data.company_id !== companyId)
    throw new ApiError(502, "Não foi possível validar a conexão da empresa.");
  return data.data;
}
