import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";

const registerSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [formError, setFormError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    resetField,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.fields) {
          // Map backend field errors to react-hook-form
          Object.entries(data.error.fields).forEach(([field, message]) => {
            setError(field as keyof RegisterFormValues, {
              type: "manual",
              message: message as string,
            });
          });
        }
        setFormError(data.error?.message || "Unable to create account. Please try again.");

        // Clear passwords on error
        resetField("password");
        resetField("confirmPassword");
        setIsLoading(false);
        return;
      }

      window.location.assign("/auth/registration-success");
    } catch {
      setFormError("Unable to create account. Please try again.");
      resetField("password");
      resetField("confirmPassword");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your details to get started with 10x Recipes</CardDescription>
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

          <div className="space-y-2">
            <FormField
              label="Email"
              type="email"
              {...register("email")}
              error={errors.email?.message}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <FormField
              label="Password"
              type="password"
              {...register("password")}
              error={errors.password?.message}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </div>

          <div className="space-y-2">
            <FormField
              label="Confirm Password"
              type="password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
              required
              autoComplete="new-password"
              placeholder="Confirm your password"
            />
          </div>
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
