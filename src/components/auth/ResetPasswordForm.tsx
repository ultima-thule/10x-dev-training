import { useState, useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordId = useId();
  const confirmPasswordId = useId();
  const messageId = useId();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    // TODO: Backend integration will be added in next steps
    // Extract token from URL and submit to API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="space-y-6">
        <Alert variant="success" id={messageId} aria-live="polite">
          <AlertDescription>
            Your password has been successfully reset. You can now sign in with your new password.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full" size="lg">
          <a href="/login">Continue to sign in</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <Alert variant="destructive" id={messageId} aria-live="polite">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor={passwordId}>New Password</Label>
        <Input
          id={passwordId}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          aria-required="true"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? messageId : undefined}
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">Must be at least 6 characters long</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={confirmPasswordId}>Confirm New Password</Label>
        <Input
          id={confirmPasswordId}
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          required
          aria-required="true"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? messageId : undefined}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Resetting password..." : "Reset password"}
      </Button>
    </form>
  );
}
