import type { z } from "zod";
import { identitySchema } from "./contracts";
import { apiRequest, ApiError } from "./client";
const userSchema = identitySchema.shape.user;
export type TeamUser = z.infer<typeof userSchema>;
export type TeamRole = TeamUser["role"];
export const roleLabels: Record<TeamRole, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  seller: "Vendedor",
  operator: "Operador",
};
export type NewUser = { name: string; email: string; password: string; role: TeamRole };
export const teamApi = {
  async list(companyId: string): Promise<TeamUser[]> {
    const result = userSchema.array().safeParse(await apiRequest("/users"));
    if (!result.success || result.data.some((user) => user.company_id !== companyId))
      throw new ApiError(502, "Não foi possível validar os usuários da empresa.");
    return result.data;
  },
  async create(companyId: string, input: NewUser): Promise<TeamUser> {
    const result = userSchema.safeParse(
      await apiRequest("/users", {
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
      }),
    );
    if (!result.success || result.data.company_id !== companyId)
      throw new ApiError(
        502,
        "Não foi possível validar o usuário cadastrado. Atualize a lista antes de tentar novamente.",
      );
    return result.data;
  },
};
