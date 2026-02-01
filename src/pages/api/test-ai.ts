import type { APIRoute } from "astro";
import { openRouterService } from "../../lib/services/ai";

export const GET: APIRoute = async () => {
  try {
    const result = await openRouterService.completeChat({
      model: "google/gemini-2.0-flash-001",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Respond with 'OK' if you can hear me." },
      ],
      max_tokens: 10,
    });

    return new Response(JSON.stringify({ status: "success", response: result.content }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ status: "error", message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
