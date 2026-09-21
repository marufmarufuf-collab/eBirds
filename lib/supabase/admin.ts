import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVICE-ROLE client. Server-only. Never import this from a Client Component
// or expose SUPABASE_SERVICE_ROLE_KEY to the browser. Every function that
// uses this must independently verify the caller is super_admin first —
// this client bypasses RLS entirely.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
