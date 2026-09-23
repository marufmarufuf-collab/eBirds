import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

// Same idea as current-user.ts's header shortcut, but for server actions
// that only need the id (not the full profile) — search, send message,
// upload, admin checks, etc. Falls back to a real verification if the
// header isn't present for some reason.
export async function getVerifiedUserId(supabase: SupabaseClient): Promise<string | null> {
  const headerList = await headers();
  const fromHeader = headerList.get("x-user-id");
  if (fromHeader) return fromHeader;

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
