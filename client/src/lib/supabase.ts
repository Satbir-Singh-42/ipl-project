import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Graceful fallback: warn but don't crash if env vars are missing during dev
let supabase: SupabaseClient;

if (
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === "your_supabase_project_url_here"
) {
  console.warn(
    "Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env",
  );
  // Create a dummy client that will fail gracefully on queries
  supabase = createClient("https://placeholder.supabase.co", "placeholder");
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
