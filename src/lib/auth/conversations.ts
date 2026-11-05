import { z } from "zod";
import { apiRequest, ApiError } from "./client";
export const conversationStatuses = [
  "new",
  "ai",
  "human",
  "awaiting_customer",
  "quoting",
  "converted",
  "closed",
] as const;
export type ConversationStatus = (typeof conversationStatuses)[number];
export const statusLabels: Record<ConversationStatus, string> = {
  new: "Novo",
  ai: "Em atendimento pela IA",
  human: "Em atendimento humano",
  awaiting_customer: "Aguardando cliente",
  quoting: "Em orçamento",
  converted: "Convertido em venda",
  closed: "Encerrado",
};
export const personSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.enum(["admin", "supervisor", "seller", "operator"]),
});
const conversationSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  customer: z.object({
    id: z.string().uuid(),
    name: z.string(),
    phone: z.string(),
    business_name: z.string(),
  }),
  assigned_user: personSchema.nullable(),
  subject: z.string(),
  status: z.enum(conversationStatuses),
  channel: z.enum(["manual", "whatsapp", "whatsapp_qr"]),
  created_at: z.number(),
  updated_at: z.number(),
  closed_at: z.number().nullable(),
  version: z.number().int().positive(),
  unread_count: z.number().int().nonnegative(),
  first_response_at: z.number().nullable(),
  first_response_seconds: z.number().int().nonnegative().nullable(),
  handling_seconds: z.number().int().nonnegative(),
});
const messageSchema = z.object({
  id: z.number().int().positive(),
  company_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  actor: personSchema.nullable(),
  kind: z.enum([
    "system",
    "customer_record",
    "whatsapp_inbound",
    "manual_outbound",
    "internal_note",
  ]),
  body: z.string(),
  created_at: z.number(),
});
export type Conversation = z.infer<typeof conversationSchema>;
export type ConversationMessage = z.infer<typeof messageSchema>;
export type Assignee = z.infer<typeof personSchema>;
export type NewConversation = {
  request_id: string;
  customer_name: string;
  customer_phone: string;
  customer_business: string;
  subject: string;
  assigned_user_id: string | null;
  initial_message: string;
};
function validated(companyId: string, value: unknown, id?: string) {
  const parsed = conversationSchema.safeParse(value);
  if (!parsed.success || parsed.data.company_id !== companyId || (id && parsed.data.id !== id))
    throw new ApiError(502, "Não foi possível validar o atendimento da empresa.");
  return parsed.data;
}
const summarySchema = z.object({
  company_id: z.string().uuid(),
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  unassigned: z.number().int().nonnegative(),
  unread_conversations: z.number().int().nonnegative(),
  unread_messages: z.number().int().nonnegative(),
});
export type ConversationSummary = z.infer<typeof summarySchema>;
export const conversationsApi = {
  async summary(companyId: string) {
    const result = summarySchema.safeParse(await apiRequest("/conversations/summary"));
    if (!result.success || result.data.company_id !== companyId)
      throw new ApiError(502, "Não foi possível validar os contadores da central.");
    return result.data;
  },
  async read(companyId: string, id: string, lastMessageId: number) {
    const result = z
      .object({
        company_id: z.string().uuid(),
        conversation_id: z.string().uuid(),
        last_message_id: z.number().int().positive(),
        unread_count: z.number().int().nonnegative(),
      })
      .safeParse(await apiRequest(`/conversations/${id}/read`, { last_message_id: lastMessageId }));
    if (
      !result.success ||
      result.data.company_id !== companyId ||
      result.data.conversation_id !== id
    )
      throw new ApiError(502, "Não foi possível validar a leitura do atendimento.");
    return result.data;
  },
  async updates(companyId: string, id: string, after: number) {
    const result = z
      .object({
        conversation: conversationSchema,
        messages: z.array(messageSchema),
        has_more: z.boolean(),
      })
      .safeParse(await apiRequest(`/conversations/${id}/updates?after=${after}`));
    if (
      !result.success ||
      result.data.messages.some(
        (message) => message.company_id !== companyId || message.conversation_id !== id,
      )
    )
      throw new ApiError(502, "Não foi possível validar as atualizações do atendimento.");
    return { ...result.data, conversation: validated(companyId, result.data.conversation, id) };
  },

  async list(
    companyId: string,
    params: { q?: string; mine?: boolean; offset?: number; unreadOnly?: boolean } = {},
  ) {
    const search = new URLSearchParams({
      limit: "100",
      q: params.q ?? "",
      mine: String(params.mine ?? false),
      unread_only: String(params.unreadOnly ?? false),
      offset: String(params.offset ?? 0),
    });
    const response = z
      .object({ items: z.array(conversationSchema), total: z.number().int().nonnegative() })
      .safeParse(await apiRequest(`/conversations?${search}`));
    if (!response.success || response.data.items.some((item) => item.company_id !== companyId))
      throw new ApiError(502, "Não foi possível validar a lista de atendimentos.");
    return response.data;
  },
  async assignees() {
    return z.array(personSchema).parse(await apiRequest("/conversations/assignees"));
  },
  async get(companyId: string, id: string) {
    return validated(companyId, await apiRequest(`/conversations/${id}`), id);
  },
  async create(companyId: string, input: NewConversation) {
    const {
      request_id,
      customer_name,
      customer_phone,
      customer_business,
      subject,
      assigned_user_id,
      initial_message,
    } = input;
    return validated(
      companyId,
      await apiRequest("/conversations", {
        request_id,
        customer_name,
        customer_phone,
        customer_business,
        subject,
        assigned_user_id,
        initial_message,
      }),
    );
  },
  async update(
    companyId: string,
    id: string,
    input: { version: number; status?: ConversationStatus; assigned_user_id?: string | null },
  ) {
    const { version, status, assigned_user_id } = input;
    return validated(
      companyId,
      await apiRequest(
        `/conversations/${id}`,
        {
          version,
          ...(status === undefined ? {} : { status }),
          ...(assigned_user_id === undefined ? {} : { assigned_user_id }),
        },
        "PATCH",
      ),
      id,
    );
  },
  async messages(companyId: string, id: string, before?: number) {
    const parsed = z
      .object({
        items: z.array(messageSchema),
        next_before: z.number().int().positive().nullable(),
      })
      .safeParse(
        await apiRequest(`/conversations/${id}/messages${before ? `?before=${before}` : ""}`),
      );
    if (
      !parsed.success ||
      parsed.data.items.some(
        (message) => message.company_id !== companyId || message.conversation_id !== id,
      )
    )
      throw new ApiError(502, "Não foi possível validar o histórico deste atendimento.");
    return parsed.data;
  },
  async record(
    companyId: string,
    id: string,
    input: {
      request_id: string;
      version: number;
      kind: "manual_outbound" | "internal_note";
      body: string;
    },
  ) {
    const { request_id, version, kind, body } = input;
    const response = z
      .object({ message: messageSchema, conversation: conversationSchema })
      .safeParse(
        await apiRequest(`/conversations/${id}/messages`, { request_id, version, kind, body }),
      );
    if (
      !response.success ||
      response.data.message.company_id !== companyId ||
      response.data.message.conversation_id !== id
    )
      throw new ApiError(502, "Não foi possível validar a mensagem registrada.");
    return {
      message: response.data.message,
      conversation: validated(companyId, response.data.conversation, id),
    };
  },
};
export function conversationTime(value: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value * 1000));
}

export function handlingTime(seconds: number | null) {
  if (seconds === null) return "Aguardando resposta";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
}
