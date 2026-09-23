import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  // Middleware already verified the session and forwarded the user id —
  // skip re-verifying it here (that's a whole extra network call per page).
  // Falls back to a real check if the header is somehow missing.
  const headerList = await headers();
  let userId = headerList.get("x-user-id");

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    userId = user.id;
  }

  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data as Profile | null;
}
