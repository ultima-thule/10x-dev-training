import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Logout Button Component
 * Interactive button for signing out of the application
 *
 * @implements US-003: User Logout
 * @implements auth-spec.md Section 2.2
 *
 * Features:
 * - Loading state during logout
 * - Form-based logout (POST to /api/auth/logout)
 * - Accessible with ARIA attributes
 * - Follows React best practices (functional component, hooks)
 */
export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
    } finally {
      // Always redirect to landing page (fail-safe)
      globalThis.location.href = "/";
    }
  };

  return (
    <form onSubmit={handleLogout}>
      <Button type="submit" variant="ghost" size="sm" disabled={isLoading} aria-label="Log out of your account">
        {isLoading ? "Logging out..." : "Log out"}
      </Button>
    </form>
  );
}
