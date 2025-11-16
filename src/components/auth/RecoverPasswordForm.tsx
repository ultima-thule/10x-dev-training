import { useState, useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emailId = useId();
  const messageId = useId();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    // TODO: Backend integration will be added in next steps
    // For now, just simulate a delay and show success
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="space-y-6">
        <Alert variant="success" id={messageId} aria-live="polite">
          <AlertDescription>
            If an account with this email exists, a recovery link has been sent. Please check your inbox and spam
            folder.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Button asChild variant="outline" className="w-full" size="lg">
            <a href="/login">Back to sign in</a>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive the email?{" "}
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
            >
              Try again
            </button>
          </p>
        </div>
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
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          aria-required="true"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? messageId : undefined}
          autoComplete="email"
        />
        <p className="text-xs text-muted-foreground">We&apos;ll send you a link to reset your password</p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send recovery link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <a
          href="/login"
          className="text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
        >
          Sign in
        </a>
      </p>
    </form>
  );
}
