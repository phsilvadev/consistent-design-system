import { describe, it, expect, vi, beforeEach } from "vitest";
import { testIdentity } from "@/test/fixtures";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error("redirect:" + path);
  }),
  forbidden: vi.fn(() => {
    throw new Error("forbidden");
  }),
}));
vi.mock("@/lib/auth/server", () => ({ currentSession: mocks.session }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect, forbidden: mocks.forbidden }));
import WorkspaceLayout from "@/app/[tenant]/(workspace)/layout";
beforeEach(() => {
  vi.clearAllMocks();
});
describe("layout servidor valida independentemente do proxy", () => {
  it("bloqueia outro tenant mesmo sem executar o middleware", async () => {
    mocks.session.mockResolvedValue({ status: "authenticated", identity: testIdentity });
    await expect(
      WorkspaceLayout({
        children: "Dados privados",
        params: Promise.resolve({ tenant: "outra-empresa" }),
      }),
    ).rejects.toThrow("forbidden");
    expect(mocks.forbidden).toHaveBeenCalledOnce();
  });
  it("bloqueia sessão ausente", async () => {
    mocks.session.mockResolvedValue({ status: "anonymous" });
    await expect(
      WorkspaceLayout({
        children: "Dados privados",
        params: Promise.resolve({ tenant: testIdentity.company.id }),
      }),
    ).rejects.toThrow("redirect:/login");
  });
  it("bloqueia indisponibilidade da API", async () => {
    mocks.session.mockResolvedValue({ status: "unavailable" });
    await expect(
      WorkspaceLayout({
        children: "Dados privados",
        params: Promise.resolve({ tenant: testIdentity.company.id }),
      }),
    ).rejects.toThrow("redirect:/servico-indisponivel");
  });
  it("não retorna conteúdo comercial para trial vencido", async () => {
    mocks.session.mockResolvedValue({
      status: "authenticated",
      identity: { ...testIdentity, trial_expired: true },
    });
    const result = await WorkspaceLayout({
      children: "Dados privados",
      params: Promise.resolve({ tenant: testIdentity.company.id }),
    });
    expect(result.props.children).toBeUndefined();
  });
  it("encaminha ao guard apenas a identidade autorizada", async () => {
    mocks.session.mockResolvedValue({ status: "authenticated", identity: testIdentity });
    const result = await WorkspaceLayout({
      children: "Dados privados",
      params: Promise.resolve({ tenant: testIdentity.company.id }),
    });
    expect(result.props.initialIdentity).toEqual(testIdentity);
    expect(result.props.tenant).toBe(testIdentity.company.id);
  });
});
