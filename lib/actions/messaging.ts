"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";

export async function searchUsers(query: string): Promise<Profile[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !query.trim()) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", user.id)
    .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);

  if (error) return [];
  return data as Profile[];
}

export async function startConversation(otherUserId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_or_create_conversation", { other_user: otherUserId });
  if (error || !data) throw new Error(error?.message || "Could not start conversation.");
  redirect(`/messages/${data}`);
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  if (!content.trim()) return;

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content.trim(),
  });

  if (error) throw new Error(error.message);
}
