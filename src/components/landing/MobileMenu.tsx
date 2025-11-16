import { useEffect, useId } from "react";

import { useMobileMenu } from "@/components/hooks/useMobileMenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HeaderContent, ThemePreference } from "@/types/ui/landing";

import { getCtaButtonClasses } from "./cta";
import ThemeToggle from "./ThemeToggle";

interface MobileMenuProps {
  header: HeaderContent;
  themePreference?: ThemePreference;
  user?: { id: string; email: string } | null;
}

export default function MobileMenu({ header, themePreference = "light", user = null }: MobileMenuProps) {
  const { isOpen, toggle, close } = useMobileMenu();
  const dialogId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, close]);

  return (
    <>
      <div className="flex items-center gap-2 lg:hidden">
        <ThemeToggle initialTheme={themePreference} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isOpen ? "Zamknij menu nawigacji" : "Otwórz menu nawigacji"}
          aria-controls={dialogId}
          aria-expanded={isOpen}
          onClick={toggle}
          className="rounded-full border border-border/70 bg-background/80 shadow-sm"
        >
          <span aria-hidden="true">{isOpen ? <CloseIcon /> : <MenuIcon />}</span>
        </Button>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden="true"
        onClick={close}
      />

      <div
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-label="Menu nawigacji"
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-sm translate-x-full border-l border-border bg-background shadow-2xl transition-transform duration-200 lg:hidden",
          isOpen && "translate-x-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <span className="text-lg font-semibold text-foreground">{header.productName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Zamknij menu nawigacji"
            onClick={close}
            className="rounded-full border border-border/60"
          >
            <span aria-hidden="true">
              <CloseIcon />
            </span>
          </Button>
        </div>

        <div className="flex flex-col gap-6 px-6 py-6">
          <nav aria-label="Nawigacja mobilna">
            <ul className="flex flex-col gap-4 text-lg">
              {header.links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    aria-label={link.ariaLabel ?? link.label}
                    className="inline-flex w-full items-center justify-between rounded-md border border-transparent px-2 py-2 text-base font-medium text-foreground hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={close}
                  >
                    {link.label}
                    <span aria-hidden="true" className="text-muted-foreground">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {user ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Logged in as</p>
                <p className="text-sm font-medium text-foreground">{user.email}</p>
              </div>
              <a
                href="/dashboard"
                aria-label="Go to dashboard"
                className={getCtaButtonClasses("primary", "default", "w-full justify-center font-semibold")}
                onClick={close}
              >
                Go to Dashboard
              </a>
              <form
                action="/api/auth/logout"
                method="POST"
                onSubmit={(e) => {
                  e.preventDefault();
                  close();
                  fetch("/api/auth/logout", { method: "POST" }).then(() => {
                    globalThis.location.href = "/";
                  });
                }}
              >
                <Button type="submit" variant="ghost" className="w-full justify-center">
                  Log out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <a
                href={header.secondaryCTA.href}
                aria-label={header.secondaryCTA.ariaLabel ?? header.secondaryCTA.label}
                className={getCtaButtonClasses(header.secondaryCTA.variant, "default", "justify-center")}
                onClick={close}
              >
                {header.secondaryCTA.label}
              </a>
              <a
                href={header.primaryCTA.href}
                aria-label={header.primaryCTA.ariaLabel ?? header.primaryCTA.label}
                className={getCtaButtonClasses(
                  header.primaryCTA.variant,
                  "default",
                  "w-full justify-center font-semibold"
                )}
                onClick={close}
              >
                {header.primaryCTA.label}
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-foreground" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-foreground" aria-hidden="true">
      <path d="m6 6 12 12M6 18 18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
