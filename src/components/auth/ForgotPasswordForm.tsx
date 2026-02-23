import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";
import { apiClient, ApiError } from "@/lib/apiClient";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [formError, setFormError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setFormError("");
    setIsLoading(true);

    try {
      await apiClient.post("/api/auth/reset-password", values);
      setIsSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: { message?: string } } | null;
        setFormError(body?.error?.message || "Unable to connect. Please try again.");
      } else {
        setFormError("Unable to connect. Please try again.");
      }
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Check your email</h2>

          <p className="text-muted-foreground text-sm leading-relaxed">
            If an account exists with that email, we&apos;ve sent a password reset link. Please check your inbox and
            spam folder.
          </p>

          <hr className="w-full border-border" />

          <a
            href="/auth/login"
            className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Back to Login
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <CardHeader>
          <CardTitle>Forgot password?</CardTitle>
          <CardDescription>Enter your email and we&apos;ll send you a link to reset your password</CardDescription>
        </CardHeader>

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
            type="email"
            {...register("email")}
            error={errors.email?.message}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <SubmitButton label="Send reset link" loadingLabel="Sending..." isLoading={isLoading} />
          <p className="text-sm text-muted-foreground text-center">
            Remember your password?{" "}
            <a href="/auth/login" className="text-primary hover:underline font-medium">
              Back to Login
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
