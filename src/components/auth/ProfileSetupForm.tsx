import { useState, useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";
type YearsAway = "less-than-1" | "1-2" | "3-5" | "more-than-5";

/**
 * ProfileSetupForm Component
 *
 * @implements US-004: Initial User Profile Setup
 * @implements auth-spec.md Section 2.2
 *
 * Collects user's previous experience level and time away from coding.
 * Submits data to /api/profile/setup and redirects to /dashboard on success.
 *
 * Error Handling:
 * - Validation errors: Display field-specific error messages
 * - Server errors: Display generic error message
 */
export function ProfileSetupForm() {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [yearsAway, setYearsAway] = useState<YearsAway | "">("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const experienceLevelId = useId();
  const yearsAwayId = useId();
  const errorId = useId();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!experienceLevel) {
      setError("Please select your experience level");
      return;
    }

    if (!yearsAway) {
      setError("Please select how long you've been away from coding");
      return;
    }

    setIsLoading(true);

    try {
      // Call API endpoint to save profile
      const response = await fetch("/api/profile/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          experienceLevel,
          yearsAway,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors (detailed error messages)
        if (response.status === 400 && data.error?.details) {
          // Extract first validation error message
          const firstError = data.error.details[0];
          setError(firstError?.message || data.error.message);
        } else {
          // Handle other errors (generic error messages for security)
          setError(data.error?.message || "An unexpected error occurred. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Success: Redirect to dashboard
      // Use globalThis.location for full page navigation to ensure proper state refresh
      globalThis.location.href = data.redirectUrl || "/dashboard";
    } catch (err) {
      // Handle network errors or unexpected failures
      // eslint-disable-next-line no-console
      console.error("[ProfileSetupForm] Network error:", err);
      setError("Unable to connect to the server. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <Alert variant="destructive" id={errorId} aria-live="polite">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor={experienceLevelId}>What was your experience level before taking a break?</Label>
        <Select
          value={experienceLevel}
          onValueChange={(value) => setExperienceLevel(value as ExperienceLevel)}
          disabled={isLoading}
        >
          <SelectTrigger
            id={experienceLevelId}
            aria-required="true"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : undefined}
          >
            <SelectValue placeholder="Select your experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner - Just starting out (0-2 years)</SelectItem>
            <SelectItem value="intermediate">Intermediate - Building confidence (2-4 years)</SelectItem>
            <SelectItem value="advanced">Advanced - Strong foundation (4-8 years)</SelectItem>
            <SelectItem value="expert">Expert - Deep expertise (8+ years)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">This helps us tailor your learning path</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={yearsAwayId}>How long have you been away from coding?</Label>
        <Select value={yearsAway} onValueChange={(value) => setYearsAway(value as YearsAway)} disabled={isLoading}>
          <SelectTrigger
            id={yearsAwayId}
            aria-required="true"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : undefined}
          >
            <SelectValue placeholder="Select time away" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="less-than-1">Less than 1 year</SelectItem>
            <SelectItem value="1-2">1-2 years</SelectItem>
            <SelectItem value="3-5">3-5 years</SelectItem>
            <SelectItem value="more-than-5">More than 5 years</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">We&apos;ll adjust the pace based on your break duration</p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Saving..." : "Complete setup"}
      </Button>
    </form>
  );
}
