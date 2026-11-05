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
export type UserChanges = Pick<TeamUser, "name" | "email" | "role" | "active">;
export const teamApi = {
  async update(companyId: string, userId: string, input: UserChanges): Promise<TeamUser> {
    const result = userSchema.safeParse(
      await apiRequest(
        `/users/${encodeURIComponent(userId)}`,
        { name: input.name, email: input.email, role: input.role, active: input.active },
        "PATCH",
      ),
    );
    if (!result.success || result.data.company_id !== companyId || result.data.id !== userId)
      throw new ApiError(502, "Não foi possível validar o usuário atualizado. Atualize a lista.");
    return result.data;
  },
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
