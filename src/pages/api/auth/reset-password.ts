import type { APIRoute } from "astro";

import { resetPasswordSchema } from "@/lib/validation/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    const body = await request.json();

    const parseResult = resetPasswordSchema.safeParse(body);
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

    const { email } = parseResult.data;

    const redirectTo = `${url.origin}/auth/reset-password`;

    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      // Supabase may rate-limit recovery emails
      if (error.status === 429) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "RATE_LIMIT",
              message: "Too many requests. Please wait before trying again.",
            },
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Always return success to prevent email enumeration
    return new Response(
      JSON.stringify({
        success: true,
        message: "If an account exists with that email, a password reset link has been sent.",
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
