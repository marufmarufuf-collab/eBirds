"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, Message } from "@/types/database";

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

// Polled every 5s from the client instead of a realtime subscription —
// simpler to reason about and doesn't depend on Realtime being wired up.
export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data as Message[];
}

export async function sendMessage(conversationId: string, content: string, imageUrl?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  if (!content.trim() && !imageUrl) return;

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content.trim() || " ",
    image_url: imageUrl ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function uploadMessagePhoto(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { error: "Choose an image first." };
  if (!file.type.startsWith("image/")) return { error: "File must be an image." };
  if (file.size > 8 * 1024 * 1024) return { error: "Image must be under 8MB." };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("message-attachments").upload(path, file);
  if (uploadError) return { error: uploadError.message };

  const { data: pub } = supabase.storage.from("message-attachments").getPublicUrl(path);
  return { url: pub.publicUrl };
}
