import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";

interface LoginFormProps {
  redirectTo?: string;
  initialError?: string;
}

export function LoginForm({ redirectTo = "/", initialError }: LoginFormProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState(initialError || "");
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle Zod array-based field errors
        if (data.error?.fields) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(data.error.fields).forEach(([key, value]) => {
            // Zod returns arrays of error messages, take the first one
            if (Array.isArray(value) && value.length > 0) {
              fieldErrors[key] = value[0];
            }
          });
          setErrors(fieldErrors);
        }
        setFormError(data.error?.message || "Unable to connect. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success - redirect to target page
      window.location.href = redirectTo;
    } catch {
      setFormError("Unable to connect. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your recipes</CardDescription>
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
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <SubmitButton label="Login" loadingLabel="Logging in..." isLoading={isLoading} />
          <p className="text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{" "}
            <a href="/auth/register" className="text-primary hover:underline font-medium">
              Register here
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
