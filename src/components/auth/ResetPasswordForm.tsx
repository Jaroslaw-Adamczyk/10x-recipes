import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";
import { apiClient, ApiError } from "@/lib/apiClient";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const [formError, setFormError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    resetField,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setFormError("");
    setIsLoading(true);

    try {
      await apiClient.post("/api/auth/reset-password-confirm", { password: values.password });
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: { message?: string } } | null;
        setFormError(body?.error?.message || "Unable to reset password. Please try again.");
      } else {
        setFormError("Unable to connect. Please try again.");
      }
      resetField("password");
      resetField("confirmPassword");
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
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
              className="text-green-600"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Password reset successful</h2>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Your password has been updated. You can now log in with your new password.
          </p>

          <a
            href="/auth/login"
            className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Go to Login
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <CardHeader>
          <CardTitle>Set new password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
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
            label="New password"
            type="password"
            {...register("password")}
            error={errors.password?.message}
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />

          <FormField
            label="Confirm new password"
            type="password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
            required
            autoComplete="new-password"
            placeholder="Confirm your password"
          />
        </CardContent>

        <CardFooter>
          <SubmitButton label="Reset password" loadingLabel="Resetting..." isLoading={isLoading} />
        </CardFooter>
      </form>
    </Card>
  );
}

interface InvalidTokenViewProps {
  message?: string;
}

export function InvalidTokenView({ message = "This reset link is invalid or has expired." }: InvalidTokenViewProps) {
  return (
    <Card className="w-full max-w-md">
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
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
            className="text-destructive"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight">Invalid reset link</h2>

        <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>

        <a
          href="/auth/forgot-password"
          className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Request a new link
        </a>
      </div>
    </Card>
  );
}
