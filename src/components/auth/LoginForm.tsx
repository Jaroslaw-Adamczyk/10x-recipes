import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";
import { apiClient, ApiError } from "@/lib/apiClient";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  redirectTo?: string;
  initialError?: string;
}

export function LoginForm({ redirectTo = "/", initialError }: LoginFormProps) {
  const [formError, setFormError] = React.useState(initialError || "");
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError("");
    setIsLoading(true);

    try {
      await apiClient.post("/api/auth/login", values);
      window.location.assign(redirectTo);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: { fields?: Record<string, unknown>; message?: string } } | null;
        if (body?.error?.fields) {
          Object.entries(body.error.fields).forEach(([key, value]) => {
            const message = Array.isArray(value) ? value[0] : value;
            setError(key as keyof LoginFormValues, { type: "manual", message: message as string });
          });
        }
        setFormError(body?.error?.message || "Unable to connect. Please try again.");
      } else {
        setFormError("Unable to connect. Please try again.");
      }
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your recipes</CardDescription>
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

          <div>
            <FormField
              label="Password"
              type="password"
              {...register("password")}
              error={errors.password?.message}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />
            <div className="mt-1 text-right">
              <a
                href="/auth/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </div>
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
