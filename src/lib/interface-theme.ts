import type { CSSProperties } from "react";
export const colorFields = [
  { key: "primary", label: "Destaque e botões", group: "interface" },
  { key: "background", label: "Fundo da página", group: "interface" },
  { key: "card", label: "Fundo dos cards", group: "interface" },
  { key: "header", label: "Cabeçalho", group: "interface" },
  { key: "border", label: "Bordas e campos", group: "interface" },
  { key: "success", label: "Indicadores positivos", group: "interface" },
  { key: "text", label: "Texto principal", group: "text" },
  { key: "cardText", label: "Texto dos cards", group: "text" },
  { key: "mutedText", label: "Texto secundário", group: "text" },
  { key: "buttonText", label: "Texto dos botões", group: "text" },
  { key: "headerText", label: "Texto do cabeçalho", group: "text" },
  { key: "sidebar", label: "Fundo do menu", group: "menu" },
  { key: "sidebarText", label: "Texto do menu", group: "menu" },
  { key: "sidebarActive", label: "Item selecionado", group: "menu" },
  { key: "chart1", label: "Em atendimento", group: "charts" },
  { key: "chart2", label: "Aguardando cliente", group: "charts" },
  { key: "chart3", label: "Em orçamento", group: "charts" },
  { key: "chart4", label: "Convertido em venda", group: "charts" },
  { key: "chart5", label: "Encerrado", group: "charts" },
] as const;
export type ColorKey = (typeof colorFields)[number]["key"];
export type CustomAppearance = Record<ColorKey, string> & {
  autoContrast: boolean;
  radius: number;
  buttonRadius: "square" | "soft" | "pill";
  font: "nunito" | "outfit" | "system";
  textSize: 14 | 16 | 18;
  headingWeight: 500 | 600 | 700 | 800;
  headingCase: "normal" | "uppercase";
  density: "compact" | "comfortable" | "spacious";
  sidebarWidth: 220 | 256 | 288 | 320;
  borderWidth: 0 | 1 | 2;
  shadow: "none" | "soft" | "medium";
  stickyHeader: boolean;
  animations: boolean;
};
export const defaultCustomAppearance: CustomAppearance = {
  primary: "#ff9800",
  background: "#f3f4f6",
  card: "#ffffff",
  header: "#ffffff",
  border: "#e2e8f0",
  success: "#16a34a",
  text: "#172033",
  cardText: "#172033",
  mutedText: "#64748b",
  buttonText: "#172033",
  headerText: "#172033",
  sidebar: "#1e293b",
  sidebarText: "#ffffff",
  sidebarActive: "#ff9800",
  chart1: "#3b82f6",
  chart2: "#f59e0b",
  chart3: "#8b5cf6",
  chart4: "#16a34a",
  chart5: "#94a3b8",
  autoContrast: true,
  radius: 12,
  buttonRadius: "pill",
  font: "nunito",
  textSize: 16,
  headingWeight: 700,
  headingCase: "uppercase",
  density: "comfortable",
  sidebarWidth: 256,
  borderWidth: 1,
  shadow: "none",
  stickyHeader: true,
  animations: true,
};
export function validThemeColor(value: unknown): value is string {
  return typeof value === "string" && /^#[a-f0-9]{6}$/i.test(value);
}
export function readableForeground(hex: string) {
  const values = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  return (values[0]! * 299 + values[1]! * 587 + values[2]! * 114) / 1000 > 155
    ? "#172033"
    : "#ffffff";
}
export function normalizeCustomAppearance(value: unknown): CustomAppearance {
  const result = { ...defaultCustomAppearance };
  if (!value || typeof value !== "object") return result;
  const raw = value as Record<string, unknown>;
  for (const { key } of colorFields) if (validThemeColor(raw[key])) result[key] = raw[key];
  if (typeof raw["radius"] === "number" && Number.isFinite(raw["radius"]))
    result.radius = Math.max(0, Math.min(24, Math.round(raw["radius"])));
  function choice<K extends keyof CustomAppearance>(
    key: K,
    values: readonly CustomAppearance[K][],
  ) {
    if (values.includes(raw[key] as CustomAppearance[K]))
      result[key] = raw[key] as CustomAppearance[K];
  }
  choice("buttonRadius", ["square", "soft", "pill"]);
  choice("font", ["nunito", "outfit", "system"]);
  choice("textSize", [14, 16, 18]);
  choice("headingWeight", [500, 600, 700, 800]);
  choice("headingCase", ["normal", "uppercase"]);
  choice("density", ["compact", "comfortable", "spacious"]);
  choice("sidebarWidth", [220, 256, 288, 320]);
  choice("borderWidth", [0, 1, 2]);
  choice("shadow", ["none", "soft", "medium"]);
  for (const key of ["autoContrast", "stickyHeader", "animations"] as const)
    if (typeof raw[key] === "boolean") result[key] = raw[key];
  return result;
}
export const themePresets: { name: string; colors: Partial<CustomAppearance> }[] = [
  { name: "Laranja clássico", colors: {} },
  {
    name: "Azul profissional",
    colors: {
      primary: "#2563eb",
      sidebarActive: "#2563eb",
      sidebar: "#172554",
      background: "#eff6ff",
      chart1: "#2563eb",
    },
  },
  {
    name: "Verde",
    colors: {
      primary: "#059669",
      sidebarActive: "#059669",
      sidebar: "#064e3b",
      background: "#f0fdf4",
      chart1: "#059669",
    },
  },
  {
    name: "Roxo",
    colors: {
      primary: "#7c3aed",
      sidebarActive: "#7c3aed",
      sidebar: "#2e1065",
      background: "#faf5ff",
      chart1: "#7c3aed",
    },
  },
  {
    name: "Escuro",
    colors: {
      primary: "#fb923c",
      sidebarActive: "#fb923c",
      background: "#0f172a",
      card: "#1e293b",
      header: "#1e293b",
      sidebar: "#020617",
      border: "#334155",
      text: "#f8fafc",
      mutedText: "#94a3b8",
      headerText: "#f8fafc",
    },
  },
];
export function customThemeStyle(theme: CustomAppearance): CSSProperties {
  const text = theme.autoContrast ? readableForeground(theme.background) : theme.text;
  const cardText = theme.autoContrast ? readableForeground(theme.card) : theme.cardText;
  const sidebarText = theme.autoContrast ? readableForeground(theme.sidebar) : theme.sidebarText;
  return {
    "--primary": theme.primary,
    "--primary-foreground": theme.autoContrast
      ? readableForeground(theme.primary)
      : theme.buttonText,
    "--ring": theme.primary,
    "--background": theme.background,
    "--foreground": text,
    "--card": theme.card,
    "--card-foreground": cardText,
    "--popover": theme.card,
    "--popover-foreground": cardText,
    "--muted": `color-mix(in srgb, ${theme.background} 90%, ${text})`,
    "--muted-foreground": theme.autoContrast
      ? `color-mix(in srgb, ${text} 70%, ${theme.background})`
      : theme.mutedText,
    "--accent": `color-mix(in srgb, ${theme.primary} 12%, ${theme.card})`,
    "--accent-foreground": cardText,
    "--secondary": `color-mix(in srgb, ${theme.primary} 15%, ${theme.card})`,
    "--secondary-foreground": cardText,
    "--border": theme.border,
    "--input": theme.border,
    "--success": theme.success,
    "--sidebar": theme.sidebar,
    "--sidebar-foreground": sidebarText,
    "--sidebar-accent-foreground": sidebarText,
    "--sidebar-accent": `color-mix(in srgb, ${theme.sidebar} 85%, ${sidebarText})`,
    "--sidebar-primary": theme.sidebarActive,
    "--sidebar-primary-foreground": theme.autoContrast
      ? readableForeground(theme.sidebarActive)
      : theme.buttonText,
    "--sidebar-border": theme.border,
    "--sidebar-ring": theme.primary,
    "--custom-success": theme.success,
    "--custom-chart-1": theme.chart1,
    "--custom-chart-2": theme.chart2,
    "--custom-chart-3": theme.chart3,
    "--custom-chart-4": theme.chart4,
    "--custom-chart-5": theme.chart5,
    "--chart-1": theme.chart1,
    "--chart-2": theme.chart2,
    "--chart-3": theme.chart3,
    "--chart-4": theme.chart4,
    "--chart-5": theme.chart5,
    "--radius": `${theme.radius}px`,
    "--custom-card-radius": `${theme.radius}px`,
    "--font-sans":
      theme.font === "nunito"
        ? '"Nunito Sans", sans-serif'
        : theme.font === "outfit"
          ? '"Outfit", sans-serif'
          : "system-ui, sans-serif",
    "--font-display":
      theme.font === "outfit"
        ? '"Outfit", sans-serif'
        : theme.font === "nunito"
          ? '"Nunito Sans", sans-serif'
          : "system-ui, sans-serif",
    "--custom-font-size": `${theme.textSize}px`,
    "--custom-heading-weight": theme.headingWeight,
    "--custom-heading-case": theme.headingCase === "normal" ? "none" : "uppercase",
    "--custom-sidebar-width": `${theme.sidebarWidth}px`,
    "--custom-border-width": `${theme.borderWidth}px`,
    "--custom-button-radius":
      theme.buttonRadius === "pill" ? "999px" : theme.buttonRadius === "soft" ? "8px" : "0px",
    "--custom-shadow":
      theme.shadow === "none"
        ? "none"
        : theme.shadow === "soft"
          ? "0 2px 8px rgb(0 0 0 / 6%)"
          : "0 8px 24px rgb(0 0 0 / 12%)",
    "--custom-page-padding":
      theme.density === "compact" ? "1rem" : theme.density === "spacious" ? "2.5rem" : "2rem",
    "--custom-panel-padding":
      theme.density === "compact" ? "1rem" : theme.density === "spacious" ? "2rem" : "1.5rem",
    "--custom-gap":
      theme.density === "compact" ? "0.75rem" : theme.density === "spacious" ? "2rem" : "1.5rem",
    "--custom-header": theme.header,
    "--custom-header-text": theme.autoContrast
      ? readableForeground(theme.header)
      : theme.headerText,
    "--custom-sidebar-text": sidebarText,
  } as CSSProperties;
}
