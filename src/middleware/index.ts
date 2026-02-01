import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/auth/login",
  "/auth/register",
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

  // Get session (this also handles token refresh internally)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Set context.locals for easy access in pages/API routes
  context.locals.supabase = supabase;
  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(context.url.pathname)) {
    return next();
  }

  // Redirect to login for protected routes if no session
  if (!session) {
    return context.redirect(`/auth/login?redirectTo=${encodeURIComponent(context.url.pathname)}`);
  }

  return next();
});
