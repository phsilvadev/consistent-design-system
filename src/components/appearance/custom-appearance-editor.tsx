"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  colorFields,
  defaultCustomAppearance,
  normalizeCustomAppearance,
  themePresets,
  validThemeColor,
  type ColorKey,
  type CustomAppearance,
} from "@/lib/interface-theme";
type Props = {
  value: CustomAppearance;
  onChange: (patch: Partial<CustomAppearance>) => void;
  onReset: () => void;
  storageState: "ready" | "saved" | "unavailable";
};
const manualText = new Set<ColorKey>([
  "text",
  "cardText",
  "mutedText",
  "buttonText",
  "headerText",
  "sidebarText",
]);
export function CustomAppearanceEditor({ value, onChange, onReset, storageState }: Props) {
  const upload = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  function exportTheme() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ version: 1, appearance: value }, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "atendehub-tema.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage("Tema exportado.");
  }
  async function importTheme(file?: File) {
    if (!file) return;
    if (file.size > 50000) {
      setMessage("Escolha um arquivo de tema com até 50 KB.");
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      if (
        parsed?.version !== 1 ||
        !validThemeColor(parsed?.appearance?.primary) ||
        !validThemeColor(parsed?.appearance?.sidebar)
      )
        throw new Error("invalid theme");
      onChange(normalizeCustomAppearance(parsed.appearance));
      setMessage("Tema importado e aplicado.");
    } catch {
      setMessage("Não foi possível importar. Escolha um arquivo de tema exportado pelo AtendeHUB.");
    }
  }
  function colors(group: string) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {colorFields
          .filter((field) => field.group === group)
          .map((field) => (
            <ColorField
              key={field.key}
              label={field.label}
              value={value[field.key]}
              disabled={value.autoContrast && manualText.has(field.key)}
              onChange={(color) => onChange({ [field.key]: color })}
            />
          ))}
      </div>
    );
  }
  return (
    <section
      aria-label="Personalização completa da interface"
      className="space-y-5 border-t p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Sua interface, do seu jeito</h3>
          <p className="mt-2 max-w-xl text-xs leading-5 text-muted-foreground">
            Personalize cores, fontes, menu, cards e gráficos. A página inteira funciona como
            prévia: cada ajuste aparece na hora.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onReset();
            setMessage("Personalização restaurada para o padrão.");
          }}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restaurar padrão
        </button>
      </div>
      <div className="rounded-xl border bg-muted/20 p-4">
        <h4 className="text-xs font-semibold">Comece com uma combinação</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {themePresets.map((preset) => (
            <button
              type="button"
              key={preset.name}
              onClick={() => {
                onChange({ ...defaultCustomAppearance, ...preset.colors });
                setMessage(`Combinação ${preset.name} aplicada.`);
              }}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: preset.colors.primary ?? defaultCustomAppearance.primary,
                }}
              />
              {preset.name}
            </button>
          ))}
        </div>
      </div>
      <Group
        title="Cores da interface"
        description="Defina o destaque, os fundos e as cores dos elementos principais."
      >
        {colors("interface")}
      </Group>
      <Group
        title="Textos e legibilidade"
        description="Use cores automáticas ou escolha manualmente os tons dos textos."
      >
        <Toggle
          id="auto-contrast"
          label="Ajustar automaticamente a cor dos textos"
          description="Adapta os textos aos fundos escolhidos. Desative para liberar as cores manuais."
          checked={value.autoContrast}
          onChange={(checked) => onChange({ autoContrast: checked })}
        />
        {colors("text")}
      </Group>
      <Group
        title="Menu lateral e cabeçalho"
        description="Ajuste a identidade do menu e o comportamento do topo da página."
      >
        {colors("menu")}
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="sidebar-width"
            label="Largura do menu aberto"
            value={value.sidebarWidth}
            onChange={(next) =>
              onChange({ sidebarWidth: Number(next) as CustomAppearance["sidebarWidth"] })
            }
            options={[
              [220, "Estreito · 220 px"],
              [256, "Padrão · 256 px"],
              [288, "Largo · 288 px"],
              [320, "Mais largo · 320 px"],
            ]}
          />
          <Toggle
            id="sticky-header"
            label="Manter o cabeçalho fixo"
            description="Deixa o menu superior visível ao rolar a página."
            checked={value.stickyHeader}
            onChange={(checked) => onChange({ stickyHeader: checked })}
          />
        </div>
      </Group>
      <Group
        title="Fontes e espaçamento"
        description="Escolha como as informações são apresentadas."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            id="custom-font"
            label="Família da fonte"
            value={value.font}
            onChange={(next) => onChange({ font: next as CustomAppearance["font"] })}
            options={[
              ["nunito", "Nunito Sans · suave"],
              ["outfit", "Outfit · moderna"],
              ["system", "Fonte do sistema"],
            ]}
          />
          <SelectField
            id="text-size"
            label="Tamanho dos textos"
            value={value.textSize}
            onChange={(next) =>
              onChange({ textSize: Number(next) as CustomAppearance["textSize"] })
            }
            options={[
              [14, "Pequeno"],
              [16, "Padrão"],
              [18, "Grande"],
            ]}
          />
          <SelectField
            id="heading-weight"
            label="Peso dos títulos"
            value={value.headingWeight}
            onChange={(next) =>
              onChange({ headingWeight: Number(next) as CustomAppearance["headingWeight"] })
            }
            options={[
              [500, "Médio"],
              [600, "Seminegrito"],
              [700, "Negrito"],
              [800, "Extranegrito"],
            ]}
          />
          <SelectField
            id="heading-case"
            label="Estilo dos títulos"
            value={value.headingCase}
            onChange={(next) => onChange({ headingCase: next as CustomAppearance["headingCase"] })}
            options={[
              ["normal", "Letras normais"],
              ["uppercase", "MAIÚSCULAS"],
            ]}
          />
          <SelectField
            id="custom-density"
            label="Espaçamento da interface"
            value={value.density}
            onChange={(next) => onChange({ density: next as CustomAppearance["density"] })}
            options={[
              ["compact", "Compacto"],
              ["comfortable", "Confortável"],
              ["spacious", "Espaçoso"],
            ]}
          />
        </div>
      </Group>
      <Group
        title="Cards, botões e efeitos"
        description="Personalize o acabamento dos componentes."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="custom-radius" className="text-xs font-semibold">
              Arredondamento dos cards · {value.radius} px
            </label>
            <input
              id="custom-radius"
              type="range"
              min={0}
              max={24}
              step={1}
              value={value.radius}
              onChange={(event) => onChange({ radius: Number(event.target.value) })}
              className="mt-4 w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Reto</span>
              <span>Arredondado</span>
            </div>
          </div>
          <SelectField
            id="button-radius"
            label="Formato dos botões"
            value={value.buttonRadius}
            onChange={(next) =>
              onChange({ buttonRadius: next as CustomAppearance["buttonRadius"] })
            }
            options={[
              ["square", "Reto"],
              ["soft", "Levemente arredondado"],
              ["pill", "Pílula"],
            ]}
          />
          <SelectField
            id="border-width"
            label="Espessura das bordas"
            value={value.borderWidth}
            onChange={(next) =>
              onChange({ borderWidth: Number(next) as CustomAppearance["borderWidth"] })
            }
            options={[
              [0, "Sem borda"],
              [1, "Fina · 1 px"],
              [2, "Marcada · 2 px"],
            ]}
          />
          <SelectField
            id="custom-shadow"
            label="Sombra dos cards"
            value={value.shadow}
            onChange={(next) => onChange({ shadow: next as CustomAppearance["shadow"] })}
            options={[
              ["none", "Sem sombra"],
              ["soft", "Suave"],
              ["medium", "Destacada"],
            ]}
          />
        </div>
        <Toggle
          id="custom-animations"
          label="Animações e transições"
          description="Ative os movimentos suaves da interface."
          checked={value.animations}
          onChange={(checked) => onChange({ animations: checked })}
        />
      </Group>
      <Group
        title="Cores dos gráficos"
        description="Escolha as cores das etapas no dashboard. A conversão usa a cor de indicadores positivos."
      >
        {colors("charts")}
      </Group>
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-semibold">Leve seu tema com você</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Exporte suas escolhas ou importe um tema salvo.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportTheme}
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar tema
            </button>
            <button
              type="button"
              onClick={() => upload.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              Importar tema
            </button>
            <input
              ref={upload}
              type="file"
              accept=".json,application/json"
              aria-label="Arquivo de tema"
              className="sr-only"
              onChange={(event) => {
                void importTheme(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>
        </div>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {storageState === "unavailable"
          ? "As alterações estão aplicadas, mas o navegador não permitiu salvá-las."
          : message ||
            (storageState === "saved"
              ? "Preferências salvas neste navegador para esta empresa."
              : "As alterações são salvas automaticamente neste navegador.")}
      </p>
    </section>
  );
}
function Group({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <details open className="rounded-xl border bg-card p-4">
      <summary className="cursor-pointer text-sm font-semibold">{title}</summary>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </details>
  );
}
function ColorField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <label className={`block text-xs font-semibold ${disabled ? "opacity-50" : ""}`}>
      <span>{label}</span>
      <span className="mt-2 flex items-center gap-2 rounded-lg border bg-card p-2">
        <input
          type="color"
          aria-label={`${label}: seletor de cor`}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-9 shrink-0 cursor-pointer border-0 bg-transparent"
        />
        <input
          type="text"
          aria-label={`${label}: código hexadecimal`}
          disabled={disabled}
          value={draft}
          maxLength={7}
          onChange={(event) => {
            setDraft(event.target.value);
            if (validThemeColor(event.target.value)) onChange(event.target.value);
          }}
          onBlur={() => {
            if (!validThemeColor(draft)) setDraft(value);
          }}
          className="min-w-0 flex-1 bg-transparent text-xs font-normal uppercase outline-none"
          spellCheck={false}
        />
      </span>
    </label>
  );
}
function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string | number;
  options: (readonly [string | number, string])[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border bg-card px-3 text-xs"
      >
        {options.map(([option, text]) => (
          <option key={option} value={option}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}
function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-xs font-semibold">
          {label}
        </label>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
