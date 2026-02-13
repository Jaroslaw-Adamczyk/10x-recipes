import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    // Sign out from Supabase (this clears the session cookies automatically via @supabase/ssr)
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
      // Still return success to avoid UX issues
      // Cookies are cleared client-side if server logout fails
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected logout error:", error);
    // Still return success - logout should be idempotent
    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
