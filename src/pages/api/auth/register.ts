import type { APIRoute } from "astro";

import { registerSchema } from "@/lib/validation/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const parseResult = registerSchema.safeParse(body);
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

    const { email, password } = parseResult.data;

    // Attempt to create user with Supabase Auth
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Handle specific error cases
      let message = "Unable to create account. Please try again.";
      let code = "REGISTRATION_ERROR";

      if (error.message.includes("already registered")) {
        message = "An account with this email already exists";
        code = "EMAIL_ALREADY_EXISTS";
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code,
            message,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success - return user and session data
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_in: data.session.expires_in,
            }
          : null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
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
