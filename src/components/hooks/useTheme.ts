/**
 * useTheme Hook
 * Reads the current theme from document element
 * Compatible with our custom theme bootstrap script
 */

import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  useEffect(() => {
    // Get initial theme from document
    const documentTheme = document.documentElement.dataset.theme as "light" | "dark" | undefined;
    setTheme(documentTheme || "light");

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.dataset.theme as "light" | "dark" | undefined;
      setTheme(currentTheme || "light");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => observer.disconnect();
  }, []);

  return { theme };
}
