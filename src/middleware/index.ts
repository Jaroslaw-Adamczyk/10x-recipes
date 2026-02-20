import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/auth/login",
  "/auth/register",
  "/auth/registration-success",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
];

export const onRequest = defineMiddleware(async (context, next) => {
  // Create per-request Supabase client
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Get authenticated user (verifies with Supabase Auth server)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set context.locals for easy access in pages/API routes
  context.locals.supabase = supabase;
  context.locals.session = null; // Not used - we use context.locals.user instead
  context.locals.user = user ?? null;

  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(context.url.pathname)) {
    return next();
  }

  // Handle authentication for protected routes
  if (!user) {
    // For API routes, return 401 JSON response instead of redirecting
    if (context.url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // For page routes, redirect to login
    return context.redirect(`/auth/login?redirectTo=${encodeURIComponent(context.url.pathname)}`);
  }

  return next();
});
