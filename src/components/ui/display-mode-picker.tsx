"use client";
import { useState } from "react";
import { PanelsTopLeft, Maximize2, PanelRight, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
export type DisplayMode = "modal" | "fullscreen" | "aside";
const modes = [
  { id: "modal", label: "Modal", icon: PanelsTopLeft },
  { id: "fullscreen", label: "Tela cheia", icon: Maximize2 },
  { id: "aside", label: "Barra lateral", icon: PanelRight },
] as const;
export function DisplayModePicker({
  value,
  onChange,
  title = "Abrir formulário como",
  groupLabel = "Formato do formulário",
}: {
  value: DisplayMode;
  onChange: (mode: DisplayMode) => void;
  title?: string;
  groupLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-10 top-2 h-8 w-8 rounded-lg"
          aria-label="Modo de exibição"
          title="Modo de exibição"
        >
          <PanelsTopLeft className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[282px] rounded-2xl p-2">
        <p className="px-2 pb-2 pt-1 text-xs font-medium text-muted-foreground">{title}</p>
        <div className="grid grid-cols-3 gap-1" role="group" aria-label={groupLabel}>
          {modes.map((option) => (
            <button
              type="button"
              key={option.id}
              aria-pressed={value === option.id}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
              className={`relative flex flex-col items-center gap-2 rounded-xl px-1 py-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${value === option.id ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <span className="flex h-11 w-16 items-center justify-center rounded-md border bg-background shadow-sm">
                <option.icon className="h-6 w-6" />
              </span>
              {option.label}
              {value === option.id && (
                <Check className="absolute right-1 top-1 h-3 w-3 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
