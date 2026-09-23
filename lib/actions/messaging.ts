"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, Message } from "@/types/database";

export type ConversationPreview = {
  conversationId: string;
  other: Profile;
  lastMessage: Message | null;
  updatedAt: string;
};

export async function getConversationList(): Promise<{
  conversations: ConversationPreview[];
  otherUsers: Profile[];
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { conversations: [], otherUsers: [] };

  const { data: convos } = await supabase
    .from("conversations")
    .select("id, user_a, user_b, created_at")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  const list = convos ?? [];
  const otherIds = list.map((c) => (c.user_a === user.id ? c.user_b : c.user_a));

  const { data: others } = otherIds.length
    ? await supabase.from("profiles").select("*").in("id", otherIds)
    : { data: [] as Profile[] };
  const otherById = new Map((others ?? []).map((p) => [p.id, p]));

  const { data: lastMessages } = list.length
    ? await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", list.map((c) => c.id))
        .order("created_at", { ascending: false })
    : { data: [] as Message[] };

  const lastByConvo = new Map<string, Message>();
  for (const m of lastMessages ?? []) {
    if (!lastByConvo.has(m.conversation_id)) lastByConvo.set(m.conversation_id, m);
  }

  const conversations: ConversationPreview[] = list
    .map((c) => {
      const other = otherById.get(c.user_a === user.id ? c.user_b : c.user_a);
      if (!other) return null;
      const lastMessage = lastByConvo.get(c.id) ?? null;
      return {
        conversationId: c.id,
        other,
        lastMessage,
        updatedAt: lastMessage?.created_at ?? c.created_at,
      };
    })
    .filter((x): x is ConversationPreview => x !== null)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // People you haven't started a conversation with yet, most recently joined first.
  const excludeIds = [user.id, ...otherIds];
  const { data: otherUsers } = await supabase
    .from("profiles")
    .select("*")
    .not("id", "in", `(${excludeIds.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(20);

  return { conversations, otherUsers: (otherUsers ?? []) as Profile[] };
}

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
