import { z } from "zod";
import { apiRequest, ApiError } from "./client";
const turnSchema = z.object({
  id: z.string().uuid(),
  request_id: z.string().uuid(),
  message: z.string(),
  answer: z.string().nullable(),
  status: z.enum(["processing", "complete", "failed"]),
  error: z.string().nullable(),
  created_at: z.number(),
  sources: z.array(z.object({ id: z.string(), title: z.string(), version: z.string() })),
});
const historySchema = z.object({
  company_id: z.string().uuid(),
  user_id: z.string().uuid(),
  available: z.boolean(),
  items: z.array(turnSchema),
  daily_limit: z.number().int().positive(),
  used_today: z.number().int().nonnegative(),
  retention_days: z.number().int().positive(),
});
export type SupportTurn = z.infer<typeof turnSchema>;
export type SupportHistory = z.infer<typeof historySchema>;
export const supportApi = {
  async history(companyId: string, userId: string) {
    const result = historySchema.safeParse(await apiRequest("/support/messages"));
    if (!result.success || result.data.company_id !== companyId || result.data.user_id !== userId)
      throw new ApiError(502, "Não foi possível validar o histórico de suporte.");
    return result.data;
  },
  async send(requestId: string, message: string) {
    return turnSchema.parse(
      await apiRequest("/support/messages", { request_id: requestId, message }),
    );
  },
};
