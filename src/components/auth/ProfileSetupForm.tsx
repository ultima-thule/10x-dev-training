import { useState, useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";

export function ProfileSetupForm() {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [yearsAway, setYearsAway] = useState("");
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

    // TODO: Backend integration will be added in next steps
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    setError("Backend integration pending");
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
            <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
            <SelectItem value="intermediate">Intermediate (2-3 years)</SelectItem>
            <SelectItem value="advanced">Advanced (4-7 years)</SelectItem>
            <SelectItem value="expert">Expert (8+ years)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">This helps us tailor your learning path</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={yearsAwayId}>How long have you been away from coding?</Label>
        <Select value={yearsAway} onValueChange={setYearsAway} disabled={isLoading}>
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
