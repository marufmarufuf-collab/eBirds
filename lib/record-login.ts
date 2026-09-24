import type { SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

// Called right after a successful sign-in (password or Google). Updates
// last_seen_at and drops a row in login_events so the Super Admin can see
// recent activity. Best-effort — never blocks or breaks login if it fails.
export async function recordLogin(supabase: SupabaseClient, userId: string) {
  try {
    const headerList = await headers();
    const userAgent = headerList.get("user-agent") ?? null;

    await Promise.all([
      supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId),
      supabase.from("login_events").insert({ user_id: userId, user_agent: userAgent }),
    ]);
  } catch {
    // Non-critical — never let logging break the login flow.
  }
}
