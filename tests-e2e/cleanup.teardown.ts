/* eslint-disable no-console */
import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

teardown("cleanup test data", async () => {
  console.log("Cleaning up test data...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testUserId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.");
    return;
  }

  if (!testUserId) {
    console.error("Missing E2E_USERNAME_ID in environment variables. Cannot clean up recipes.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Delete all recipes belonging to the test user
  const { error } = await supabase.from("recipes").delete().eq("user_id", testUserId);

  if (error) {
    console.error("Error cleaning up recipes:", error);
  } else {
    console.log(`Successfully cleaned up recipes for user ${testUserId}`);
  }
});
