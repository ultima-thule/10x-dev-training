import { useId } from "react";

import { useThemePreference } from "@/components/hooks/useThemePreference";
import { Button } from "@/components/ui/button";
import type { ThemePreference, ThemeToggleProps } from "@/types/ui/landing";

interface IconProps {
  className?: string;
}

const LABELS: Record<ThemePreference, string> = {
  light: "Włącz tryb ciemny",
  dark: "Włącz tryb jasny",
};

export function ThemeToggle({ id, initialTheme = "light", storageKey = "drt:theme" }: ThemeToggleProps) {
  const reactId = useId();
  const controlId = id ?? `theme-toggle-${reactId}`;

  const { theme, toggleTheme, isHydrated } = useThemePreference({
    storageKey,
    initial: initialTheme,
  });

  const visualTheme = isHydrated ? theme : initialTheme;
  const isDark = visualTheme === "dark";
  const label = LABELS[visualTheme];

  return (
    <Button
      id={controlId}
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      onClick={toggleTheme}
      className="h-10 w-10 rounded-full border border-border/70 bg-background/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 data-[state=dark]:text-yellow-300"
      data-state={visualTheme}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="relative flex items-center justify-center">
        {isDark ? <MoonIcon className="size-5 text-amber-200" /> : <SunIcon className="size-5 text-yellow-400" />}
      </span>
    </Button>
  );
}

function SunIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" className={className} focusable="false">
      <path
        d="M12 4.75V2.5m0 19v-2.25M7.07 7.07 5.5 5.5m13 13-1.57-1.57M4.75 12H2.5m19 0h-2.25M7.07 16.93 5.5 18.5m13-13-1.57 1.57M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" className={className} focusable="false">
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a.75.75 0 0 0-.71.48 7.25 7.25 0 1 0 8.73 8.73.75.75 0 0 0-.52-.94Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default ThemeToggle;
