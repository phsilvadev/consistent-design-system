import { testIdentity } from "./fixtures";
import type { Conversation } from "@/lib/auth/conversations";
export const conversationFixture: Conversation = {
  id: "22222222-2222-4222-8222-222222222222",
  company_id: testIdentity.company.id,
  customer: {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Carlos Mendes",
    phone: "5511999990101",
    business_name: "Construtora Vale",
  },
  assigned_user: { id: testIdentity.user.id, name: testIdentity.user.name, role: "admin" },
  subject: "Metalon 30x30 chapa 18",
  status: "human",
  channel: "manual",
  created_at: 1700000000,
  updated_at: 1700000000,
  closed_at: null,
  version: 1,
  unread_count: 0,
  first_response_at: null,
  first_response_seconds: null,
  handling_seconds: 0,
};
