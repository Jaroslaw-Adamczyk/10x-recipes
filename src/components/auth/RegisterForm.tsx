import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";

interface RegisterFormProps {
  redirectTo?: string;
}

export function RegisterForm({ redirectTo = "/" }: RegisterFormProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.fields) {
          setErrors(data.error.fields);
        }
        setFormError(data.error?.message || "Unable to create account. Please try again.");

        // Clear passwords on error
        setPassword("");
        setConfirmPassword("");
        setIsLoading(false);
        return;
      }

      // Success - redirect to target page
      window.location.href = redirectTo;
    } catch {
      setFormError("Unable to create account. Please try again.");
      setPassword("");
      setConfirmPassword("");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your details to get started with 10x Recipes</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {formError && (
            <div
              className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm"
              role="alert"
            >
              {formError}
            </div>
          )}

          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(value) => {
              setEmail(value);
              if (errors.email) {
                setErrors((prev) => ({ ...prev, email: "" }));
              }
            }}
            error={errors.email}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: "" }));
              }
            }}
            error={errors.password}
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />

          <FormField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }
            }}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
            placeholder="Confirm your password"
          />
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <SubmitButton label="Create Account" loadingLabel="Creating account..." isLoading={isLoading} />
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <a href="/auth/login" className="text-primary hover:underline font-medium">
              Login here
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
