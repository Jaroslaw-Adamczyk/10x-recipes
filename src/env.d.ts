/// <reference types="astro/client" />

import type { Session, User } from "@supabase/supabase-js";

import type { SupabaseClient } from "./db/supabase.client.ts";

type Runtime = import("@astrojs/cloudflare").Runtime<Record<string, string>>;

declare global {
  namespace App {
    interface Locals extends Runtime {
      supabase: SupabaseClient;
      session: Session | null;
      user: User | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
