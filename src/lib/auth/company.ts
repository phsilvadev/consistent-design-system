import { z } from "zod";
import { apiRequest, ApiError } from "./client";
export const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const dayLabels = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];
const hoursSchema = z.object({
  enabled: z.boolean(),
  opens: z.string().nullable(),
  closes: z.string().nullable(),
});
const companySchema = z.object({
  company_id: z.string().uuid(),
  name: z.string(),
  legal_name: z.string(),
  tax_id: z.string(),
  phone: z.string(),
  email: z.string(),
  postal_code: z.string(),
  street: z.string(),
  number: z.string(),
  complement: z.string(),
  district: z.string(),
  city: z.string(),
  state: z.string(),
  timezone: z.string(),
  business_hours: z.object({
    mon: hoursSchema,
    tue: hoursSchema,
    wed: hoursSchema,
    thu: hoursSchema,
    fri: hoursSchema,
    sat: hoursSchema,
    sun: hoursSchema,
  }),
});
export type CompanySettingsData = z.infer<typeof companySchema>;
async function validate(companyId: string, result: unknown) {
  const parsed = companySchema.safeParse(result);
  if (!parsed.success || parsed.data.company_id !== companyId)
    throw new ApiError(502, "Não foi possível validar os dados da empresa.");
  return parsed.data;
}
export const companyApi = {
  async get(companyId: string) {
    return validate(companyId, await apiRequest("/company/settings"));
  },
  async save(companyId: string, data: CompanySettingsData) {
    const parsed = companySchema.parse(data);
    const { company_id: _id, ...body } = parsed;
    return validate(companyId, await apiRequest("/company/settings", body, "PATCH"));
  },
};
