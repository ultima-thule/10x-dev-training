import { useCallback, useEffect, useState } from "react";

import type { ThemePreference } from "@/types/ui/landing";

const FALLBACK_THEME: ThemePreference = "light";

interface UseThemePreferenceOptions {
  storageKey?: string;
  initial?: ThemePreference;
}

interface UseThemePreferenceResult {
  theme: ThemePreference;
  isHydrated: boolean;
  toggleTheme: () => ThemePreference;
  setTheme: (next: ThemePreference) => ThemePreference;
}

const normalizeTheme = (value?: string | null): ThemePreference => (value === "dark" ? "dark" : "light");
const getWindow = () => {
  if (typeof globalThis === "undefined") {
    return undefined;
  }
  return globalThis.window;
};

export function useThemePreference(options: UseThemePreferenceOptions = {}): UseThemePreferenceResult {
  const { storageKey = "drt:theme", initial = FALLBACK_THEME } = options;
  const [theme, setTheme] = useState<ThemePreference>(initial);
  const [isHydrated, setIsHydrated] = useState(false);

  const applyTheme = useCallback((next: ThemePreference): ThemePreference => {
    const normalized = normalizeTheme(next);
    setTheme(normalized);
    return normalized;
  }, []);

  const syncFromDom = useCallback(() => {
    if (typeof document === "undefined") {
      return initial;
    }

    const root = document.documentElement;
    if (root.classList.contains("dark") || root.dataset.theme === "dark") {
      return "dark";
    }

    return "light";
  }, [initial]);

  useEffect(() => {
    setTheme(syncFromDom());
    setIsHydrated(true);
  }, [syncFromDom]);

  useEffect(() => {
    const win = getWindow();
    if (!win || !isHydrated) {
      return;
    }

    const normalized = normalizeTheme(theme);

    if (typeof win.__setPreferredTheme === "function") {
      win.__setPreferredTheme(normalized);
    } else if (typeof win.__applyTheme === "function") {
      win.__applyTheme(normalized);
    } else {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(normalized);
      root.dataset.theme = normalized;
      root.style.colorScheme = normalized;
    }

    try {
      win.localStorage.setItem(storageKey, normalized);
    } catch {
      /* no-op */
    }
  }, [theme, storageKey, isHydrated]);

  useEffect(() => {
    const win = getWindow();
    if (!win) {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey || !event.newValue) {
        return;
      }
      setTheme(normalizeTheme(event.newValue));
    };

    win.addEventListener("storage", handleStorage);
    return () => win.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  const toggleTheme = useCallback(() => applyTheme(theme === "dark" ? "light" : "dark"), [applyTheme, theme]);

  return {
    theme,
    isHydrated,
    toggleTheme,
    setTheme: applyTheme,
  };
}
