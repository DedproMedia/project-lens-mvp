import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase-browser";

// The flashcards app should keep working in guest/localStorage-only mode if
// Supabase env vars aren't configured, rather than crashing the page.
export function safeSupabaseBrowser(): SupabaseClient | null {
  try {
    return supabaseBrowser();
  } catch {
    return null;
  }
}
