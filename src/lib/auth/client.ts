import { identitySchema, type Identity } from "./contracts";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function apiRequest(path: string, body?: unknown, method?: "PATCH"): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      credentials: "same-origin",
      cache: "no-store",
      ...(body === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente.");
  }
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const detail = data && typeof data === "object" && "detail" in data ? data.detail : null;
    throw new ApiError(
      response.status,
      typeof detail === "string"
        ? detail
        : "Não foi possível concluir a solicitação. Tente novamente.",
    );
  }
  return response.status === 204 ? undefined : response.json();
}
export function authRequest(path: string, body?: unknown): Promise<unknown> {
  return apiRequest(`/auth/${path}`, body);
}
async function identityRequest(path: string, body?: unknown): Promise<Identity> {
  const result = identitySchema.safeParse(await authRequest(path, body));
  if (
    !result.success ||
    result.data.user.company_id !== result.data.company.id ||
    !result.data.user.active
  )
    throw new ApiError(502, "O servidor retornou uma sessão inválida.");
  return result.data;
}
export const auth = {
  me: () => identityRequest("me"),
  login: (email: string, password: string, remember: boolean) =>
    identityRequest("login", { email, password, remember }),
  register: (name: string, company: string, email: string, password: string) =>
    identityRequest("register", { name, company, email, password }),
  logout: () => authRequest("logout", {}),
};
