"use client";
import { useEffect, useMemo, useState } from "react";
import {
  customThemeStyle,
  defaultCustomAppearance,
  normalizeCustomAppearance,
  readableForeground,
  type CustomAppearance,
} from "@/lib/interface-theme";
export type Appearance = "normal" | "clean" | "custom";
export type { CustomAppearance } from "@/lib/interface-theme";
export function useInterfaceAppearance(key: string) {
  const [appearance, setAppearance] = useState<Appearance>("normal");
  const [custom, setCustom] = useState<CustomAppearance>({ ...defaultCustomAppearance });
  const [storageState, setStorageState] = useState<"ready" | "saved" | "unavailable">("ready");
  useEffect(() => {
    try {
      const mode = localStorage.getItem(key);
      setAppearance(mode === "clean" || mode === "custom" ? mode : "normal");
      let raw: unknown = null;
      try {
        raw = JSON.parse(localStorage.getItem(`${key}:custom`) ?? "null");
      } catch {
        /* Use defaults for malformed saved preferences. */
      }
      setCustom(normalizeCustomAppearance(raw));
      setStorageState("ready");
    } catch {
      setAppearance("normal");
      setCustom({ ...defaultCustomAppearance });
      setStorageState("unavailable");
    }
  }, [key]);
  const style = useMemo(
    () => (appearance === "custom" ? customThemeStyle(custom) : undefined),
    [appearance, custom],
  );
  // Apply to the document too so dialogs and sheets rendered in portals inherit the theme.
  useEffect(() => {
    const root = document.documentElement;
    const attributes = {
      "data-appearance": appearance,
      "data-custom-contrast": String(custom.autoContrast),
      "data-custom-sticky": String(custom.stickyHeader),
      "data-custom-motion": String(custom.animations),
    };
    const previousAttributes = Object.fromEntries(
      Object.keys(attributes).map((name) => [name, root.getAttribute(name)]),
    );
    for (const [name, value] of Object.entries(attributes)) root.setAttribute(name, value);
    const entries = Object.entries(style ?? {});
    const previousStyles = entries.map(([name]) => [name, root.style.getPropertyValue(name)]);
    for (const [name, value] of entries) root.style.setProperty(name, String(value));
    return () => {
      for (const [name, value] of Object.entries(previousAttributes)) {
        if (value === null) root.removeAttribute(name);
        else root.setAttribute(name, value);
      }
      for (const [name, value] of previousStyles) {
        if (value) root.style.setProperty(name!, value);
        else root.style.removeProperty(name!);
      }
    };
  }, [appearance, custom.autoContrast, custom.stickyHeader, custom.animations, style]);
  function changeAppearance(value: Appearance) {
    setAppearance(value);
    try {
      localStorage.setItem(key, value);
      setStorageState("saved");
    } catch {
      setStorageState("unavailable");
    }
  }
  function changeCustom(patch: Partial<CustomAppearance>) {
    const next = normalizeCustomAppearance({ ...custom, ...patch });
    setCustom(next);
    try {
      localStorage.setItem(`${key}:custom`, JSON.stringify(next));
      setStorageState("saved");
    } catch {
      setStorageState("unavailable");
    }
  }
  return {
    appearance,
    custom,
    changeAppearance,
    changeCustom,
    resetCustom: () => changeCustom(defaultCustomAppearance),
    style,
    storageState,
    logoWhite:
      appearance === "normal" ||
      (appearance === "custom" && readableForeground(custom.sidebar) === "#ffffff"),
  };
}
