import type { APIRoute } from "astro";

import { resetPasswordConfirmSchema } from "@/lib/validation/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    const parseResult = resetPasswordConfirmSchema.safeParse(body);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            fields: fieldErrors,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { password } = parseResult.data;

    // Session was established by exchangeCodeForSession on the reset-password page
    const {
      data: { user },
    } = await locals.supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_SESSION",
            message: "Your reset session has expired. Please request a new reset link.",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { error: updateError } = await locals.supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      const isSamePassword = updateError.code === "same_password";
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: isSamePassword ? "SAME_PASSWORD" : "UPDATE_FAILED",
            message: isSamePassword
              ? "New password must be different from your current password."
              : "Unable to update password. Please try again.",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password has been reset successfully.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to connect. Please try again.",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
