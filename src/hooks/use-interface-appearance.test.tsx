import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useInterfaceAppearance } from "./use-interface-appearance";
import { CustomAppearanceEditor } from "@/components/appearance/custom-appearance-editor";
import {
  customThemeStyle,
  defaultCustomAppearance,
  normalizeCustomAppearance,
} from "@/lib/interface-theme";

beforeEach(() => localStorage.clear());
afterEach(cleanup);
describe("complete interface appearance", () => {
  it("migrates the previous three preferences and validates imported values", () => {
    const value = normalizeCustomAppearance({ primary: "#123456", sidebar: "#ffffff", radius: 8 });
    expect(value).toMatchObject({
      primary: "#123456",
      sidebar: "#ffffff",
      radius: 8,
      font: "nunito",
      autoContrast: true,
    });
    expect(
      normalizeCustomAppearance({
        primary: "url(evil)",
        radius: 999,
        sidebarWidth: 999,
        textSize: "large",
        animations: "false",
      }),
    ).toMatchObject({
      primary: "#ff9800",
      radius: 24,
      sidebarWidth: 256,
      textSize: 16,
      animations: true,
    });
  });
  it("persists settings by company and applies and cleans up document variables", () => {
    const hook = renderHook(({ id }) => useInterfaceAppearance(id), {
      initialProps: { id: "empresa-a" },
    });
    act(() => hook.result.current.changeAppearance("custom"));
    act(() =>
      hook.result.current.changeCustom({
        primary: "#2563eb",
        font: "system",
        textSize: 18,
        shadow: "medium",
        stickyHeader: false,
        animations: false,
      }),
    );
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("#2563eb");
    expect(document.documentElement.style.getPropertyValue("--custom-font-size")).toBe("18px");
    expect(document.documentElement).toHaveAttribute("data-custom-sticky", "false");
    expect(document.documentElement).toHaveAttribute("data-custom-motion", "false");
    hook.rerender({ id: "empresa-b" });
    expect(hook.result.current.appearance).toBe("normal");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("");
    hook.rerender({ id: "empresa-a" });
    expect(hook.result.current.custom.font).toBe("system");
    expect(hook.result.current.custom.primary).toBe("#2563eb");
    act(() => hook.result.current.changeAppearance("clean"));
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("");
    hook.unmount();
    expect(document.documentElement).not.toHaveAttribute("data-appearance");
  });
  it("chooses separate readable text colors for dark surfaces and light buttons", () => {
    const style = customThemeStyle({
      ...defaultCustomAppearance,
      background: "#000000",
      card: "#1e293b",
      primary: "#ffffff",
    }) as Record<string, unknown>;
    expect(style["--foreground"]).toBe("#ffffff");
    expect(style["--card-foreground"]).toBe("#ffffff");
    expect(style["--primary-foreground"]).toBe("#172033");
  });
  it("preserves a valid mode if stored custom data is malformed", () => {
    localStorage.setItem("empresa-a", "clean");
    localStorage.setItem("empresa-a:custom", "{broken");
    const hook = renderHook(() => useInterfaceAppearance("empresa-a"));
    expect(hook.result.current.appearance).toBe("clean");
    expect(hook.result.current.custom).toEqual(defaultCustomAppearance);
  });
});
function Editor() {
  const theme = useInterfaceAppearance("editor");
  return (
    <CustomAppearanceEditor
      value={theme.custom}
      onChange={theme.changeCustom}
      onReset={theme.resetCustom}
      storageState={theme.storageState}
    />
  );
}
describe("appearance controls", () => {
  it("applies a preset and edits typography, menu width, effects and manual text colors", () => {
    render(<Editor />);
    fireEvent.click(screen.getByRole("button", { name: "Escuro" }));
    expect(JSON.parse(localStorage.getItem("editor:custom")!).background).toBe("#0f172a");
    fireEvent.change(screen.getByRole("combobox", { name: "Família da fonte" }), {
      target: { value: "outfit" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Largura do menu aberto" }), {
      target: { value: "320" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Sombra dos cards" }), {
      target: { value: "medium" },
    });
    const text = screen.getByRole("textbox", { name: "Texto principal: código hexadecimal" });
    expect(text).toBeDisabled();
    fireEvent.click(
      screen.getByRole("switch", { name: "Ajustar automaticamente a cor dos textos" }),
    );
    fireEvent.change(text, { target: { value: "#abcdef" } });
    expect(JSON.parse(localStorage.getItem("editor:custom")!)).toMatchObject({
      font: "outfit",
      sidebarWidth: 320,
      shadow: "medium",
      text: "#abcdef",
      autoContrast: false,
    });
    fireEvent.click(screen.getByRole("button", { name: "Restaurar padrão" }));
    expect(JSON.parse(localStorage.getItem("editor:custom")!)).toEqual(defaultCustomAppearance);
  });
  it("imports an exported theme and refuses malformed theme files", async () => {
    render(<Editor />);
    const input = screen.getByLabelText("Arquivo de tema");
    fireEvent.change(input, {
      target: {
        files: [
          {
            size: 100,
            text: async () =>
              JSON.stringify({
                version: 1,
                appearance: { ...defaultCustomAppearance, primary: "#663399", font: "system" },
              }),
          },
        ],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Tema importado e aplicado."),
    );
    expect(JSON.parse(localStorage.getItem("editor:custom")!).primary).toBe("#663399");
    fireEvent.change(input, { target: { files: [{ size: 100, text: async () => "invalid" }] } });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Não foi possível importar"),
    );
    expect(JSON.parse(localStorage.getItem("editor:custom")!).primary).toBe("#663399");
  });
});
