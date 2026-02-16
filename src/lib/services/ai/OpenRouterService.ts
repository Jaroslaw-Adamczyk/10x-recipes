import type { ChatParams, ChatResponse, ExtractionParams, OpenRouterResponse } from "../../../types";

export interface OpenRouterConfig {
  apiKey?: string;
  baseUrl?: string;
  siteUrl?: string;
  siteName?: string;
}

export class OpenRouterService {
  #apiKey: string;
  #baseUrl: string;
  #siteUrl: string;
  #siteName: string;

  constructor(config: OpenRouterConfig = {}) {
    this.#apiKey = config.apiKey || import.meta.env.OPENROUTER_API_KEY || "";
    this.#baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.#siteUrl = config.siteUrl || "http://localhost:3000";
    this.#siteName = config.siteName || "10x Recipes";

    if (!this.#apiKey) {
      // eslint-disable-next-line no-console
      console.warn("OpenRouter API key is missing. AI features will not work.");
    }
  }

  /**
   * Sends a list of messages to a specific model.
   */
  async completeChat(params: ChatParams): Promise<ChatResponse> {
    const response = await this.#execute("/chat/completions", {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.1,
      max_tokens: params.max_tokens,
      response_format: params.response_format,
    });

    const completion = response as OpenRouterResponse;
    const choice = completion.choices?.[0];

    if (!choice) {
      throw new Error("OpenRouter returned an empty response.");
    }

    return {
      content: choice.message.content,
      usage: completion.usage,
    };
  }

  /**
   * Uses response_format to extract structured data into a TypeScript-typed object.
   */
  async extractData<T>(params: ExtractionParams): Promise<T> {
    const response = await this.completeChat(params);

    try {
      return JSON.parse(response.content) as T;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to parse LLM response as JSON:", response.content, error);
      throw new Error("The AI returned an invalid data format. Please try again.");
    }
  }

  /**
   * The underlying fetch implementation that handles header injection and raw response processing.
   */
  async #execute(endpoint: string, body: unknown, retryCount = 0): Promise<unknown> {
    const url = `${this.#baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.#apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.#siteUrl,
          "X-Title": this.#siteName,
        },
        body: JSON.stringify(body),
      });

      // Handle Rate Limits (429) with exponential backoff
      if (response.status === 429 && retryCount < 3) {
        const delay = this.#backoff(retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.#execute(endpoint, body, retryCount + 1);
      }

      if (!response.ok) {
        let message = response.statusText;
        try {
          const errorData = await response.json();
          message = errorData.error?.message || message;
        } catch {
          // If response is not JSON, try to get text
          const text = await response.text().catch(() => "");
          if (text) message = text;
        }

        throw new Error(`OpenRouter API error (${response.status}): ${message}`);
      }

      return await response.json();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to connect to OpenRouter: ${String(error)}`);
    }
  }

  /**
   * Logic for calculating delays between retries using exponential backoff.
   */
  #backoff(retryCount: number): number {
    // 1s, 2s, 4s... + random jitter
    return Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
  }
}
