"use server";

import { createClient } from "@/lib/supabase/server";
import { getVerifiedUserId } from "@/lib/verified-user";

export async function blockUser(userId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const me = await getVerifiedUserId(supabase);
  if (!me) return { error: "Not signed in." };
  const { error } = await supabase.from("user_blocks").insert({ blocker_id: me, blocked_id: userId });
  if (error) return { error: error.message };
  return {};
}

export async function unblockUser(userId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const me = await getVerifiedUserId(supabase);
  if (!me) return { error: "Not signed in." };
  const { error } = await supabase.from("user_blocks").delete().eq("blocker_id", me).eq("blocked_id", userId);
  if (error) return { error: error.message };
  return {};
}

export async function isBlocked(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const me = await getVerifiedUserId(supabase);
  if (!me) return false;
  const { data } = await supabase
    .from("user_blocks")
    .select("blocker_id")
    .eq("blocker_id", me)
    .eq("blocked_id", userId)
    .maybeSingle();
  return !!data;
}

export async function reportUser(userId: string, reason: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const me = await getVerifiedUserId(supabase);
  if (!me) return { error: "Not signed in." };
  if (!reason.trim()) return { error: "Please describe the issue." };
  const { error } = await supabase
    .from("user_reports")
    .insert({ reporter_id: me, reported_user_id: userId, reason: reason.trim() });
  if (error) return { error: error.message };
  return {};
}
