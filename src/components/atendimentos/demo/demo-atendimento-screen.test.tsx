import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TenantProvider } from "@/lib/tenant/provider";
import { testWorkspaceContext } from "@/test/fixtures";
import { DemoAtendimentoScreen } from "./demo-atendimento-screen";

afterEach(cleanup);
function setup() {
  render(
    <TenantProvider value={testWorkspaceContext}>
      <DemoAtendimentoScreen />
    </TenantProvider>,
  );
}
async function open(name: string) {
  fireEvent.click(screen.getByRole("button", { name: `Abrir atendimento de ${name}` }));
  return screen.findByRole("dialog", { name });
}
describe("protótipo visual arquivado — sem vínculo com rotas de produção", () => {
  it("organizes the initial AI contact and the following stages into columns", () => {
    setup();
    const ia = screen.getByRole("region", { name: "Primeiro atendimento · IA" });
    expect(
      within(ia).getByRole("button", { name: "Abrir atendimento de Carlos Mendes" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Em orçamento" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Negociação" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Com vendedor" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Finalizado" })).toBeInTheDocument();
  });
  it("preserves the AI history and enables a reply only after human takeover", async () => {
    setup();
    const chat = within(await open("Carlos Mendes"));
    expect(chat.getByRole("textbox", { name: "Mensagem para o cliente" })).toBeDisabled();
    expect(chat.getByText("20 barras de 6 m")).toBeInTheDocument();
    fireEvent.click(chat.getByRole("button", { name: "Assumir atendimento" }));
    expect(chat.getByRole("combobox", { name: "Etapa do atendimento" })).toHaveValue("vendedor");
    const input = chat.getByRole("textbox", { name: "Mensagem para o cliente" });
    expect(input).toBeEnabled();
    fireEvent.change(input, { target: { value: "Olá, Carlos! Vou acompanhar seu pedido." } });
    fireEvent.click(chat.getByRole("button", { name: "Enviar mensagem" }));
    expect(
      within(chat.getByRole("log")).getByText("Olá, Carlos! Vou acompanhar seu pedido."),
    ).toBeInTheDocument();
    expect(
      within(chat.getByRole("log")).getByText(
        "Quero comprar metalon 30x30 chapa 18. Tem disponível?",
      ),
    ).toBeInTheDocument();
    expect(input).toHaveValue("");
  });
  it("allows returning the conversation to AI and pauses manual replies", async () => {
    setup();
    const chat = within(await open("Rafael Costa"));
    fireEvent.click(chat.getByRole("button", { name: "Devolver à IA" }));
    expect(chat.getByRole("combobox", { name: "Etapa do atendimento" })).toHaveValue("ia");
    expect(chat.getByRole("textbox", { name: "Mensagem para o cliente" })).toBeDisabled();
    expect(chat.getByText("Marina Silva devolveu o atendimento à IA.")).toBeInTheDocument();
  });
  it("moves a card between funnel columns by dragging", () => {
    setup();
    const stage = screen.getByRole("region", { name: "Em orçamento" });
    fireEvent.drop(stage, { dataTransfer: { getData: () => "4" } });
    expect(
      within(stage).getByRole("button", { name: "Abrir atendimento de Marcos Silva" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Negociação" })).queryByRole("button", {
        name: "Abrir atendimento de Marcos Silva",
      }),
    ).not.toBeInTheDocument();
  });
  it("returns control to AI when moving a human conversation into the first stage", async () => {
    setup();
    fireEvent.drop(screen.getByRole("region", { name: "Primeiro atendimento · IA" }), {
      dataTransfer: { getData: () => "5" },
    });
    const chat = within(await open("Rafael Costa"));
    expect(chat.getByRole("textbox", { name: "Mensagem para o cliente" })).toBeDisabled();
    expect(chat.getByRole("button", { name: "Assumir atendimento" })).toBeInTheDocument();
  });
  it("filters the board by responsible person and product", () => {
    setup();
    fireEvent.change(screen.getByRole("combobox", { name: "Filtrar responsável" }), {
      target: { value: "mine" },
    });
    expect(screen.getAllByRole("button", { name: /Abrir atendimento de/ })).toHaveLength(2);
    fireEvent.change(screen.getByRole("combobox", { name: "Filtrar responsável" }), {
      target: { value: "all" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar atendimento" }), {
      target: { value: "metalon" },
    });
    expect(screen.getAllByRole("button", { name: /Abrir atendimento de/ })).toHaveLength(2);
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar atendimento" }), {
      target: { value: "inexistente" },
    });
    expect(screen.queryByRole("button", { name: /Abrir atendimento de/ })).not.toBeInTheDocument();
  });
  it("requires reopening a finished conversation before replying", async () => {
    setup();
    const chat = within(await open("Paulo Santos"));
    expect(
      chat.queryByRole("textbox", { name: "Mensagem para o cliente" }),
    ).not.toBeInTheDocument();
    fireEvent.change(chat.getByRole("combobox", { name: "Etapa do atendimento" }), {
      target: { value: "vendedor" },
    });
    expect(chat.getByRole("textbox", { name: "Mensagem para o cliente" })).toBeEnabled();
  });
  it("starts a new local conversation in the initial AI stage", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Novo atendimento" }));
    const form = within(await screen.findByRole("dialog", { name: "Novo atendimento" }));
    fireEvent.change(form.getByRole("textbox", { name: "Nome do cliente" }), {
      target: { value: "Luiza Souza" },
    });
    fireEvent.change(form.getByRole("textbox", { name: "Empresa" }), {
      target: { value: "LS Obras" },
    });
    fireEvent.click(form.getByRole("button", { name: "Iniciar com IA" }));
    const chat = within(await screen.findByRole("dialog", { name: "Luiza Souza" }));
    expect(chat.getByRole("combobox", { name: "Etapa do atendimento" })).toHaveValue("ia");
    expect(chat.getByText(/Olá, Luiza Souza!/)).toBeInTheDocument();
    expect(chat.getByRole("textbox", { name: "Mensagem para o cliente" })).toBeDisabled();
  });
});
